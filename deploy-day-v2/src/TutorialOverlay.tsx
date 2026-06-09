// 코치마크 오버레이 — 타겟을 밝게 비추고 설명 풍선을 띄운다.
// 가림막은 "시각 전용"(pointer-events:none) — 클릭·드래그가 모두 페이지로 통과하므로
// 스포트라이트 밖이라도 실제 조작(드래그 reorder/move 등)이 막히지 않는다.
import { useEffect, useState } from 'react';
import { useApp } from './store';
import { useTutorial, TUT_STEPS, isManual } from './tutorial';
import { personaOf } from './persona';
import { useUI } from './i18n';

export function TutorialOverlay() {
  const step = useTutorial((t) => t.step);
  const next = useTutorial((t) => t.next);
  const skipStep = useTutorial((t) => t.skipStep);
  const stop = useTutorial((t) => t.stop);
  const check = useTutorial((t) => t.check);
  const s = useApp((st) => st.s);
  const tab = useApp((st) => st.tab);
  const p = personaOf(s);
  const L = useUI();
  const [rect, setRect] = useState<DOMRect | null>(null);

  const cur = step === null ? null : TUT_STEPS[step];

  // 상태·탭 변화 → watch/awaitTab 자동완료 판정
  useEffect(() => {
    if (step === null) return;
    check();
  }, [s, tab, step, check]);

  // 타겟 위치 측정 (탭 전환·렌더·리스트 변화 후) + 리사이즈 추적
  useEffect(() => {
    if (!cur) { setRect(null); return; }
    let alive = true;
    const find = () =>
      cur.targetId ? (document.querySelector(`[data-tut="${cur.targetId}"]`) as HTMLElement | null) : null;
    const measure = (tries = 0) => {
      if (!alive) return;
      const el = find();
      if (!el) { setRect(null); if (cur.targetId && tries < 12) setTimeout(() => measure(tries + 1), 80); return; }
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      setTimeout(() => { if (alive) setRect(el.getBoundingClientRect()); }, 180);
    };
    measure();
    const onResize = () => { const el = find(); if (el) setRect(el.getBoundingClientRect()); };
    window.addEventListener('resize', onResize);
    return () => { alive = false; window.removeEventListener('resize', onResize); };
  }, [step, cur, tab, s]);

  if (step === null || !cur) return null;

  const manual = isManual(cur);
  const last = step + 1 >= TUT_STEPS.length;
  const text = p.tutorial[cur.key] ?? '';
  const hole = rect
    ? { left: rect.left - 6, top: rect.top - 6, width: rect.width + 12, height: rect.height + 12 }
    : null;

  // 풍선: 타겟 아래(타겟이 화면 위쪽) 또는 위. 타겟 없으면 화면 중앙.
  // cur.place 가 있으면 강제 (드래그 대상이 가려지는 단계용).
  const below = cur.place === 'above' ? false : cur.place === 'below' ? true : (!hole || hole.top < window.innerHeight / 2);
  const posStyle: React.CSSProperties = hole
    ? { position: 'fixed', left: '50%', transform: 'translateX(-50%)', ...(below ? { top: hole.top + hole.height + 14 } : { bottom: window.innerHeight - hole.top + 14 }) }
    : { position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%)' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, pointerEvents: 'none' }}>
      {/* 가림막 — 시각 전용. 구멍만 밝게 남기고 4분할로 덮음(클릭/드래그 통과). */}
      {hole ? (
        <>
          <Scrim left={0} top={0} right={0} height={Math.max(0, hole.top)} />
          <Scrim left={0} top={hole.top + hole.height} right={0} bottom={0} />
          <Scrim left={0} top={hole.top} width={Math.max(0, hole.left)} height={hole.height} />
          <Scrim left={hole.left + hole.width} top={hole.top} right={0} height={hole.height} />
          <div className="tut-spot" style={{ left: hole.left, top: hole.top, width: hole.width, height: hole.height }} />
        </>
      ) : (
        <div className="tut-dim" />
      )}

      {/* 설명 풍선 — 단계마다 remount(key)해서 pop 애니 재생 */}
      <div style={posStyle}>
        <div key={step} className="tut-card">
          <div className="mono c-accent" style={{ fontSize: 11 }}>tutorial · {step + 1}/{TUT_STEPS.length}</div>
          <div className="kr" style={{ fontSize: 14, lineHeight: 1.7, marginTop: 8, whiteSpace: 'pre-line', color: 'var(--txt)' }}>{text}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
            <span className="mono" style={{ fontSize: 12, color: 'var(--dimmer)', cursor: 'pointer' }} onClick={stop}>{L.tutStop}</span>
            <span style={{ flex: 1 }} />
            {!last && <span className="mono" style={{ fontSize: 12, color: 'var(--dim)', cursor: 'pointer' }} onClick={skipStep}>{L.tutSkip}</span>}
            {manual ? (
              <span className="tut-cta mono" onClick={next}>{last ? L.tutStart : L.tutNext}</span>
            ) : (
              <span className="mono tut-hint">{below ? '↑' : '↓'} {L.tutDoHint}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Scrim(props: { left: number; top: number; right?: number; bottom?: number; width?: number; height?: number }) {
  const { left, top, right, bottom, width, height } = props;
  return (
    <div
      className="tut-scrim"
      style={{
        left, top,
        right: right !== undefined ? right : undefined,
        bottom: bottom !== undefined ? bottom : undefined,
        width: width !== undefined ? width : undefined,
        height: height !== undefined ? height : undefined,
      }}
    />
  );
}
