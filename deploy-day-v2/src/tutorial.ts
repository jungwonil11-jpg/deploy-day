// 인터랙티브 튜토리얼 상태 + 단계 정의 (Zustand).
// 코치마크: 타겟 DOM에 구멍 뚫고 설명. 일부 단계는 "직접 해보면" 자동 진행,
// 나머지는 [다음]. 건너뛰기(이 단계만) ↔ 그만하기(완전 종료) 분리.
import { create } from 'zustand';
import { useApp } from './store';

// 단계: key(페르소나 문구) + targetId(스포트라이트 대상) + tab(필요 탭) +
//       auto(상태변화로 자동완료 판정 함수) — auto 없으면 [다음] 버튼.
export interface TutStep {
  key: string;
  targetId?: string; // data-tut 속성값
  tab?: number; // 진입 시 전환할 탭 (0 sprint,1 backlog,2 changelog,3 memo,4 config)
  auto?: (before: number, now: number) => boolean; // (이전 카운트, 현재 카운트)
  count?: () => number; // auto 판정용 카운트 소스
}

export const TUT_STEPS: TutStep[] = [
  { key: 'intro' },
  { key: 'project', targetId: 'add-project', tab: 0, count: () => useApp.getState().s.projects.length, auto: (b, n) => n > b },
  { key: 'commit', targetId: 'commit-input', tab: 0, count: () => useApp.getState().s.todos.length, auto: (b, n) => n > b },
  { key: 'check', targetId: 'todo-list', tab: 0, count: () => useApp.getState().s.todos.filter((t) => t.done).length, auto: (b, n) => n > b },
  { key: 'move', targetId: 'project-chips', tab: 0 },
  { key: 'backlog', targetId: 'tab-1', tab: 1 },
  { key: 'ship', targetId: 'ship-bar', tab: 0 },
  { key: 'changelog', targetId: 'tab-2', tab: 2 },
  { key: 'memo', targetId: 'tab-3', tab: 3 },
  { key: 'config', targetId: 'tab-4', tab: 4 },
  { key: 'streak', targetId: 'statusline', tab: 0 },
  { key: 'easter', targetId: 'clawd', tab: 0 },
  { key: 'done', tab: 0 },
];

interface TutStore {
  step: number | null; // null = 비활성
  baseCount: number; // auto 단계 진입 시점의 카운트
  start: () => void;
  next: () => void;
  skipStep: () => void; // 이 단계만 건너뛰기 (= next와 동일하되 의미 구분)
  stop: () => void; // 완전 종료
  checkAuto: () => void; // 상태 변화 시 자동 진행 판정
}

export const useTutorial = create<TutStore>((set, get) => {
  const enter = (i: number) => {
    const st = TUT_STEPS[i];
    if (st.tab !== undefined) useApp.getState().setTab(st.tab);
    set({ step: i, baseCount: st.count ? st.count() : 0 });
  };
  return {
    step: null,
    baseCount: 0,
    start: () => enter(0),
    next: () => {
      const s = get().step;
      if (s === null) return;
      if (s + 1 >= TUT_STEPS.length) { set({ step: null }); useApp.getState().setTab(0); }
      else enter(s + 1);
    },
    skipStep: () => get().next(),
    stop: () => { set({ step: null }); useApp.getState().setTab(0); },
    checkAuto: () => {
      const i = get().step;
      if (i === null) return;
      const st = TUT_STEPS[i];
      if (!st.auto || !st.count) return;
      if (st.auto(get().baseCount, st.count())) {
        setTimeout(() => { if (get().step === i) get().next(); }, 650);
      }
    },
  };
});
