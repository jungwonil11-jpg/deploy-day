// /sprint — 프로젝트 칩 + 커밋 목록 + 배포 바.
// 순서변경: v1(Flutter ReorderableListView)을 포인터 이벤트 + FLIP 애니메이션으로 포팅.
//  - 행/칩 어디를 잡아도 드래그(5px 임계값으로 클릭과 구분). ≡ 는 affordance.
//  - WebView2가 HTML5 드래그를 OS 드롭으로 가로채 죽이므로 pointer capture 기반.
//  - 행/핸들은 컴포넌트가 아닌 plain JSX — 리렌더에도 DOM 노드 유지(캡처·애니 보존).
import { useLayoutEffect, useRef, useState } from 'react';
import { useApp } from '../store';
import { personaOf, pfmt } from '../persona';
import {
  projName,
  projColor,
  projOrder,
  isShipDay,
  daysToShip,
  verStr,
  dayTok,
  type Todo,
} from '../types';
import { useUI, fmt } from '../i18n';
import { CliBox, PDot, Empty, PromptInput } from '../ui';
import { uiPrompt, uiAlert, uiConfirm } from '../dialogs';
import { useTutorial, TUT_STEPS } from '../tutorial';

const NULL_PID = '∅'; // 미분류(null) 프로젝트를 data 속성에 표기
const DRAG_THRESHOLD = 5; // 이 픽셀 넘게 움직여야 드래그로 인정(아니면 클릭)

type DragState =
  // todo 드래그는 전체 작업목록의 라이브 복사본(live)을 들고 다님 — 그룹 넘나드는 자유 이동 지원.
  | { kind: 'todo'; activeId: string; live: Todo[] }
  | { kind: 'project'; order: string[]; activeId: string };

type Down = {
  x: number; y: number; el: HTMLElement; pointerId: number;
  kind: 'todo' | 'project'; pid?: string | null; done?: boolean; ids: string[]; id: string;
};

export function SprintTab() {
  const s = useApp((st) => st.s);
  const active = useApp((st) => st.activeProject);
  const setActive = useApp((st) => st.setActiveProject);
  const addTodo = useApp((st) => st.addTodo);
  const toggleTodo = useApp((st) => st.toggleTodo);
  const editTodo = useApp((st) => st.editTodo);
  const deleteTodo = useApp((st) => st.deleteTodo);
  const setTodos = useApp((st) => st.setTodos);
  const addProject = useApp((st) => st.addProject);
  const renameProject = useApp((st) => st.renameProject);
  const deleteProject = useApp((st) => st.deleteProject);
  const reorderProjects = useApp((st) => st.reorderProjects);
  const ship = useApp((st) => st.ship);
  const p = personaOf(s);
  const L = useUI();

  const [drag, setDrag] = useState<DragState | null>(null);
  const downRef = useRef<Down | null>(null);
  const movedRef = useRef(false); // 드래그 직후 클릭 억제용

  // 드래그 고스트 — 원본 행 크기·모양 그대로 반투명 복제가 커서를 따라옴.
  // 잡은 지점(offX/offY)을 기준으로 추적해 "행을 그대로 들어올린" 느낌. ref로 위치만 갱신(re-render X).
  const ghostRef = useRef<HTMLDivElement>(null);
  const ptr = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const ghostGeo = useRef<{ w: number; offX: number; offY: number }>({ w: 0, offX: 0, offY: 0 });
  const moveGhost = () => {
    if (ghostRef.current) {
      const g = ghostGeo.current;
      ghostRef.current.style.transform = `translate(${ptr.current.x - g.offX}px, ${ptr.current.y - g.offY}px)`;
    }
  };

  /* ---------- FLIP 애니메이션 (reorder 시 미끄러지듯) ---------- */
  const elRefs = useRef<Map<string, HTMLElement>>(new Map());
  // 위치는 offsetTop/offsetLeft(순수 레이아웃 좌표)로 측정 — transform·스크롤 영향 없음.
  // (getBoundingClientRect는 진행중 transform·스크롤까지 반영해 FLIP 피드백 루프 유발)
  const prevPos = useRef<Map<string, { top: number; left: number }>>(new Map());
  const regEl = (key: string) => (el: HTMLElement | null) => {
    if (el) elRefs.current.set(key, el);
    else elRefs.current.delete(key);
  };
  const activeKey = drag ? (drag.kind === 'todo' ? 't:' : 'p:') + drag.activeId : null;
  useLayoutEffect(() => {
    elRefs.current.forEach((el, key) => {
      const cur = { top: el.offsetTop, left: el.offsetLeft };
      const prev = prevPos.current.get(key);
      prevPos.current.set(key, cur);
      if (!prev) return;
      const dx = prev.left - cur.left, dy = prev.top - cur.top;
      if (key === activeKey) { el.style.transition = 'none'; el.style.transform = ''; return; } // 잡은 건 즉시 제자리
      if (!dx && !dy) return;
      el.style.transition = 'none';
      el.style.transform = `translate(${dx}px,${dy}px)`; // 이전 위치로 되돌려놓고
      requestAnimationFrame(() => {
        el.style.transition = 'transform 150ms ease';
        el.style.transform = ''; // 0으로 미끄러짐
        el.style.pointerEvents = 'none'; // 미끄러지는 동안 hit-test 제외(진동 방지)
        const end = () => { el.style.pointerEvents = ''; el.style.transition = ''; el.removeEventListener('transitionend', end); };
        el.addEventListener('transitionend', end);
      });
    });
    prevPos.current.forEach((_, key) => { if (!elRefs.current.has(key)) prevPos.current.delete(key); });
  });

  const target = active === 'all' ? L.unfiled : projName(s, active);
  const editTodoPrompt = (t: Todo) => { uiPrompt(p.ui.todoEdit, t.text).then((v) => { if (v) editTodo(t.id, v); }); };
  const addProjectPrompt = () => { uiPrompt(p.ui.projAdd, '', p.ui.projAddHint).then((v) => { if (v) addProject(v); }); };
  const renameProjectPrompt = (id: string, name: string) => {
    uiPrompt(p.ui.projRename, name, p.ui.projAddHint).then((v) => { if (v) renameProject(id, v); });
  };
  const deleteProjectConfirm = (id: string, name: string) => {
    const n = s.todos.filter((t) => t.project === id).length; // 함께 삭제될 커밋 수
    uiConfirm(pfmt(p.ui.projDelAsk, { name, n }), L.delLabel).then((ok) => { if (ok) deleteProject(id); });
  };

  const hit = (x: number, y: number, sel: string): HTMLElement | null =>
    ((document.elementFromPoint(x, y) as HTMLElement | null)?.closest(sel) as HTMLElement | null) ?? null;

  // 드래그 직후 클릭이면 무시
  const guard = (fn: () => void) => () => { if (movedRef.current) return; fn(); };

  /* ---------- 공통 포인터 핸들러 (행/칩) ---------- */
  const onDown = (e: React.PointerEvent, c: Omit<Down, 'x' | 'y' | 'el' | 'pointerId'>) => {
    if (e.button !== 0) return;
    ptr.current = { x: e.clientX, y: e.clientY };
    downRef.current = { x: e.clientX, y: e.clientY, el: e.currentTarget as HTMLElement, pointerId: e.pointerId, ...c };
    movedRef.current = false;
  };
  const onMove = (e: React.PointerEvent) => {
    ptr.current = { x: e.clientX, y: e.clientY };
    moveGhost(); // 드래그 중이면 고스트가 커서 따라옴
    if (drag?.kind === 'todo') { todoMove(e); return; }
    if (drag?.kind === 'project') { projMove(e); return; }
    const d = downRef.current;
    if (!d) return;
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < DRAG_THRESHOLD) return; // 아직 클릭일 수도
    movedRef.current = true;
    d.el.setPointerCapture(d.pointerId);
    if (d.kind === 'todo') {
      // 잡은 행의 크기·잡은 지점 기록 → 고스트가 같은 크기로 그 지점 기준 따라옴
      const r = d.el.getBoundingClientRect();
      ghostGeo.current = { w: r.width, offX: d.x - r.left, offY: d.y - r.top };
      setDrag({ kind: 'todo', activeId: d.id, live: [...s.todos] });
    } else setDrag({ kind: 'project', order: d.ids, activeId: d.id });
  };
  const onUp = (e: React.PointerEvent) => {
    if (drag?.kind === 'todo') todoUp(e);
    else if (drag?.kind === 'project') projUp();
    downRef.current = null;
  };

  // 아무 행 위에나 끌면 그 행 옆에 삽입 + 그 행의 프로젝트로 재배정 (그룹 넘나듦 자유).
  const todoMove = (e: React.PointerEvent) => {
    if (drag?.kind !== 'todo') return;
    const el = hit(e.clientX, e.clientY, '[data-rowid]');
    if (!el) return;
    const overId = el.getAttribute('data-rowid')!;
    if (overId === drag.activeId) return;
    const cur = drag.live;
    const active = cur.find((t) => t.id === drag.activeId);
    const over = cur.find((t) => t.id === overId);
    if (!active || !over) return;
    const r = el.getBoundingClientRect();
    const after = e.clientY > r.top + r.height / 2; // 행 중앙 아래면 뒤에, 위면 앞에
    const moved = active.project === over.project ? active : { ...active, project: over.project };
    const without = cur.filter((t) => t.id !== drag.activeId);
    let i = without.findIndex((t) => t.id === overId);
    if (after) i += 1;
    without.splice(i, 0, moved);
    const same = without.length === cur.length && without.every((t, j) => t.id === cur[j].id && t.project === cur[j].project);
    if (same) return; // 변화 없으면 리렌더 생략
    setDrag({ ...drag, live: without });
  };
  const todoUp = (e: React.PointerEvent) => {
    if (drag?.kind === 'todo') {
      let final = drag.live;
      // 칩 위에 떨궜으면 그 프로젝트로(전체 칩=미분류) 강제 재배정
      const chip = hit(e.clientX, e.clientY, '[data-projchip]');
      if (chip) {
        const raw = chip.getAttribute('data-projid');
        const pid = raw && raw !== NULL_PID ? raw : null;
        final = drag.live.map((t) => (t.id === drag.activeId ? { ...t, project: pid } : t));
      }
      setTodos(final);
    }
    setDrag(null);
  };
  const projMove = (e: React.PointerEvent) => {
    if (drag?.kind !== 'project') return;
    const el = hit(e.clientX, e.clientY, '[data-projchip]');
    if (!el) return;
    const overId = el.getAttribute('data-projid');
    if (!overId || overId === NULL_PID || overId === drag.activeId || !drag.order.includes(overId)) return;
    const o = [...drag.order];
    o.splice(o.indexOf(overId), 0, o.splice(o.indexOf(drag.activeId), 1)[0]);
    setDrag({ ...drag, order: o });
  };
  const projUp = () => {
    if (drag?.kind === 'project') reorderProjects(drag.order);
    setDrag(null);
  };

  // ≡ 핸들 (시각용 affordance — 실제 드래그는 행/칩 전체가 받음)
  const grip = (
    <span style={{ cursor: 'grab', color: 'var(--dimmer)', fontSize: 14, padding: '0 4px', userSelect: 'none' }}>≡</span>
  );

  // 커밋 행
  const todoRow = (t: Todo, baseIds: string[]) => {
    const dragging = drag?.kind === 'todo' && drag.activeId === t.id;
    return (
      <div
        key={t.id}
        ref={regEl('t:' + t.id)}
        className="row"
        data-rowid={t.id}
        onPointerDown={(e) => onDown(e, { kind: 'todo', pid: t.project, done: t.done, ids: baseIds, id: t.id })}
        onPointerMove={onMove}
        onPointerUp={onUp}
        style={{ cursor: 'grab', touchAction: 'none', ...(dragging ? { opacity: 0.4 } : null) }}
      >
        {grip}
        <span
          className="iconbtn mono"
          style={{ fontSize: 17, color: t.done ? 'var(--ship)' : 'var(--dimmer)' }}
          onClick={guard(() => toggleTodo(t.id))}
        >
          {t.done ? '☒' : '☐'}
        </span>
        <PDot color={projColor(s, t.project)} />
        <span
          className="grow kr"
          style={{ fontSize: 15, color: t.done ? 'var(--dim)' : 'var(--txt)', textDecoration: t.done ? 'line-through' : 'none', cursor: 'text' }}
          onClick={guard(() => editTodoPrompt(t))}
        >
          {t.text}
        </span>
        {t.carried && (
          <span className="mono" style={{ fontSize: 10, color: 'var(--warn)', border: '1px solid var(--warn)', borderRadius: 4, padding: '1px 5px' }}>
            rollback
          </span>
        )}
        <span className="iconbtn" onClick={guard(() => deleteTodo(t.id))}>✕</span>
      </div>
    );
  };

  // 한 섹션(같은 프로젝트 + 같은 완료상태) — 들어온 순서대로 렌더 (라이브 목록이 이미 정렬됨)
  const renderSection = (items: Todo[]): React.ReactNode[] => {
    if (items.length === 0) return [];
    const baseIds = items.map((t) => t.id);
    return items.map((t) => todoRow(t, baseIds));
  };

  const renderProjectTodos = (its: Todo[]): React.ReactNode[] => [
    ...renderSection(its.filter((t) => !t.done)),
    ...renderSection(its.filter((t) => t.done)),
  ];

  // 드래그 중엔 라이브 작업목록으로 렌더 → 그룹 넘나드는 이동이 즉시 반영됨
  const todos = drag?.kind === 'todo' ? drag.live : s.todos;
  const rows: React.ReactNode[] = [];
  if (todos.length === 0) {
    rows.push(<Empty key="e" text={p.emptySprint} />);
  } else if (active === 'all') {
    for (const pid of projOrder(s)) {
      const its = todos.filter((t) => t.project === pid);
      if (its.length === 0) continue;
      const done = its.filter((t) => t.done).length;
      rows.push(
        <div key={`h-${pid}`} className="row" style={{ borderTop: 'none', paddingBottom: 6, gap: 8 }}>
          <PDot color={projColor(s, pid)} />
          <span className="mono" style={{ fontSize: 11 }}>{projName(s, pid)}</span>
          <span className="mono c-dimmer" style={{ fontSize: 11 }}> · {done}/{its.length}</span>
        </div>,
      );
      rows.push(...renderProjectTodos(its));
    }
  } else {
    const its = todos.filter((t) => t.project === active);
    if (its.length === 0) rows.push(<Empty key="e" text={p.ui.emptyProj} />);
    else rows.push(...renderProjectTodos(its));
  }

  const ready = isShipDay(s.shipDay);
  const doneN = s.todos.filter((t) => t.done).length;
  const shipLabel = ready
    ? fmt(L.shipReady, { ver: verStr(s.major, s.minor + 1), n: doneN })
    : fmt(L.shipWait, { d: daysToShip(s.shipDay), done: doneN, total: s.todos.length });

  const onShip = async () => {
    // 튜토리얼 ship 단계에선 실제 배포 대신 단계만 진행(연습)
    const tut = useTutorial.getState();
    if (tut.step !== null && TUT_STEPS[tut.step]?.signal === 'ship') { tut.signal('ship'); return; }
    if (!ready) { uiAlert(pfmt(p.shipNotReady, { day: dayTok(s.lang, s.shipDay) })); return; }
    const title = (await uiPrompt(pfmt(p.ui.shipTitle, { ver: verStr(s.major, s.minor + 1) }), '', p.ui.shipHint)) ?? '';
    const rel = ship(title);
    uiAlert(pfmt(p.shipDone, { ver: verStr(rel.major, rel.minor) }));
  };

  const projects = s.projects;
  const projIds = projects.map((pp) => pp.id);
  const projLive = drag?.kind === 'project' ? drag.order : projIds;
  const projById = new Map(projects.map((pp) => [pp.id, pp]));

  // 드래그 중인 커밋(고스트 표시용)
  const dragTodo = drag?.kind === 'todo' ? s.todos.find((t) => t.id === drag.activeId) ?? null : null;

  return (
    <div>
      <div data-tut="project-chips" style={{ display: 'flex', flexWrap: 'wrap', gap: 7, alignItems: 'center' }}>
        <div
          className={`chip mono${active === 'all' ? ' on' : ''}`}
          data-projchip
          data-projid={NULL_PID}
          onClick={() => setActive('all')}
          title={L.allChipTip}
        >
          {L.all}
        </div>
        {projLive
          .map((id) => projById.get(id))
          .filter((pp): pp is NonNullable<typeof pp> => !!pp)
          .map((pp) => {
            const dragging = drag?.kind === 'project' && drag.activeId === pp.id;
            return (
              <div
                key={pp.id}
                ref={regEl('p:' + pp.id)}
                className={`chip mono${active === pp.id ? ' on' : ''}`}
                data-projchip
                data-projid={pp.id}
                onPointerDown={(e) => onDown(e, { kind: 'project', ids: projIds, id: pp.id })}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onClick={guard(() => { if (active === pp.id) renameProjectPrompt(pp.id, pp.name); else setActive(pp.id); })}
                style={{ cursor: 'grab', touchAction: 'none', ...(dragging ? { background: 'var(--panel2)', boxShadow: '0 4px 14px rgba(0,0,0,.4)', zIndex: 3 } : null) }}
                title={active === pp.id ? L.projChipActiveTip : L.projChipTip}
              >
                {grip}
                <PDot color={pp.color} />
                {pp.name}
                {active === pp.id && (
                  <>
                    <span
                      className="iconbtn"
                      style={{ marginLeft: 4, fontSize: 12 }}
                      title={L.renameTip}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); renameProjectPrompt(pp.id, pp.name); }}
                    >
                      ✎
                    </span>
                    <span
                      className="iconbtn"
                      style={{ fontSize: 12 }}
                      title={L.deleteTip}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); deleteProjectConfirm(pp.id, pp.name); }}
                    >
                      ✕
                    </span>
                  </>
                )}
              </div>
            );
          })}
        <div className="chip mono dashed" data-tut="add-project" onClick={addProjectPrompt}>{L.addProject}</div>
      </div>

      <div style={{ height: 14 }} />

      <CliBox title={L.sprintTitle}>
        <div data-tut="commit-input">
          <PromptInput placeholder={fmt(L.addTaskPh, { target })} button="commit" onAdd={addTodo} />
        </div>
        <div data-tut="todo-list">{rows}</div>
      </CliBox>

      <div className={`shipbar mono ${ready ? 'ready' : 'wait'}`} data-tut="ship-bar" onClick={onShip}>
        {shipLabel}
      </div>

      {/* 드래그 고스트 — 원본 행 크기·모양 그대로 반투명 복제 */}
      {dragTodo && (
        <div
          ref={ghostRef}
          className="drag-ghost row"
          style={{ width: ghostGeo.current.w, transform: `translate(${ptr.current.x - ghostGeo.current.offX}px, ${ptr.current.y - ghostGeo.current.offY}px)` }}
        >
          {grip}
          <span className="iconbtn mono" style={{ fontSize: 17, color: dragTodo.done ? 'var(--ship)' : 'var(--dimmer)' }}>{dragTodo.done ? '☒' : '☐'}</span>
          <PDot color={projColor(s, dragTodo.project)} />
          <span className="grow kr" style={{ fontSize: 15, color: dragTodo.done ? 'var(--dim)' : 'var(--txt)', textDecoration: dragTodo.done ? 'line-through' : 'none' }}>{dragTodo.text}</span>
          {dragTodo.carried && (
            <span className="mono" style={{ fontSize: 10, color: 'var(--warn)', border: '1px solid var(--warn)', borderRadius: 4, padding: '1px 5px' }}>rollback</span>
          )}
          <span className="iconbtn">✕</span>
        </div>
      )}
    </div>
  );
}
