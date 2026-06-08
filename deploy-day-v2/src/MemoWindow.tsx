// 메모 floating 창 — index.html?memo=<id> 로 진입. 메인과 이벤트로 통신.
import { useEffect, useRef, useState } from 'react';
import { getCurrentWebviewWindow, getAllWebviewWindows } from '@tauri-apps/api/webviewWindow';
import { currentMonitor } from '@tauri-apps/api/window';
import { emit, listen } from '@tauri-apps/api/event';
import { LogicalPosition, LogicalSize } from '@tauri-apps/api/dpi';
import { load } from '@tauri-apps/plugin-store';
import { kMemoColors, type Memo } from './types';

const win = getCurrentWebviewWindow();

type ProjOpt = { id: string; name: string; color: string };

export function MemoWindow({ id }: { id: string }) {
  const [memo, setMemo] = useState<Memo | null>(null);
  const [color, setColor] = useState(0);
  const [pinned, setPinned] = useState(false);
  const [dark, setDark] = useState(true);
  const [projects, setProjects] = useState<ProjOpt[]>([]);
  const [picking, setPicking] = useState(false);
  const debounce = useRef<number | undefined>(undefined);

  // 초기 데이터 로드 — 메인과 같은 store 파일을 직접 읽음 (공유 백엔드)
  useEffect(() => {
    (async () => {
      const store = await load('deployday.json');
      const state: any = await store.get('state');
      const m: Memo | undefined = state?.memos?.find((x: Memo) => x.id === id);
      if (m) {
        setMemo(m);
        setColor(m.color);
        setPinned(m.pinned);
      }
      setProjects(
        (state?.projects ?? [])
          .filter((p: any) => !p.done)
          .map((p: any) => ({ id: p.id, name: p.name, color: p.color })),
      );
      setDark(state?.dark ?? true);
    })();

    // 메인이 보내는 명령
    const un1 = listen('memo-kill', (e: any) => {
      if (e.payload?.id === id) win.close();
    });
    const un2 = listen<{ dark: boolean }>('memo-theme', (e) => setDark(e.payload.dark));
    return () => {
      un1.then((f) => f());
      un2.then((f) => f());
    };
  }, [id]);

  // 메인으로 patch 전송 (메인이 유일 writer)
  const patch = (p: Partial<Memo>) => emit('memo-patch', { id, patch: p });

  const onText = (text: string) => {
    setMemo((m) => (m ? { ...m, text } : m));
    window.clearTimeout(debounce.current);
    debounce.current = window.setTimeout(() => patch({ text }), 400);
  };

  const cycleColor = () => {
    const c = (color + 1) % kMemoColors.length;
    setColor(c);
    patch({ color: c });
  };

  const togglePin = async () => {
    const v = !pinned;
    setPinned(v);
    await win.setAlwaysOnTop(v);
    patch({ pinned: v });
  };

  // 빈 메모면 무시, 프로젝트 없으면 바로 미분류로, 있으면 선택 메뉴 표시
  const startToCommit = () => {
    const t = (memo?.text ?? '').trim();
    if (!t) return;
    if (projects.length === 0) { emit('memo-to-commit', { text: t, project: null }); return; }
    setPicking((v) => !v);
  };
  const sendToCommit = (project: string | null) => {
    const t = (memo?.text ?? '').trim();
    if (!t) return;
    emit('memo-to-commit', { text: t, project });
    setPicking(false);
  };

  const close = async () => {
    patch({ open: false });
    emit('memo-closed', { id });
    await win.close();
  };

  if (!memo) return <div style={{ background: '#1a1a1a', height: '100vh' }} />;

  const [bg, ink] = kMemoColors[Math.min(color, kMemoColors.length - 1)];
  void dark; // 메모는 자체 색 팔레트라 테마와 독립 (현재는 표시용)

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: bg, color: ink, fontFamily: "'JetBrains Mono','Consolas',monospace", position: 'relative' }}>
      {/* 미니 터미널 타이틀바 — 왼쪽 라벨만 드래그 영역, 버튼은 영역 밖(클릭 가능) */}
      <div style={{ height: 30, display: 'flex', alignItems: 'center', padding: '0 10px', background: 'rgba(255,255,255,.06)', flex: 'none' }}>
        <div data-tauri-drag-region style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, height: '100%' }}>
          <span style={{ color: '#d97757', fontWeight: 700, fontSize: 12, pointerEvents: 'none' }}>✻</span>
          <span style={{ fontSize: 12, opacity: 0.7, pointerEvents: 'none' }}>memo</span>
        </div>
        <Btn label="◑" tip="색 변경" onClick={cycleColor} ink={ink} />
        <Btn label="→commit" tip="커밋으로 (프로젝트 선택)" onClick={startToCommit} ink={picking ? '#d97757' : ink} />
        <Btn label={`[pin${pinned ? ' ●' : ''}]`} tip="항상 위" onClick={togglePin} ink={pinned ? '#d97757' : ink} />
        <Btn label="✕" tip="닫기" onClick={close} ink={ink} />
      </div>
      <div style={{ height: 1, background: 'rgba(128,128,128,.25)', flex: 'none' }} />

      {/* →commit 프로젝트 선택 드롭다운 */}
      {picking && (
        <>
          <div onClick={() => setPicking(false)} style={{ position: 'absolute', inset: 0, zIndex: 5 }} />
          <div
            style={{
              position: 'absolute', top: 31, right: 8, zIndex: 6, minWidth: 150, maxHeight: 180, overflowY: 'auto',
              background: '#1a1a1a', color: '#ececec', border: '1px solid #3a3a3a', borderRadius: 5,
              boxShadow: '0 6px 18px rgba(0,0,0,.5)', padding: 4, fontSize: 12,
            }}
          >
            <div style={{ padding: '5px 8px', opacity: 0.55, fontSize: 10 }}>어디로 보낼까?</div>
            <MenuItem label="미분류" color="#5c5c5c" onClick={() => sendToCommit(null)} />
            {projects.map((pp) => (
              <MenuItem key={pp.id} label={pp.name} color={pp.color} onClick={() => sendToCommit(pp.id)} />
            ))}
          </div>
        </>
      )}
      {/* 본문 */}
      <textarea
        value={memo.text}
        onChange={(e) => onText(e.target.value)}
        placeholder="> 메모..."
        autoFocus
        style={{
          flex: 1, resize: 'none', border: 'none', outline: 'none',
          background: 'transparent', color: ink, padding: '8px 12px',
          fontFamily: "'Nanum Gothic Coding','Malgun Gothic',monospace", fontSize: 13.5, lineHeight: 1.45,
        }}
      />
    </div>
  );
}

function MenuItem({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 8px', borderRadius: 4, cursor: 'pointer' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,.08)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flex: 'none' }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  );
}

function Btn({ label, tip, onClick, ink }: { label: string; tip: string; onClick: () => void; ink: string }) {
  return (
    <span title={tip} onClick={onClick} style={{ fontSize: 11, color: ink, opacity: 0.75, cursor: 'pointer', padding: '4px 5px' }}>
      {label}
    </span>
  );
}

const SNAP_DIST = 40; // 스냅 작동 거리(px)

// 위치/크기 추적 + 자석 스냅 (가장자리·형제 메모). 드래그 끝나면 스냅 슬라이드.
export async function trackMemoRect(id: string) {
  let settleTimer: number | undefined;
  let snapping = false;

  const logicalRect = async () => {
    const pos = await win.outerPosition();
    const size = await win.innerSize();
    const sf = await win.scaleFactor();
    const lp = pos.toLogical(sf);
    const ls = size.toLogical(sf);
    return { x: Math.round(lp.x), y: Math.round(lp.y), w: Math.round(ls.width), h: Math.round(ls.height) };
  };

  const sendRect = (r: { x: number; y: number; w: number; h: number }) =>
    emit('memo-patch', { id, patch: r });

  // 형제 메모 창들의 논리 사각형 (자기 제외)
  const siblingRects = async () => {
    const all = await getAllWebviewWindows();
    const out: { l: number; t: number; r: number; b: number }[] = [];
    for (const w of all) {
      if (w.label === win.label || !w.label.startsWith('memo-')) continue;
      try {
        const pos = await w.outerPosition();
        const size = await w.innerSize();
        const sf = await w.scaleFactor();
        const lp = pos.toLogical(sf);
        const ls = size.toLogical(sf);
        out.push({ l: lp.x, t: lp.y, r: lp.x + ls.width, b: lp.y + ls.height });
      } catch { /* 닫히는 중 */ }
    }
    return out;
  };

  // 스냅 목표 계산 — x/y 각각 가장 가까운 후보(거리 안쪽)로
  const computeSnap = async (r: { x: number; y: number; w: number; h: number }) => {
    let bestX: number | null = null, gapX = SNAP_DIST;
    let bestY: number | null = null, gapY = SNAP_DIST;
    const cx = (target: number, dist: number) => { if (dist < gapX) { gapX = dist; bestX = target; } };
    const cy = (target: number, dist: number) => { if (dist < gapY) { gapY = dist; bestY = target; } };
    const right = r.x + r.w, bottom = r.y + r.h;

    // A. 모니터 작업영역 가장자리
    const mon = await currentMonitor();
    if (mon) {
      const sf = mon.scaleFactor;
      const ml = mon.position.x / sf, mt = mon.position.y / sf;
      const mr = ml + mon.size.width / sf, mb = mt + mon.size.height / sf - 48; // 하단 작업표시줄 여유
      cx(ml, Math.abs(r.x - ml));
      cx(mr - r.w, Math.abs(right - mr));
      cy(mt, Math.abs(r.y - mt));
      cy(mb - r.h, Math.abs(bottom - mb));
    }
    // B. 형제 메모 — 마주보는 변 + 같은 변 정렬
    for (const s of await siblingRects()) {
      cx(s.r, Math.abs(r.x - s.r)); cx(s.l - r.w, Math.abs(right - s.l));
      cx(s.l, Math.abs(r.x - s.l)); cx(s.r - r.w, Math.abs(right - s.r));
      cy(s.b, Math.abs(r.y - s.b)); cy(s.t - r.h, Math.abs(bottom - s.t));
      cy(s.t, Math.abs(r.y - s.t)); cy(s.b - r.h, Math.abs(bottom - s.b));
    }
    const nx = bestX ?? r.x, ny = bestY ?? r.y;
    return nx === r.x && ny === r.y ? null : { x: nx, y: ny };
  };

  // ease-out 슬라이드
  const animateTo = async (from: { x: number; y: number }, tx: number, ty: number) => {
    snapping = true;
    const dx = tx - from.x, dy = ty - from.y;
    const steps = 12;
    for (let i = 1; i <= steps; i++) {
      const e = 1 - Math.pow(1 - i / steps, 3);
      await win.setPosition(new LogicalPosition(Math.round(from.x + dx * e), Math.round(from.y + dy * e)));
      await new Promise((res) => setTimeout(res, 12));
    }
    snapping = false;
  };

  const onSettle = async () => {
    if (snapping) return;
    const r = await logicalRect();
    const snap = await computeSnap(r);
    if (snap) {
      await animateTo({ x: r.x, y: r.y }, snap.x, snap.y);
      sendRect({ ...r, x: snap.x, y: snap.y });
    } else {
      sendRect(r);
    }
  };

  // 드래그 중엔 move 이벤트 연발 → 멈춘 뒤(220ms) 한 번만 스냅
  await win.onMoved(() => {
    if (snapping) return;
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => void onSettle(), 220);
  });
  await win.onResized(() => {
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => void (async () => sendRect(await logicalRect()))(), 220);
  });
}

export { LogicalPosition, LogicalSize };
