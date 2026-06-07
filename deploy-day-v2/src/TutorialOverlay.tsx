// 코치마크 오버레이 — 타겟에 구멍 뚫고 설명 풍선. 페르소나 문구.
import { useEffect, useState } from 'react';
import { useApp } from './store';
import { useTutorial, TUT_STEPS } from './tutorial';
import { personaOf } from './persona';

export function TutorialOverlay() {
  const step = useTutorial((t) => t.step);
  const next = useTutorial((t) => t.next);
  const skipStep = useTutorial((t) => t.skipStep);
  const stop = useTutorial((t) => t.stop);
  const checkAuto = useTutorial((t) => t.checkAuto);
  const s = useApp((st) => st.s);
  const p = personaOf(s);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const cur = step === null ? null : TUT_STEPS[step];

  // 상태 변화 → auto 단계 자동 진행 판정
  useEffect(() => {
    if (step === null) return;
    checkAuto();
  }, [s, step, checkAuto]);

  // 타겟 위치 측정 (탭 전환·렌더 후) — 약간 지연 + 스크롤
  useEffect(() => {
    if (!cur) { setRect(null); return; }
    let alive = true;
    const measure = (tries = 0) => {
      if (!alive) return;
      const el = cur.targetId ? (document.querySelector(`[data-tut="${cur.targetId}"]`) as HTMLElement | null) : null;
      if (!el) { setRect(null); if (cur.targetId && tries < 10) setTimeout(() => measure(tries + 1), 80); return; }
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      setTimeout(() => { if (alive) setRect(el.getBoundingClientRect()); }, 160);
    };
    measure();
    return () => { alive = false; };
  }, [step, cur]);

  if (step === null || !cur) return null;

  const manual = !cur.auto;
  const last = step + 1 >= TUT_STEPS.length;
  const text = p.tutorial[cur.key] ?? '';
  const hole = rect ? { left: rect.left - 6, top: rect.top - 6, width: rect.width + 12, height: rect.height + 12 } : null;

  // 풍선 위치: 타겟 위/아래 (없으면 중앙)
  const below = !hole || hole.top < window.innerHeight / 2;
  const bubbleStyle: React.CSSProperties = hole
    ? { position: 'fixed', left: '50%', transform: 'translateX(-50%)', ...(below ? { top: hole.top + hole.height + 12 } : { bottom: window.innerHeight - hole.top + 12 }) }
    : { position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
      {/* 가림막 — 구멍 영역만 빼고 4분할로 덮어 클릭 통과 */}
      {hole ? (
        <>
          <Scrim left={0} top={0} right={0} height={hole.top} />
          <Scrim left={0} top={hole.top + hole.height} right={0} bottom={0} />
          <Scrim left={0} top={hole.top} width={hole.left} height={hole.height} />
          <Scrim left={hole.left + hole.width} top={hole.top} right={0} height={hole.height} />
          {/* 하이라이트 테두리 */}
          <div style={{ position: 'fixed', left: hole.left, top: hole.top, width: hole.width, height: hole.height, border: '2px solid var(--accent)', borderRadius: 6, pointerEvents: 'none' }} />
        </>
      ) : (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.72)' }} onClick={() => {}} />
      )}

      {/* 설명 풍선 */}
      <div style={{ ...bubbleStyle, width: 'min(460px, calc(100vw - 48px))', background: 'var(--panel)', border: '1px solid var(--accent)', borderRadius: 6, padding: '16px 18px' }}>
        <div className="mono c-accent" style={{ fontSize: 11 }}>tutorial · {step + 1}/{TUT_STEPS.length}</div>
        <div className="kr" style={{ fontSize: 14, lineHeight: 1.7, marginTop: 8, whiteSpace: 'pre-line', color: 'var(--txt)' }}>{text}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
          <span className="mono" style={{ fontSize: 12, color: 'var(--dimmer)', cursor: 'pointer' }} onClick={stop}>✕ 튜토리얼 그만하기</span>
          <span style={{ flex: 1 }} />
          <span className="mono" style={{ fontSize: 12, color: 'var(--dim)', cursor: 'pointer' }} onClick={skipStep}>건너뛰기 →</span>
          {manual && (
            <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--bg)', background: 'var(--accent)', borderRadius: 5, padding: '6px 12px', cursor: 'pointer' }} onClick={next}>
              {last ? '⏵⏵ 시작' : '다음 →'}
            </span>
          )}
          {!manual && <span className="mono" style={{ fontSize: 11, color: 'var(--dim)', fontStyle: 'italic' }}>↑ 직접 해보면 넘어가요</span>}
        </div>
      </div>
    </div>
  );
}

function Scrim(props: { left: number; top: number; right?: number; bottom?: number; width?: number; height?: number }) {
  const { left, top, right, bottom, width, height } = props;
  return (
    <div
      onClick={() => {}}
      style={{
        position: 'fixed', left, top,
        right: right !== undefined ? right : undefined,
        bottom: bottom !== undefined ? bottom : undefined,
        width: width !== undefined ? width : undefined,
        height: height !== undefined ? height : undefined,
        background: 'rgba(0,0,0,.72)',
      }}
    />
  );
}
