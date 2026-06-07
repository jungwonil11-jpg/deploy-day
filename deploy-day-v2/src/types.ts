// 도메인 모델 + 헬퍼 — v1(Flutter models.dart) 포팅.
// JSON 키는 v1과 동일 유지 (deployday_v1 백업 호환).

export interface Project {
  id: string;
  name: string;
  color: string; // '#d97757' 형식
  done: boolean; // 졸업 여부
}

export interface Todo {
  id: string;
  text: string;
  done: boolean;
  carried: boolean; // 지난 배포에서 롤백돼 넘어온 항목
  project: string | null;
}

export interface BacklogItem {
  id: string;
  text: string;
  project: string | null;
}

export interface ReleaseNote {
  text: string;
  done: boolean;
  project: string | null;
}

export interface Release {
  major: number;
  minor: number;
  title: string;
  date: string; // yyyy-MM-dd
  graduated: string[];
  notes: ReleaseNote[];
}

export interface Memo {
  id: string;
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
  open: boolean; // 현재 창으로 떠 있는지 (재시작 복원 기준)
  pinned: boolean; // 항상 위 고정
  color: number; // kMemoColors 인덱스
}

export interface AppState {
  name: string; // 배포자 이름
  persona: string; // 말투 페르소나 id
  dark: boolean; // 다크모드
  shipDay: number; // 배포 요일 (1=월 .. 7=일)
  major: number;
  minor: number;
  streak: number;
  projects: Project[];
  todos: Todo[];
  backlog: BacklogItem[];
  releases: Release[];
  memos: Memo[];
}

// 메모 색 7색 — (배경, 잉크). 0=다크기본, 6=라이트기본.
export const kMemoColors: [string, string][] = [
  ['#1a1a1a', '#ececec'], // 0 다크 차콜
  ['#2a1c16', '#e8b79e'], // 1 오렌지
  ['#15241a', '#9ee0b0'], // 2 그린
  ['#1a2230', '#9ec9f0'], // 3 블루
  ['#2a1620', '#f0a0c8'], // 4 핑크
  ['#2a2410', '#e8d08a'], // 5 옐로
  ['#faf6e9', '#2d2b28'], // 6 라이트 페이퍼
];
export const kMemoDarkDefault = 0;
export const kMemoLightDefault = 6;

export const seedState = (): AppState => ({
  name: '',
  persona: 'sunny',
  dark: true,
  shipDay: 4, // 목요일
  major: 1,
  minor: 0,
  streak: 0,
  projects: [],
  todos: [],
  backlog: [],
  releases: [],
  memos: [],
});

/* ---------- 팔레트 ---------- */

// 프로젝트 칩 색 — 터미널 톤 (v1 kPalette)
export const kPalette = [
  '#d97757', '#5dbe74', '#d9a33c', '#4fa3e8',
  '#e25d56', '#cc66cc', '#56b6c2', '#e8a287',
];

// 구버전(HTML) 팔레트 → 현행 마이그레이션
const legacyPalette: Record<string, string> = {
  '#a855f7': '#d97757', '#22d3a6': '#5dbe74', '#fbbf24': '#d9a33c',
  '#60a5fa': '#4fa3e8', '#fb7185': '#e25d56', '#c084fc': '#cc66cc',
  '#34d399': '#56b6c2', '#f9a8d4': '#e8a287',
};
export const migrateColor = (c: string): string => legacyPalette[c] ?? c;

/* ---------- 헬퍼 ---------- */

export const uid = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const verStr = (major: number, minor: number) => `v${major}.${minor}`;

// 요일: 1=월 .. 7=일 (JS Date.getDay()는 0=일이라 변환 필요)
export const kDayKr = ['', '월', '화', '수', '목', '금', '토', '일'];
export const kDayEn = [
  '', 'monday', 'tuesday', 'wednesday', 'thursday',
  'friday', 'saturday', 'sunday',
];

// JS getDay(0=일~6=토) → ISO weekday(1=월~7=일)
const isoWeekday = (): number => {
  const d = new Date().getDay();
  return d === 0 ? 7 : d;
};

export const isShipDay = (day: number) => isoWeekday() === day;
export const daysToShip = (day: number) => (day - isoWeekday() + 7) % 7;

export const todayStr = (): string => {
  const d = new Date();
  const p = (n: number) => `${n}`.padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

/* ---------- JSON 정규화 (백업 호환·결손 필드 보정) ---------- */

export function normalizeState(j: any): AppState {
  const s = seedState();
  if (!j || typeof j !== 'object') return s;
  return {
    name: typeof j.name === 'string' ? j.name : '',
    persona: typeof j.persona === 'string' ? j.persona : 'victor',
    dark: typeof j.dark === 'boolean' ? j.dark : true,
    shipDay: typeof j.shipDay === 'number' ? j.shipDay : 4,
    major: j.major ?? 1,
    minor: j.minor ?? 0,
    streak: j.streak ?? 0,
    projects: (j.projects ?? []).map((p: any): Project => ({
      id: p.id,
      name: p.name ?? '',
      color: migrateColor(p.color ?? kPalette[0]),
      done: p.done === true,
    })),
    todos: (j.todos ?? []).map((t: any): Todo => ({
      id: t.id,
      text: t.text ?? '',
      done: t.done === true,
      carried: t.carried === true,
      project: t.project ?? null,
    })),
    backlog: (j.backlog ?? []).map((b: any): BacklogItem => ({
      id: b.id,
      text: b.text ?? '',
      project: b.project ?? null,
    })),
    releases: (j.releases ?? []).map((r: any): Release => ({
      major: r.major ?? 1,
      minor: r.minor ?? 0,
      title: r.title ?? '',
      date: r.date ?? '',
      graduated: r.graduated ?? [],
      notes: (r.notes ?? []).map((n: any): ReleaseNote => ({
        text: n.text ?? '',
        done: n.done === true,
        project: n.project ?? null,
      })),
    })),
    memos: (j.memos ?? []).map((m: any): Memo => ({
      id: m.id,
      text: m.text ?? '',
      x: m.x ?? 120,
      y: m.y ?? 120,
      w: m.w ?? 300,
      h: m.h ?? 220,
      open: m.open === true,
      pinned: m.pinned === true,
      color: m.color ?? 0,
    })),
  };
}

/* ---------- 파생 헬퍼 ---------- */

export const projName = (s: AppState, pid: string | null): string =>
  pid === null ? '미분류' : s.projects.find((p) => p.id === pid)?.name ?? '미분류';

export const projColor = (s: AppState, pid: string | null): string =>
  pid === null ? '#5C5C5C' : s.projects.find((p) => p.id === pid)?.color ?? '#5C5C5C';

// 그룹 표시 순서: 프로젝트 등록순 + 미분류(null) 마지막
export const projOrder = (s: AppState): (string | null)[] => [
  ...s.projects.map((p) => p.id),
  null,
];
