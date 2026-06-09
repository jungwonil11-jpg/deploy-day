// 앱 상태 + 비즈니스 로직 (v1 app_state.dart 포팅) — Zustand.
// 영속화: Tauri plugin-store (state.json). v1 shared_preferences 대응.

import { create } from 'zustand';
import { load, type Store } from '@tauri-apps/plugin-store';
import {
  type AppState,
  type Release,
  type Memo,
  type Lang,
  type Todo,
  seedState,
  normalizeState,
  uid,
  todayStr,
  kPalette,
  kMemoDarkDefault,
  kMemoLightDefault,
} from './types';
import { openMemoWindow, closeMemoWindow } from './memoWindows';

const STORE_FILE = 'deployday.json';
const STATE_KEY = 'state';

let tauriStore: Store | null = null;

interface AppStore {
  s: AppState;
  activeProject: string; // 'all' 또는 project id
  tab: number;
  ready: boolean;

  // 초기화 — 영속 데이터 로드
  hydrate: () => Promise<void>;

  // 설정
  setName: (name: string) => void;
  setShipDay: (day: number) => void;
  setPersona: (id: string) => void;
  setLang: (lang: Lang) => void;
  setDark: (dark: boolean) => void;
  setActiveProject: (v: string) => void;
  setTab: (v: number) => void;

  // 투두
  addTodo: (text: string) => void;
  addTodoTo: (text: string, project: string | null) => void; // 프로젝트 지정 추가 (메모→커밋)
  toggleTodo: (id: string) => void;
  editTodo: (id: string, text: string) => void;
  deleteTodo: (id: string) => void;
  setTodos: (todos: Todo[]) => void; // 드래그 결과(순서·프로젝트 재배정) 일괄 반영

  // 백로그
  addBacklog: (text: string) => void;
  deleteBacklog: (id: string) => void;
  pullBacklog: (id: string, project: string | null) => void; // 선택한 프로젝트로 스프린트에 올림

  // 프로젝트
  addProject: (name: string) => void;
  renameProject: (id: string, name: string) => void;
  deleteProject: (id: string) => void; // 프로젝트 + 그 프로젝트의 커밋/백로그 함께 삭제
  reorderProjects: (ids: string[]) => void;

  // 배포
  ship: (title: string) => Release;

  // 메모 (floating 창)
  newMemo: () => Promise<void>;
  openMemo: (id: string) => Promise<void>;
  deleteMemo: (id: string) => Promise<void>;
  patchMemo: (id: string, patch: Partial<Memo>) => void; // 창에서 온 변경 반영
  markMemoClosed: (id: string) => void;
  restoreMemos: () => Promise<void>; // 시작 시 열려있던 메모 복원

  // 백업
  exportJson: () => string;
  importJson: (raw: string) => void;
  reset: () => void;
}

export const useApp = create<AppStore>((set, get) => {
  // 상태 갱신 + 영속화
  const commit = (next: AppState) => {
    set({ s: next });
    void tauriStore?.set(STATE_KEY, next);
    void tauriStore?.save();
  };

  const curTarget = (): string | null => {
    const a = get().activeProject;
    return a === 'all' ? null : a;
  };

  return {
    s: seedState(),
    activeProject: 'all',
    tab: 0,
    ready: false,

    hydrate: async () => {
      tauriStore = await load(STORE_FILE);
      const raw = await tauriStore.get(STATE_KEY);
      if (raw) {
        set({ s: normalizeState(raw), ready: true });
      } else {
        // 첫 실행 — OS 언어로 기본값 자동 선택 (한국어면 ko, 그 외 en)
        const detected: Lang = navigator.language?.toLowerCase().startsWith('ko') ? 'ko' : 'en';
        set({ s: { ...seedState(), lang: detected }, ready: true });
      }
    },

    setName: (name) => {
      const v = name.trim();
      if (!v) return;
      commit({ ...get().s, name: v });
    },
    setShipDay: (day) => {
      if (day < 1 || day > 7) return;
      commit({ ...get().s, shipDay: day });
    },
    setPersona: (id) => commit({ ...get().s, persona: id }),
    setLang: (lang) => commit({ ...get().s, lang }),
    setDark: (dark) => commit({ ...get().s, dark }),
    setActiveProject: (v) => set({ activeProject: v }),
    setTab: (v) => set({ tab: v }),

    addTodo: (text) => {
      const v = text.trim();
      if (!v) return;
      const s = get().s;
      commit({
        ...s,
        todos: [...s.todos, { id: uid(), text: v, done: false, carried: false, project: curTarget() }],
      });
    },
    addTodoTo: (text, project) => {
      const v = text.trim();
      if (!v) return;
      const s = get().s;
      commit({
        ...s,
        todos: [...s.todos, { id: uid(), text: v, done: false, carried: false, project }],
      });
    },
    toggleTodo: (id) => {
      const s = get().s;
      commit({
        ...s,
        todos: s.todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
      });
    },
    editTodo: (id, text) => {
      const v = text.trim();
      if (!v) return;
      const s = get().s;
      commit({ ...s, todos: s.todos.map((t) => (t.id === id ? { ...t, text: v } : t)) });
    },
    deleteTodo: (id) => {
      const s = get().s;
      commit({ ...s, todos: s.todos.filter((t) => t.id !== id) });
    },
    setTodos: (todos) => commit({ ...get().s, todos }),

    addBacklog: (text) => {
      const v = text.trim();
      if (!v) return;
      const s = get().s;
      commit({ ...s, backlog: [...s.backlog, { id: uid(), text: v, project: curTarget() }] });
    },
    deleteBacklog: (id) => {
      const s = get().s;
      commit({ ...s, backlog: s.backlog.filter((b) => b.id !== id) });
    },
    pullBacklog: (id, project) => {
      const s = get().s;
      const it = s.backlog.find((b) => b.id === id);
      if (!it) return;
      commit({
        ...s,
        todos: [...s.todos, { id: uid(), text: it.text, done: false, carried: false, project }],
        backlog: s.backlog.filter((b) => b.id !== id),
      });
    },

    addProject: (name) => {
      const v = name.trim();
      if (!v) return;
      const s = get().s;
      const color = kPalette[s.projects.length % kPalette.length];
      const id = uid();
      commit({ ...s, projects: [...s.projects, { id, name: v, color }] });
      set({ activeProject: id });
    },
    renameProject: (id, name) => {
      const v = name.trim();
      if (!v) return;
      const s = get().s;
      commit({ ...s, projects: s.projects.map((p) => (p.id === id ? { ...p, name: v } : p)) });
    },
    deleteProject: (id) => {
      const s = get().s;
      commit({
        ...s,
        projects: s.projects.filter((p) => p.id !== id),
        todos: s.todos.filter((t) => t.project !== id), // 이 프로젝트의 커밋도 함께
        backlog: s.backlog.filter((b) => b.project !== id),
      });
      if (get().activeProject === id) set({ activeProject: 'all' });
    },
    reorderProjects: (ids) => {
      const s = get().s;
      const byId = new Map(s.projects.map((p) => [p.id, p]));
      commit({ ...s, projects: ids.map((id) => byId.get(id)!).filter(Boolean) });
    },

    ship: (title) => {
      const s = get().s;
      const shippedCount = s.todos.filter((t) => t.done).length;
      let major = s.major;
      let minor = s.minor + 1;
      if (minor >= 10) {
        major += 1;
        minor = 0;
      }
      const release: Release = {
        major,
        minor,
        title: title.trim(),
        date: todayStr(),
        // 완료(배포)한 항목이 참조하는 프로젝트만 이름·색 스냅샷 (삭제돼도 박제 유지)
        projects: s.projects
          .filter((p) => s.todos.some((t) => t.project === p.id && t.done))
          .map((p) => ({ id: p.id, name: p.name, color: p.color })),
        // 릴리즈엔 완료한 것만 박제. 미완료는 다음 스프린트로 롤백되며 릴리즈엔 미포함.
        notes: s.todos.filter((t) => t.done).map((t) => ({ text: t.text, done: true, project: t.project })),
      };
      commit({
        ...s,
        major,
        minor,
        streak: shippedCount > 0 ? s.streak + 1 : 0,
        // 완료분은 비우고, 미완료분만 rollback 태그로 다음 주에 이월
        todos: s.todos
          .filter((t) => !t.done)
          .map((t) => ({ id: uid(), text: t.text, done: false, carried: true, project: t.project })),
        releases: [...s.releases, release],
      });
      return release;
    },

    /* ---------- 메모 (floating 창) ---------- */
    newMemo: async () => {
      const s = get().s;
      const n = s.memos.length;
      const m: Memo = {
        id: uid(),
        text: '',
        x: 140 + (n % 8) * 36,
        y: 140 + (n % 8) * 36,
        w: 300,
        h: 220,
        open: true,
        pinned: false,
        color: s.dark ? kMemoDarkDefault : kMemoLightDefault,
      };
      commit({ ...s, memos: [...s.memos, m] });
      await openMemoWindow(m);
    },
    openMemo: async (id) => {
      const s = get().s;
      const m = s.memos.find((x) => x.id === id);
      if (!m) return;
      if (!m.open) commit({ ...s, memos: s.memos.map((x) => (x.id === id ? { ...x, open: true } : x)) });
      await openMemoWindow({ ...m, open: true });
    },
    deleteMemo: async (id) => {
      await closeMemoWindow(id);
      const s = get().s;
      commit({ ...s, memos: s.memos.filter((m) => m.id !== id) });
    },
    patchMemo: (id, patch) => {
      const s = get().s;
      commit({ ...s, memos: s.memos.map((m) => (m.id === id ? { ...m, ...patch } : m)) });
    },
    markMemoClosed: (id) => {
      const s = get().s;
      commit({ ...s, memos: s.memos.map((m) => (m.id === id ? { ...m, open: false } : m)) });
    },
    restoreMemos: async () => {
      // 시작 시 열려있던 메모 순차 복원 (Tauri는 창 동시생성도 안정적이나 순차가 깔끔)
      for (const m of get().s.memos.filter((x) => x.open)) {
        await openMemoWindow(m);
      }
    },

    exportJson: () => JSON.stringify(get().s, null, 2),
    importJson: (raw) => {
      const parsed = normalizeState(JSON.parse(raw));
      set({ activeProject: 'all' });
      commit(parsed);
    },
    reset: () => {
      set({ activeProject: 'all' });
      commit({ ...seedState(), lang: get().s.lang }); // 언어 설정은 유지
    },
  };
});
