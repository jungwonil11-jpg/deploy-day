// /backlog — 다음 버전에 할 거 보관함. pull로 스프린트로.
import { useApp } from '../store';
import { personaOf } from '../persona';
import { projColor } from '../types';
import { CliBox, PDot, Empty, PromptInput } from '../ui';

export function BacklogTab() {
  const s = useApp((st) => st.s);
  const addBacklog = useApp((st) => st.addBacklog);
  const deleteBacklog = useApp((st) => st.deleteBacklog);
  const pullBacklog = useApp((st) => st.pullBacklog);
  const p = personaOf(s);

  return (
    <CliBox title="backlog · 다음 버전에 할 거 미리 메모">
      <PromptInput placeholder="다음에 하고 싶은 거" button="backlog" onAdd={addBacklog} />
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
