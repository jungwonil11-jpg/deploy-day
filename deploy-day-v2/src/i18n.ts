// UI 문자열(페르소나 voice 가 아닌 "크롬") 다국어 사전 — ko/en.
// 페르소나 voice 문구는 persona.ts, 정책/소개 문서는 legal.ts 에서 따로 관리한다.
import { useApp } from './store';
import type { Lang } from './types';

// '{key}' 치환 (persona.pfmt 와 동일 규칙)
export const fmt = (t: string, v: Record<string, string | number>): string =>
  Object.entries(v).reduce((s, [k, val]) => s.split(`{${k}}`).join(`${val}`), t);

const ko = {
  // 앱 이름 (브랜드) — ko: "인생을 배포", en: "deploy-day"
  appName: '인생을 배포',
  // 배너 / 앱 셸
  welcomeBack: 'Welcome back {name}!',
  lifeDeploy: '{app} · 매주 {day}',
  shipDayTip: '배포 요일 변경',
  shipDayChanged: '배포일 변경됨 — 매주 {day}',
  recommendedBadge: '(추천)',
  streakWeeks: 'streak {n}주',
  tipsHead: 'Tips for getting started',
  whatsNew: "What's new",
  welcomeTitle: '✻ 인생을 배포에 오신 걸 환영해요!',
  statusCycle: '(1주 cycle)',
  statusMain: 'main',
  deployModeOn: '⏵⏵ deploy mode on',
  statusEvery: '(every {day})',
  statusToday: ' · 🚀 today',
  statusDShip: ' · D-{n} for ship',

  // /sprint
  unfiled: '미분류',
  all: '전체',
  addTaskPh: '[{target}] 할 거 입력 (Enter)',
  addProject: '+ 프로젝트',
  sprintTitle: 'sprint · 다음 배포까지 쌓을 커밋',
  shipReady: '⏵⏵ ship {ver} · {n}건 완료',
  shipWait: '$ ship — D-{d} · {done}/{total} 완료',
  allChipTip: '여기 커밋을 놓으면 미분류로',
  projChipActiveTip: '한 번 더 누르면 이름 수정 · 끌어서 순서 변경',
  projChipTip: '끌어서 순서 변경 · 커밋을 놓으면 이 프로젝트로',
  renameTip: '이름 수정',
  deleteTip: '프로젝트 삭제',

  // /backlog
  backlogTitle: 'backlog · 다음 버전에 할 거 미리 메모',
  backlogPh: '다음에 하고 싶은 거',

  // /changelog
  changelogTitle: 'changelog · 내 인생 릴리즈 히스토리',
  deletedProject: '삭제된 프로젝트',
  emptyRelease: '이번 배포는 빈손 (완료 항목 없음)',

  // /memo
  memoTitle: 'memo · 바탕화면 포스트잇 (항상 위)',
  memoHint: '끌어서 옮기면 가장자리·다른 메모에 자석처럼 붙음',
  emptyMemoPrev: '(빈 메모)',
  memoOpen: '떠있음',
  memoOpenBtn: '→ 열기',

  // 메모 floating 창
  mwColor: '색 변경',
  mwToCommit: '커밋으로 (프로젝트 선택)',
  mwPin: '항상 위',
  mwClose: '닫기',
  mwSendWhere: '어디로 보낼까?',
  mwNotePh: '> 메모...',

  // /config
  themeTitle: 'theme · 다크/라이트',
  darkLabel: '다크',
  lightLabel: '라이트',
  langTitle: 'language · 언어',
  personaTitle: 'persona · 앱 말투 변경',
  defaultBadge: '(기본)',
  personaToast: '페르소나 변경 — {name}',
  manualTitle: 'manual · 사용법',
  manualFold: '처음 왔으면 읽기 — 5분 사용법',
  tutReplay: '인터랙티브 튜토리얼 다시 보기',
  tutReplayHint: '따라하면서 배우기',
  aboutTitle: 'about · 이 앱은 뭔가',
  policyTitle: 'policy · 정책',
  privacyTitle: '개인정보처리방침',
  termsTitle: '이용약관',
  contact: 'deploy-day · 문의 jungwonil11@gmail.com',
  saveTitle: 'deploy-day 백업 저장',
  openTitle: '백업 파일 선택',
  backupFilter: 'deploy-day 백업',
  restoreLabel: '복원',
  resetLabel: '초기화',
  delLabel: '삭제',

  // 다이얼로그
  ok: '확인',
  cancel: '취소',

  // 튜토리얼 크롬
  tutStop: '✕ 튜토리얼 그만하기',
  tutSkip: '건너뛰기 →',
  tutNext: '다음 →',
  tutStart: '⏵⏵ 시작',
  tutDoHint: '직접 해보면 넘어가요',

  // 이스터에그
  pokeTip: '눌러보셈 ㅋㅋ',
};

const en: typeof ko = {
  // app name (brand)
  appName: 'deploy-day',
  // banner / app shell
  welcomeBack: 'Welcome back {name}!',
  lifeDeploy: '{app} · every {day}',
  shipDayTip: 'change ship day',
  shipDayChanged: 'Ship day changed — every {day}',
  recommendedBadge: '(recommended)',
  streakWeeks: 'streak {n}w',
  tipsHead: 'Tips for getting started',
  whatsNew: "What's new",
  welcomeTitle: '✻ Welcome to deploy-day!',
  statusCycle: '(1-week cycle)',
  statusMain: 'main',
  deployModeOn: '⏵⏵ deploy mode on',
  statusEvery: '(every {day})',
  statusToday: ' · 🚀 today',
  statusDShip: ' · D-{n} for ship',

  // /sprint
  unfiled: 'Unfiled',
  all: 'All',
  addTaskPh: '[{target}] add a task (Enter)',
  addProject: '+ project',
  sprintTitle: 'sprint · commits until next ship',
  shipReady: '⏵⏵ ship {ver} · {n} done',
  shipWait: '$ ship — D-{d} · {done}/{total} done',
  allChipTip: 'drop a commit here to unfile it',
  projChipActiveTip: 'tap again to rename · drag to reorder',
  projChipTip: 'drag to reorder · drop a commit to assign here',
  renameTip: 'rename',
  deleteTip: 'delete project',

  // /backlog
  backlogTitle: 'backlog · stash for next versions',
  backlogPh: 'something for later',

  // /changelog
  changelogTitle: 'changelog · my life release history',
  deletedProject: 'Deleted project',
  emptyRelease: 'Shipped nothing this release',

  // /memo
  memoTitle: 'memo · desktop sticky notes (always on top)',
  memoHint: 'drag to snap to screen edges & other notes',
  emptyMemoPrev: '(empty note)',
  memoOpen: 'open',
  memoOpenBtn: '→ open',

  // memo floating window
  mwColor: 'change color',
  mwToCommit: 'to commit (pick project)',
  mwPin: 'always on top',
  mwClose: 'close',
  mwSendWhere: 'Send where?',
  mwNotePh: '> note...',

  // /config
  themeTitle: 'theme · dark/light',
  darkLabel: 'dark',
  lightLabel: 'light',
  langTitle: 'language',
  personaTitle: 'persona · app voice',
  defaultBadge: '(default)',
  personaToast: 'Voice changed — {name}',
  manualTitle: 'manual · how to use',
  manualFold: 'New here? Read this — 5-min guide',
  tutReplay: 'Replay interactive tutorial',
  tutReplayHint: 'learn by doing',
  aboutTitle: 'about · what is this',
  policyTitle: 'policy',
  privacyTitle: 'Privacy Policy',
  termsTitle: 'Terms of Service',
  contact: 'deploy-day · contact jungwonil11@gmail.com',
  saveTitle: 'Save deploy-day backup',
  openTitle: 'Select backup file',
  backupFilter: 'deploy-day backup',
  restoreLabel: 'Restore',
  resetLabel: 'Reset',
  delLabel: 'Delete',

  // dialogs
  ok: 'OK',
  cancel: 'Cancel',

  // tutorial chrome
  tutStop: '✕ Stop tutorial',
  tutSkip: 'Skip →',
  tutNext: 'Next →',
  tutStart: '⏵⏵ Start',
  tutDoHint: 'do it to continue',

  // easter egg
  pokeTip: 'poke me lol',
};

export type UIStrings = typeof ko;
export const UI: Record<Lang, UIStrings> = { ko, en };

// 현재 언어의 UI 문자열 (메인 창 — useApp 반응형)
export const useUI = (): UIStrings => UI[useApp((st) => st.s.lang)];
