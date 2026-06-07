// /sprint — 프로젝트 칩 + 커밋 목록 + 배포 바.
import { useApp } from '../store';
import { personaOf, pfmt } from '../persona';
import {
  projName,
  projColor,
  projOrder,
  isShipDay,
  daysToShip,
  verStr,
  kDayKr,
  type Todo,
} from '../types';
import { CliBox, PDot, Empty, PromptInput } from '../ui';
import { uiPrompt, uiAlert } from '../dialogs';

export function SprintTab() {
  const s = useApp((st) => st.s);
  const active = useApp((st) => st.activeProject);
  const setActive = useApp((st) => st.setActiveProject);
  const addTodo = useApp((st) => st.addTodo);
  const toggleTodo = useApp((st) => st.toggleTodo);
  const editTodo = useApp((st) => st.editTodo);
  const deleteTodo = useApp((st) => st.deleteTodo);
  const moveTodoToProject = useApp((st) => st.moveTodoToProject);
  const addProject = useApp((st) => st.addProject);
  const ship = useApp((st) => st.ship);
  const p = personaOf(s);

  const target = active === 'all' ? '미분류' : projName(s, active);

  const editTodoPrompt = (t: Todo) => {
    uiPrompt(p.ui.todoEdit, t.text).then((v) => { if (v) editTodo(t.id, v); });
  };

  const addProjectPrompt = () => {
    uiPrompt(p.ui.projAdd, '', p.ui.projAddHint).then((v) => { if (v) addProject(v); });
  };

  // 완료 항목은 섹션 안에서 밑으로 가라앉음
  const sink = (its: Todo[]) => [...its.filter((t) => !t.done), ...its.filter((t) => t.done)];

  const TodoRow = ({ t }: { t: Todo }) => (
    <div
      className="row"
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('text/plain', t.id); e.dataTransfer.effectAllowed = 'move'; }}
      title="프로젝트 칩으로 끌어다 놓으면 이동"
    >
      <span
        className="iconbtn mono"
        style={{ fontSize: 17, color: t.done ? 'var(--ship)' : 'var(--dimmer)' }}
        onClick={() => toggleTodo(t.id)}
      >
        {t.done ? '☒' : '☐'}
      </span>
      <PDot color={projColor(s, t.project)} />
      <span
        className="grow kr"
        style={{
          fontSize: 15,
          color: t.done ? 'var(--dim)' : 'var(--txt)',
          textDecoration: t.done ? 'line-through' : 'none',
          cursor: 'text',
        }}
        onClick={() => editTodoPrompt(t)}
      >
        {t.text}
      </span>
      {t.carried && (
        <span
          className="mono"
          style={{
            fontSize: 10,
            color: 'var(--warn)',
            border: '1px solid var(--warn)',
            borderRadius: 4,
            padding: '1px 5px',
          }}
        >
          rollback
        </span>
      )}
      <span className="iconbtn" onClick={() => deleteTodo(t.id)}>✕</span>
    </div>
  );

  const rows: React.ReactNode[] = [];
  if (s.todos.length === 0) {
    rows.push(<Empty key="e" text={p.emptySprint} />);
  } else if (active === 'all') {
    for (const pid of projOrder(s)) {
      const its = s.todos.filter((t) => t.project === pid);
      if (its.length === 0) continue;
      const done = its.filter((t) => t.done).length;
      rows.push(
        <div key={`h-${pid}`} className="row" style={{ borderTop: 'none', paddingBottom: 6, gap: 8 }}>
          <PDot color={projColor(s, pid)} />
          <span className="mono" style={{ fontSize: 11 }}>{projName(s, pid)}</span>
          <span className="mono c-dimmer" style={{ fontSize: 11 }}> · {done}/{its.length}</span>
        </div>,
      );
      sink(its).forEach((t) => rows.push(<TodoRow key={t.id} t={t} />));
    }
  } else {
    const its = s.todos.filter((t) => t.project === active);
    if (its.length === 0) rows.push(<Empty key="e" text={p.ui.emptyProj} />);
    else sink(its).forEach((t) => rows.push(<TodoRow key={t.id} t={t} />));
  }

  const ready = isShipDay(s.shipDay);
  const doneN = s.todos.filter((t) => t.done).length;
  const shipLabel = ready
    ? `⏵⏵ ship ${verStr(s.major, s.minor + 1)} · ${doneN}건 완료`
    : `$ ship — D-${daysToShip(s.shipDay)} · ${doneN}/${s.todos.length} 완료`;

  const onShip = async () => {
    if (!ready) {
      uiAlert(pfmt(p.shipNotReady, { day: kDayKr[s.shipDay] }));
      return;
    }
    const title = (await uiPrompt(pfmt(p.ui.shipTitle, { ver: verStr(s.major, s.minor + 1) }), '', p.ui.shipHint)) ?? '';
    const rel = ship(title, []);
    uiAlert(pfmt(p.shipDone, { ver: verStr(rel.major, rel.minor) }));
  };

  const projects = s.projects.filter((pp) => !pp.done);

  return (
    <div>
      <div data-tut="project-chips" style={{ display: 'flex', flexWrap: 'wrap', gap: 7, alignItems: 'center' }}>
        <div
          className={`chip mono${active === 'all' ? ' on' : ''}`}
          onClick={() => setActive('all')}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); if (id) moveTodoToProject(id, null); }}
          title="여기 놓으면 미분류로"
        >
          전체
        </div>
        {projects.map((pp) => (
          <div
            key={pp.id}
            className={`chip mono${active === pp.id ? ' on' : ''}`}
            onClick={() => setActive(pp.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); if (id) moveTodoToProject(id, pp.id); }}
          >
            <PDot color={pp.color} />
            {pp.name}
          </div>
        ))}
        <div className="chip mono dashed" data-tut="add-project" onClick={addProjectPrompt}>+ 프로젝트</div>
      </div>

      <div style={{ height: 14 }} />

      <CliBox title="sprint · 다음 배포까지 쌓을 커밋">
        <div data-tut="commit-input">
          <PromptInput placeholder={`[${target}] 할 거 입력 (Enter)`} button="commit" onAdd={addTodo} />
        </div>
        <div data-tut="todo-list">{rows}</div>
      </CliBox>

      <div className={`shipbar mono ${ready ? 'ready' : 'wait'}`} data-tut="ship-bar" onClick={onShip}>
        {shipLabel}
      </div>
    </div>
  );
}
