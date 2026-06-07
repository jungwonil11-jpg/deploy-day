// /memo — 바탕화면 포스트잇 관리 (목록·생성·열기·삭제).
import { useApp } from '../store';
import { personaOf } from '../persona';
import { kMemoColors } from '../types';
import { CliBox, Empty } from '../ui';
import { uiConfirm } from '../dialogs';

export function MemoTab() {
  const s = useApp((st) => st.s);
  const newMemo = useApp((st) => st.newMemo);
  const openMemo = useApp((st) => st.openMemo);
  const deleteMemo = useApp((st) => st.deleteMemo);
  const p = personaOf(s);

  return (
    <CliBox title="memo · 바탕화면 포스트잇 (항상 위)">
      <div className="row" style={{ borderTop: 'none', justifyContent: 'space-between' }}>
        <span className="mono c-dimmer" style={{ fontSize: 11 }}>끌어서 옮기면 가장자리·다른 메모에 자석처럼 붙음</span>
        <span className="chip mono" onClick={() => void newMemo()}>+ memo</span>
      </div>
      {s.memos.length === 0 ? (
        <Empty text={p.emptyMemo} />
      ) : (
        s.memos.map((m) => {
          const [bg] = kMemoColors[Math.min(m.color, kMemoColors.length - 1)];
          const preview = m.text.trim() ? m.text.trim().split('\n')[0] : '(빈 메모)';
          return (
            <div key={m.id} className="row">
              <span className="pdot" style={{ background: bg, border: '1px solid var(--border)' }} />
              <span className="grow kr" style={{ fontSize: 14, color: m.text.trim() ? 'var(--txt)' : 'var(--dimmer)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {preview}
              </span>
              {m.open ? (
                <span className="mono c-ship" style={{ fontSize: 11 }}>떠있음</span>
              ) : (
                <span className="iconbtn c-accent" onClick={() => void openMemo(m.id)}>→ 열기</span>
              )}
              <span
                className="iconbtn"
                onClick={() => uiConfirm(p.ui.memoDelAsk, '삭제').then((ok) => { if (ok) void deleteMemo(m.id); })}
              >
                ✕
              </span>
            </div>
          );
        })
      )}
    </CliBox>
  );
}
