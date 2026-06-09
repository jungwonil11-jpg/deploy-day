// /backlog — 다음 버전에 할 거 보관함. pull로 스프린트로.
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
            <span className="iconbtn c-ship" onClick={() => pullBacklog(b.id)}>→ pull</span>
            <span className="iconbtn" onClick={() => deleteBacklog(b.id)}>✕</span>
          </div>
        ))
      )}
    </CliBox>
  );
}
