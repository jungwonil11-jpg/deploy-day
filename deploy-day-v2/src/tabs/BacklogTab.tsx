// /backlog — 다음 버전에 할 거 보관함. pull 시 프로젝트(미분류 포함)를 골라 스프린트로.
import { useState } from 'react';
import { useApp } from '../store';
import { personaOf } from '../persona';
import { projColor } from '../types';
import { useUI } from '../i18n';
import { CliBox, PDot, Empty, PromptInput } from '../ui';

export function BacklogTab() {
  const s = useApp((st) => st.s);
  const addBacklog = useApp((st) => st.addBacklog);
  const deleteBacklog = useApp((st) => st.deleteBacklog);
  const pullBacklog = useApp((st) => st.pullBacklog);
  const p = personaOf(s);
  const L = useUI();
  // pull 프로젝트 선택 드롭다운 (fixed — 박스 overflow 에 안 잘림)
  const [pick, setPick] = useState<{ id: string; top: number; right: number } | null>(null);

  const openPick = (id: string, e: React.MouseEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPick({ id, top: r.bottom + 4, right: window.innerWidth - r.right });
  };
  const doPull = (project: string | null) => {
    if (pick) pullBacklog(pick.id, project);
    setPick(null);
  };

  return (
    <CliBox title={L.backlogTitle}>
      <PromptInput placeholder={L.backlogPh} button="backlog" onAdd={addBacklog} />
      {s.backlog.length === 0 ? (
        <Empty text={p.emptyBacklog} />
      ) : (
        s.backlog.map((b) => (
          <div key={b.id} className="row">
            <PDot color={projColor(s, b.project)} />
            <span className="grow kr" style={{ fontSize: 15 }}>{b.text}</span>
            <span className="iconbtn c-ship" onClick={(e) => openPick(b.id, e)}>→ pull</span>
            <span className="iconbtn" onClick={() => deleteBacklog(b.id)}>✕</span>
          </div>
        ))
      )}

      {pick && (
        <>
          <div onClick={() => setPick(null)} style={{ position: 'fixed', inset: 0, zIndex: 150 }} />
          <div
            style={{
              position: 'fixed', top: pick.top, right: pick.right, zIndex: 151,
              minWidth: 160, maxHeight: 240, overflowY: 'auto',
              background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 6,
              padding: 4, boxShadow: '0 8px 24px rgba(0, 0, 0, .5)',
            }}
          >
            <div className="mono c-dimmer" style={{ padding: '5px 10px', fontSize: 10 }}>{L.mwSendWhere}</div>
            <PickRow color="#5c5c5c" label={L.unfiled} onClick={() => doPull(null)} />
            {s.projects.map((pp) => (
              <PickRow key={pp.id} color={pp.color} label={pp.name} onClick={() => doPull(pp.id)} />
            ))}
          </div>
        </>
      )}
    </CliBox>
  );
}

function PickRow({ color, label, onClick }: { color: string; label: string; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="kr"
      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 14, whiteSpace: 'nowrap' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--panel2)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <PDot color={color} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
    </div>
  );
}
