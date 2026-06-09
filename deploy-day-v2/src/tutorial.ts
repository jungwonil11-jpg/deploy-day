// 인터랙티브 튜토리얼 — 단계마다 "실제 액션"을 유도하고, 그 액션이 감지되면 자동 진행.
// 진짜로 할 게 없는 단계(intro·streak·done)만 [다음] 버튼을 허용한다.
// 진행 트리거 3종: watch(상태 변화) · awaitTab(탭 이동) · signal(특정 클릭).
import { create } from 'zustand';
import { useApp } from './store';
import type { AppState } from './types';

// 진입 시점 스냅샷 — 증가/변화 감지 기준값
interface Base {
  projects: number;
  todos: number;
  done: number;
  backlog: number;
  order: string; // 커밋 배열 순서 서명 (reorder 감지: 순서 민감)
  assign: string; // 커밋→프로젝트 배정 서명 (move 감지: 순서 무관)
}

const orderSig = (s: AppState) => s.todos.map((t) => t.id).join(',');
const assignSig = (s: AppState) =>
  s.todos.map((t) => `${t.id}:${t.project ?? ''}`).sort().join('|');

const snapshot = (s: AppState): Base => ({
  projects: s.projects.length,
  todos: s.todos.length,
  done: s.todos.filter((t) => t.done).length,
  backlog: s.backlog.length,
  order: orderSig(s),
  assign: assignSig(s),
});

const emptyBase: Base = { projects: 0, todos: 0, done: 0, backlog: 0, order: '', assign: '' };

export interface TutStep {
  key: string; // 페르소나 문구 키
  targetId?: string; // 스포트라이트 대상 (data-tut)
  tab?: number; // 진입 시 강제 전환할 탭 (sprint 단계들만)
  watch?: (s: AppState, base: Base) => boolean; // 상태 변화로 자동완료
  awaitTab?: number; // 사용자가 이 탭으로 직접 이동하면 완료
  signal?: string; // 이 시그널(특정 클릭)이 오면 완료
  place?: 'above' | 'below'; // 풍선 위치 강제 — 드래그 대상이 풍선에 가릴 때 사용
}

export const TUT_STEPS: TutStep[] = [
  { key: 'intro' }, // 환영 — 할 게 없음 (버튼)
  { key: 'project', targetId: 'add-project', tab: 0, watch: (s, b) => s.projects.length > b.projects },
  { key: 'commit', targetId: 'commit-input', tab: 0, watch: (s, b) => s.todos.length > b.todos },
  { key: 'commit2', targetId: 'commit-input', tab: 0, watch: (s, b) => s.todos.length > b.todos },
  { key: 'reorder', targetId: 'todo-list', tab: 0, watch: (s, b) => s.todos.length === b.todos && orderSig(s) !== b.order },
  { key: 'check', targetId: 'todo-list', tab: 0, watch: (s, b) => s.todos.filter((t) => t.done).length > b.done },
  // place:'above' — 끌 커밋이 칩 아래에 있어 풍선이 칩 아래로 오면 가림 → 풍선을 칩 위로
  { key: 'move', targetId: 'project-chips', tab: 0, watch: (s, b) => assignSig(s) !== b.assign, place: 'above' },
  { key: 'ship', targetId: 'ship-bar', tab: 0, signal: 'ship' },
  { key: 'backlog', targetId: 'tab-1', awaitTab: 1 },
  { key: 'changelog', targetId: 'tab-2', awaitTab: 2 },
  { key: 'memo', targetId: 'tab-3', awaitTab: 3 },
  { key: 'config', targetId: 'tab-4', awaitTab: 4 },
  { key: 'streak', targetId: 'streak' }, // 연속 배포 수 — 할 게 없음 (버튼)
  { key: 'easter', targetId: 'clawd', signal: 'clawd' },
  { key: 'done' }, // 마무리 — 할 게 없음 (버튼)
];

// 자동 진행 트리거가 없는(=수동 [다음] 버튼) 단계 판정
export const isManual = (st: TutStep) =>
  !st.watch && st.awaitTab === undefined && !st.signal;

interface TutStore {
  step: number | null; // null = 비활성
  base: Base; // 현재 단계 진입 시점 스냅샷
  start: () => void;
  next: () => void;
  skipStep: () => void; // 이 단계만 건너뛰기
  stop: () => void; // 완전 종료
  check: () => void; // 상태/탭 변화 시 watch·awaitTab 판정
  signal: (name: string) => void; // 클릭 시그널 (ship·clawd)
}

export const useTutorial = create<TutStore>((set, get) => {
  const enter = (i: number) => {
    const st = TUT_STEPS[i];
    if (st.tab !== undefined) useApp.getState().setTab(st.tab);
    set({ step: i, base: snapshot(useApp.getState().s) });
  };
  // 액션 감지 후 살짝 늦춰 진행(피드백 여유). 그 사이 단계가 바뀌면 무시.
  const advance = (from: number) => {
    setTimeout(() => { if (get().step === from) get().next(); }, 600);
  };
  return {
    step: null,
    base: emptyBase,
    start: () => enter(0),
    next: () => {
      const s = get().step;
      if (s === null) return;
      if (s + 1 >= TUT_STEPS.length) { set({ step: null }); useApp.getState().setTab(0); }
      else enter(s + 1);
    },
    skipStep: () => get().next(),
    stop: () => { set({ step: null }); useApp.getState().setTab(0); },
    check: () => {
      const i = get().step;
      if (i === null) return;
      const st = TUT_STEPS[i];
      const app = useApp.getState();
      if (st.watch && st.watch(app.s, get().base)) advance(i);
      else if (st.awaitTab !== undefined && app.tab === st.awaitTab) advance(i);
    },
    signal: (name) => {
      const i = get().step;
      if (i === null) return;
      if (TUT_STEPS[i]?.signal === name) advance(i);
    },
  };
});
