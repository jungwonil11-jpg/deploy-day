// 앱 말투 페르소나 — 이름으로만 구분(연령·성별 표기 없음).
// 모든 voice 있는 UI 문구가 페르소나를 따름. 정책 문서(개인정보/약관)만 예외(표준).
// 언어별(ko/en)로 페르소나 세트를 따로 두고 personaOf 가 s.lang 으로 고른다.
import type { AppState, Lang } from './types';

// 자잘한 UI 문구 — 다이얼로그 제목·토스트·확인문구 등 (voice 있는 것 전부)
export interface PersonaUI {
  nameChange: string;
  memoSent: string;
  clawd: string;
  todoEdit: string;
  projAdd: string;
  projAddHint: string;
  projRename: string;
  projDelAsk: string; // {name} {n}
  shipTitle: string; // {ver}
  shipHint: string;
  emptyProj: string;
  exportToast: string;
  exportFail: string;
  importAsk: string;
  importOk: string;
  importFail: string;
  resetAsk: string;
  resetToast: string;
  memoDelAsk: string;
}

export interface Persona {
  id: string;
  name: string;
  tagline: string;
  riskHead: string;
  riskRest: string;
  warnHead: string;
  warnRest: string;
  todayHead: string;
  todayRest: string;
  normalHead: string;
  normalRest: string;
  tips: string;
  onboard: string;
  about: string; // 페르소나별 앱 소개 (config "about")
  emptySprint: string;
  emptyBacklog: string;
  emptyChangelog: string;
  emptyMemo: string;
  noReleaseYet: string; // /changelog · What's new 빈 상태
  shipNotReady: string;
  shipDone: string;
  shipDialogSub: string;
  tutorial: Record<string, string>;
  ui: PersonaUI;
}

// '{key}' 치환
export const pfmt = (t: string, v: Record<string, string | number>): string =>
  Object.entries(v).reduce((s, [k, val]) => s.split(`{${k}}`).join(`${val}`), t);

const koPersonas: Persona[] = [
  // ===== Sunny (기본) — 따뜻한 응원 =====
  {
    id: 'sunny',
    name: 'Sunny',
    tagline: '따뜻한 응원. 잘하고 있다고 말해줘요',
    riskHead: '오늘 배포하지 않으면 streak {streak}주가 사라져요.',
    riskRest: ' 작은 것 하나라도 완료해봐요!',
    warnHead: '내일이 배포일이에요!',
    warnRest: ' 아직 완료 0건 — 오늘 하나만 끝내볼까요?',
    todayHead: '오늘이 배포일이에요!',
    todayRest: ' ⏵⏵ ship 으로 {ver}를 릴리즈해요 🎉',
    normalHead: 'D-{d} · {day}요일에 만나요!',
    normalRest: ' 차근차근 쌓는 중 · streak {streak}주',
    tips: '/sprint 에 할 일을 쌓고 {day}요일에 ship 해보세요',
    onboard: '먼저 이름을 알려주세요.\n배너의 이름을 누르면 언제든 바꿀 수 있어요.',
    about:
      'deploy-day는 인생을 소프트웨어처럼 배포하는 todo 앱이에요.\n\n· 일주일이 하나의 스프린트예요\n· 할 일은 커밋처럼 쌓아요\n· 정해진 요일에 한 주를 ship 해요\n· 완료한 일은 릴리즈노트에 남고, 못한 일은 다음 주로 넘어가요\n· 꾸준히 배포하면 streak이 쌓여요\n\n완벽한 계획보다 꾸준한 배포가 더 멀리 가요.\n매주 작게라도 버전을 올려봐요 — 당신의 인생도 매주 0.1씩!\n\nUI는 Claude Code CLI에 대한 오마주예요.',
    emptySprint: '아직 할 일이 없어요\n오늘 하고 싶은 것 하나를 적어보세요',
    emptyBacklog: '백로그가 비어 있어요\n다음에 하고 싶은 일을 미리 담아두세요',
    emptyChangelog: '아직 배포 기록이 없어요\n첫 {day}요일에 {ver}을 함께 찍어봐요',
    emptyMemo: '포스트잇이 없어요\n+ memo 로 바탕화면에 붙여보세요',
    noReleaseYet: '아직 릴리즈가 없어요 — 첫 배포가 첫 소식이 될 거예요',
    shipNotReady: '배포는 {day}요일에 해요 🚀 오늘은 쌓는 날!',
    shipDone: '🚀 {ver} 배포 완료! 수고했어요',
    shipDialogSub: '완료한 일은 릴리즈노트에 남고, 못한 일은 다음 주로 넘어가요',
    tutorial: {
      intro: '안녕하세요! deploy-day는 인생을 소프트웨어처럼 "배포"하는 todo 앱이에요.\n한 주가 스프린트, 할 일이 커밋, 한 주의 마무리가 ship 이에요.\n제가 가리키는 곳을 직접 눌러보면서 배워봐요 — 1분이면 돼요!',
      project: '먼저 프로젝트를 만들어볼까요?\n아래 반짝이는 [+ 프로젝트]를 눌러 이름을 지어주세요 (예: 운동, 자격증).\n공부·사이드프로젝트처럼 "꾸준히 할 큰 묶음"이에요.',
      commit: '좋아요! 이제 이번 주에 할 일을 하나 적고 Enter를 눌러보세요.\n이게 커밋이에요 — 작게 쪼갤수록 좋아요.',
      commit2: '하나만 하면 심심하죠? 커밋을 하나 더 적어볼까요?\n이렇게 한 주에 해낼 일들을 차곡차곡 쌓아두는 거예요.',
      reorder: '이제 커밋을 끌어서 순서를 바꿔보세요!\n커밋을 꾹 잡고 위아래로 옮기면 자리가 바뀌어요.\n중요한 걸 위로 올려두면 한눈에 들어와요.',
      check: '끝낸 일은 ☐ 를 눌러 체크해요.\n커밋 하나를 완료 체크해보세요 — 그룹 아래로 쏙 내려가요.\n(글자를 누르면 수정, ✕ 로 삭제할 수 있어요)',
      move: '커밋을 끌어서 위쪽 [전체] 칩에 떨어뜨려보세요.\n분류가 바뀌어요 — 프로젝트 칩에 놓으면 그 프로젝트로 들어가요.\n잘못 넣었을 때 이렇게 옮기면 돼요.',
      ship: '여기가 ship 버튼이에요. 한번 눌러보세요!\n배포 요일(기본 목요일)이 되면 켜지고, 누르면 한 주가 릴리즈로 박제돼요.\n(지금은 연습이라 실제로 배포되진 않아요 ㅎㅎ)',
      backlog: '위 /backlog 탭을 눌러볼까요?\n"다음에 할 일" 보관함이에요. 지금은 아니지만 잊기 싫은 아이디어를 던져두고,\n나중에 → pull 로 이번 스프린트에 가져와요.',
      changelog: '이번엔 /changelog 탭을 눌러보세요.\nship 할 때마다 릴리즈가 한 줄씩 쌓이는 나의 역사예요.\n내가 이만큼 해냈구나 — 돌아보는 곳이에요.',
      memo: '/memo 탭도 눌러볼까요?\n바탕화면에 띄우는 포스트잇이에요. 항상 위 고정·색 변경·커밋으로 보내기까지 돼요.\n끌면 화면 가장자리·다른 메모에 자석처럼 붙어요.',
      config: '마지막 탭, /config 를 눌러보세요.\n말투(페르소나)·다크/라이트 테마·데이터 백업(파일 export/import)을 여기서 다 바꿔요.',
      streak: 'streak은 연속 배포 주수예요.\n매주 하나라도 완료하고 ship 하면 1주씩 쌓이고, 빈손으로 배포하면 0이 돼요.\n끊기지 않게 지켜봐요!',
      easter: '작은 비밀 하나 🤫\n위 배너의 깨진 픽셀 그림을 눌러보세요!\n계속 누르다 보면 진짜 Clawd(이 앱의 마스코트)가 나타나요.',
      done: '준비 끝! 이제 당신 차례예요.\n매주 작게라도 ship 하면 인생도 매주 0.1씩 올라가요.\n이번 주도 화이팅! 🚀',
    },
    ui: {
      nameChange: '이름 바꾸기',
      memoSent: '메모를 커밋으로 보냈어요',
      clawd: '✻ Clawd를 찾았어요! 계속 누르면 또 바뀌어요 ㅎㅎ',
      todoEdit: '커밋 수정하기',
      projAdd: '새 프로젝트',
      projAddHint: '이름 (예: deploy-day)',
      projRename: '프로젝트 이름 수정',
      projDelAsk: "'{name}' 프로젝트를 삭제할까요? 이 프로젝트의 커밋 {n}개도 함께 사라져요. 되돌릴 수 없어요.",
      shipTitle: '{ver} 배포하기',
      shipHint: '한 줄 요약 (선택)',
      emptyProj: '이 프로젝트엔 아직 커밋이 없어요',
      exportToast: '백업 파일을 저장했어요',
      exportFail: '저장에 실패했어요',
      importAsk: '이 파일의 내용으로 덮어쓸까요? 지금 데이터는 사라져요.',
      importOk: '복원했어요',
      importFail: '복원에 실패했어요 — 올바른 백업 파일인지 확인해주세요',
      resetAsk: '전부 초기화할까요? 되돌릴 수 없어요.',
      resetToast: '초기화했어요',
      memoDelAsk: '메모를 삭제할까요? 내용도 함께 사라져요.',
    },
  },
  // ===== Victor — 시니컬 직설 =====
  {
    id: 'victor',
    name: 'Victor',
    tagline: '시니컬 직설. 군더더기 없이 팩트만 박음',
    riskHead: '오늘 배포 안 하면 streak {streak}주 → 0.',
    riskRest: ' 하나라도 ship ㄱㄱ',
    warnHead: '내일이 배포일!',
    warnRest: ' 완료 0건 — 오늘 하나는 끝내자',
    todayHead: '오늘이 배포일!',
    todayRest: ' ⏵⏵ ship 으로 {ver} 릴리즈 ㄱㄱ',
    normalHead: 'D-{d} · {day}요일 배포!',
    normalRest: ' 커밋 쌓는 중 · streak {streak}주',
    tips: '/sprint 에 커밋 쌓고 {day}요일에 ship 하면 됨',
    onboard: '배포자 이름부터 박고 시작함.\n나중에 배너의 이름 눌러서 바꿀 수 있음.',
    about:
      'deploy-day는 인생을 소프트웨어처럼 배포하는 todo 앱임.\n\n· 일주일 = 스프린트 한 판\n· 할 일은 커밋처럼 쌓음\n· 정해진 요일에 한 주를 ship\n· 완료한 건 릴리즈노트로 박제, 못한 건 다음 주 롤백\n· 연속 배포하면 streak 쌓임\n\n핵심은 완벽한 계획보다 그냥 매주 배포하는 거임.\n거창한 결심 ㄴㄴ, 매주 0.1씩 올리면 됨.\n\nUI는 Claude Code CLI 오마주임.',
    emptySprint: '아직 커밋 없음\n오늘 할 거 하나 추가ㄱㄱ',
    emptyBacklog: '백로그 비어있음\n다음 버전 아이디어 미리 던져놓기',
    emptyChangelog: '아직 배포 이력 없음\n첫 {day}요일에 {ver} 찍어보자',
    emptyMemo: '포스트잇 없음\n+ memo 로 바탕화면에 하나 붙여보셈',
    noReleaseYet: '아직 릴리즈 없음 — 첫 배포가 첫 뉴스임',
    shipNotReady: '배포는 {day}요일에 🚀 (지금은 커밋 쌓는 날)',
    shipDone: '🚀 {ver} 배포 완료!',
    shipDialogSub: '완료한 건 릴리즈노트로 박제 · 못한 건 다음 스프린트로 롤백',
    tutorial: {
      intro: 'deploy-day는 인생을 소프트웨어처럼 "배포"하는 todo 앱임.\n한 주 = 스프린트, 할 일 = 커밋, 한 주 마무리 = ship.\n내가 가리키는 거 직접 눌러보면 됨. 1분컷.',
      project: '먼저 프로젝트부터 하나 파셈.\n아래 반짝이는 [+ 프로젝트] 눌러서 이름 박으면 됨 (예: 운동, 자격증).\n꾸준히 할 큰 묶음임.',
      commit: '이제 이번 주에 할 거 하나 적고 Enter.\n이게 커밋임 — 작을수록 좋음.',
      commit2: '하나는 심심하잖음. 커밋 하나 더 적어보셈.\n한 주에 해낼 거 차곡차곡 쌓아두는 거임.',
      reorder: '이제 커밋 끌어서 순서 바꿔보셈.\n꾹 잡고 위아래로 옮기면 자리 바뀜.\n중요한 거 위로 올리면 됨.',
      check: '했으면 ☐ 눌러서 체크.\n커밋 하나 완료해보셈 — 밑으로 가라앉음.\n(글자 누르면 수정, ✕ 로 삭제)',
      move: '커밋 끌어서 위 [전체] 칩에 떨궈보셈.\n분류 바뀜 — 프로젝트 칩에 떨구면 그 프로젝트행.\n잘못 넣었을 때 이렇게 옮김.',
      ship: '이게 ship 버튼임. 한번 눌러보셈.\n배포 요일(기본 목) 되면 켜지고, 누르면 한 주가 릴리즈로 박제됨.\n(지금은 연습이라 실제 배포 ㄴㄴ)',
      backlog: '위 /backlog 탭 눌러보셈.\n나중에 할 거 보관함임. 잊기 싫은 거 던져두고 → pull 로 스프린트에 끌어옴.',
      changelog: '/changelog 탭 눌러보셈.\nship 할 때마다 릴리즈 쌓이는 역사임. 내가 뭐 했나 돌아보는 곳.',
      memo: '/memo 탭도 눌러보셈.\n바탕화면 포스트잇임. 항상위·색변경·커밋으로 보내기 됨.\n끌면 가장자리·다른 메모에 자석처럼 붙음.',
      config: '마지막 /config 탭 눌러보셈.\n말투(페르소나)·테마·백업(파일 export/import) 다 거기서 바꿈.',
      streak: 'streak = 연속 배포 주수.\n매주 하나라도 ship 하면 1주씩 쌓이고, 빈손 배포면 0으로 리셋.\n안 끊기게 ㄱㄱ.',
      easter: '마지막 비밀 하나 🤫\n위 배너 깨진 픽셀 그림 눌러보셈.\n계속 누르면 진짜 Clawd(마스코트) 나옴 ㅋㅋ',
      done: '끝. 이제 니 차례임.\n매주 작게라도 ship 하면 인생도 매주 0.1씩 오름.\n이번 주도 ㄱㄱ 🚀',
    },
    ui: {
      nameChange: '이름 바꿈',
      memoSent: '메모 커밋으로 보냄',
      clawd: '✻ Clawd 찾음! 계속 누르면 또 깨짐 ㅋㅋ',
      todoEdit: '커밋 수정',
      projAdd: '새 프로젝트',
      projAddHint: '이름 (예: deploy-day)',
      projRename: '프로젝트 이름 수정',
      projDelAsk: "'{name}' 삭제함? 이 프로젝트 커밋 {n}개도 같이 날아감. 못 되돌림.",
      shipTitle: '{ver} 배포',
      shipHint: '한 줄 요약 (선택)',
      emptyProj: '이 프로젝트엔 커밋 없음',
      exportToast: '백업 파일로 저장함',
      exportFail: '저장 실패',
      importAsk: '이 파일로 덮어씀? 지금 데이터 다 날아감.',
      importOk: '복원함',
      importFail: '복원 실패 — 백업 파일 맞는지 확인',
      resetAsk: '전부 초기화함? 못 되돌림.',
      resetToast: '초기화됨',
      memoDelAsk: '메모 삭제함? 내용도 날아감.',
    },
  },
  // ===== Sage — 차분 정중 =====
  {
    id: 'sage',
    name: 'Sage',
    tagline: '차분한 정중함. 담백하게 사실만 전합니다',
    riskHead: '오늘 배포하지 않으면 streak {streak}주가 초기화됩니다.',
    riskRest: ' 한 건이라도 완료해 두시기 바랍니다',
    warnHead: '내일이 배포일입니다.',
    warnRest: ' 완료 0건 — 오늘 한 건을 마무리해 두시면 좋습니다',
    todayHead: '오늘이 배포일입니다.',
    todayRest: ' ⏵⏵ ship 으로 {ver}를 릴리즈합니다',
    normalHead: 'D-{d} · {day}요일 배포.',
    normalRest: ' 진행 중 · streak {streak}주',
    tips: '/sprint 에 작업을 쌓고 {day}요일에 ship 합니다',
    onboard: '사용자 이름을 입력해 주세요.\n배너의 이름을 누르면 변경할 수 있습니다.',
    about:
      'deploy-day는 인생을 소프트웨어처럼 배포하는 todo 애플리케이션입니다.\n\n· 일주일이 하나의 스프린트입니다\n· 할 일은 커밋처럼 누적합니다\n· 정해진 요일에 한 주를 ship 합니다\n· 완료 항목은 릴리즈노트에 기록되고, 미완료 항목은 다음 주로 이월됩니다\n· 연속 배포 시 streak이 누적됩니다\n\n완벽한 계획보다 주기적인 배포를 지향합니다.\n매주 조금씩, 버전을 0.1씩 올려 나가십시오.\n\nUI는 Claude Code CLI에 대한 오마주입니다.',
    emptySprint: '등록된 작업이 없습니다\n오늘 할 작업을 하나 추가해 보세요',
    emptyBacklog: '백로그가 비어 있습니다\n다음 버전에 할 작업을 미리 등록해 두세요',
    emptyChangelog: '배포 이력이 없습니다\n첫 {day}요일에 {ver}을 기록해 보세요',
    emptyMemo: '포스트잇이 없습니다\n+ memo 로 바탕화면에 추가할 수 있습니다',
    noReleaseYet: '아직 릴리즈가 없습니다 — 첫 배포가 첫 소식이 됩니다',
    shipNotReady: '배포는 {day}요일에 진행됩니다 🚀',
    shipDone: '🚀 {ver} 배포가 완료되었습니다',
    shipDialogSub: '완료 항목은 릴리즈노트에 기록되고, 미완료 항목은 다음 스프린트로 이월됩니다',
    tutorial: {
      intro: 'deploy-day는 인생을 소프트웨어처럼 "배포"하는 todo 앱입니다.\n한 주가 스프린트, 할 일이 커밋, 한 주의 마무리가 ship 입니다.\n안내해 드리는 위치를 직접 눌러 진행하시면 됩니다. 1분이면 충분합니다.',
      project: '먼저 프로젝트를 등록합니다.\n아래 강조된 [+ 프로젝트]를 눌러 이름을 입력하세요 (예: 운동, 자격증).\n꾸준히 진행할 큰 단위입니다.',
      commit: '이번 주에 할 작업을 입력하고 Enter를 누르세요.\n이것이 커밋입니다 — 작은 단위를 권장합니다.',
      commit2: '커밋을 하나 더 추가해 보세요.\n한 주에 해낼 작업들을 모아 두는 것입니다.',
      reorder: '이제 커밋을 끌어 순서를 변경해 보세요.\n항목을 잡고 위아래로 옮기면 자리가 바뀝니다.\n중요한 항목을 위로 두면 보기 편합니다.',
      check: '완료한 작업은 ☐ 를 눌러 체크합니다.\n커밋 하나를 완료 처리해 보세요 — 그룹 아래로 정렬됩니다.\n(텍스트를 누르면 수정, ✕ 로 삭제됩니다)',
      move: '커밋을 끌어 위 [전체] 칩에 놓아 보세요.\n분류가 변경됩니다 — 프로젝트 칩에 놓으면 해당 프로젝트로 이동합니다.\n잘못 입력한 경우 이렇게 옮길 수 있습니다.',
      ship: 'ship 버튼입니다. 한번 눌러 보세요.\n배포 요일(기본 목요일)에 활성화되며, 누르면 한 주가 릴리즈로 기록됩니다.\n(현재는 연습이므로 실제 배포되지 않습니다.)',
      backlog: '상단 /backlog 탭을 눌러 보세요.\n대기 작업 보관함입니다. 잊지 않을 작업을 보관하고 → pull 로 스프린트에 가져옵니다.',
      changelog: '/changelog 탭을 눌러 보세요.\nship 할 때마다 릴리즈가 기록되는 이력입니다. 성취를 돌아보는 공간입니다.',
      memo: '/memo 탭을 눌러 보세요.\n바탕화면 포스트잇입니다. 항상 위 고정·색 변경·커밋 전송을 지원합니다.\n끌어서 옮기면 화면 가장자리·다른 메모에 정렬됩니다.',
      config: '마지막으로 /config 탭을 눌러 보세요.\n말투(페르소나)·테마·데이터 백업(파일 export/import)을 변경할 수 있습니다.',
      streak: 'streak은 연속 배포 주수입니다.\n매주 한 건 이상 완료 후 ship 하면 누적되고, 빈손으로 배포하면 초기화됩니다.',
      easter: '마지막으로 작은 비밀입니다 🤫\n상단 배너의 깨진 픽셀 그림을 눌러 보세요.\n반복해서 누르면 진짜 Clawd(마스코트)가 나타납니다.',
      done: '안내를 마칩니다. 이제 시작하실 차례입니다.\n매주 조금씩 배포하면 인생도 매주 0.1씩 올라갑니다.\n이번 주도 좋은 한 주 되시길 바랍니다. 🚀',
    },
    ui: {
      nameChange: '이름 변경',
      memoSent: '메모를 커밋으로 보냈습니다',
      clawd: '✻ Clawd를 찾았습니다. 다시 누르면 또 변형됩니다',
      todoEdit: '커밋 수정',
      projAdd: '새 프로젝트',
      projAddHint: '이름 (예: deploy-day)',
      projRename: '프로젝트 이름 변경',
      projDelAsk: "'{name}' 프로젝트를 삭제하시겠습니까? 이 프로젝트의 커밋 {n}개도 함께 삭제됩니다. 되돌릴 수 없습니다.",
      shipTitle: '{ver} 배포',
      shipHint: '한 줄 요약 (선택)',
      emptyProj: '이 프로젝트에 등록된 커밋이 없습니다',
      exportToast: '백업 파일을 저장했습니다',
      exportFail: '저장에 실패했습니다',
      importAsk: '이 파일의 내용으로 덮어쓰시겠습니까? 현재 데이터는 사라집니다.',
      importOk: '복원했습니다',
      importFail: '복원에 실패했습니다 — 올바른 백업 파일인지 확인하십시오',
      resetAsk: '전체를 초기화하시겠습니까? 되돌릴 수 없습니다.',
      resetToast: '초기화했습니다',
      memoDelAsk: '메모를 삭제하시겠습니까? 내용도 함께 삭제됩니다.',
    },
  },
];

const enPersonas: Persona[] = [
  // ===== Sunny (default) — warm encouragement =====
  {
    id: 'sunny',
    name: 'Sunny',
    tagline: "Warm encouragement. Tells you you're doing great",
    riskHead: 'Skip shipping today and your {streak}-week streak resets.',
    riskRest: ' Just finish one small thing!',
    warnHead: 'Tomorrow is ship day!',
    warnRest: ' Still 0 done — how about finishing one today?',
    todayHead: 'Today is ship day!',
    todayRest: ' ⏵⏵ Hit ship to release {ver} 🎉',
    normalHead: 'D-{d} · see you on {day}!',
    normalRest: ' Stacking up nicely · streak {streak}w',
    tips: 'Stack tasks in /sprint and ship on {day}',
    onboard: 'First, tell me your name.\nTap the name on the banner to change it anytime.',
    about:
      'deploy-day is a todo app that ships your life like software.\n\n· One week is one sprint\n· Tasks stack up like commits\n· You ship the week on a set day\n· Done items go to the release notes, unfinished ones roll to next week\n· Keep shipping and your streak grows\n\nConsistent shipping beats a perfect plan.\nBump your version a little every week — your life goes up 0.1 too!\n\nThe UI is an homage to the Claude Code CLI.',
    emptySprint: 'Nothing to do yet\nJot down one thing you want to do today',
    emptyBacklog: 'Your backlog is empty\nStash ideas for later here',
    emptyChangelog: "No releases yet\nLet's ship {ver} together this {day}",
    emptyMemo: 'No sticky notes\nAdd one to your desktop with + memo',
    noReleaseYet: 'No releases yet — your first ship will be the first news!',
    shipNotReady: 'Shipping happens on {day} 🚀 Today is a stacking day!',
    shipDone: '🚀 {ver} shipped! Nice work',
    shipDialogSub: 'Done items go to the release notes, unfinished ones roll to next week',
    tutorial: {
      intro: 'Hi! deploy-day is a todo app that "ships" your life like software.\nA week is a sprint, tasks are commits, wrapping up the week is a ship.\nJust tap where I point and learn by doing — it takes a minute!',
      project: "Let's make a project first!\nTap the glowing [+ project] below and give it a name (e.g. Workout, Cert).\nIt's a big bucket you'll work on steadily.",
      commit: 'Great! Now type one thing to do this week and press Enter.\nThis is a commit — the smaller, the better.',
      commit2: "One feels lonely, right? Let's add one more commit.\nThis is how you stack up the things you'll get done this week.",
      reorder: 'Now drag a commit to reorder it!\nGrab it and move it up or down to swap places.\nPut the important stuff on top so it stands out.',
      check: 'Tap ☐ to check off what you finished.\nTry completing one commit — it slides down below the group.\n(Tap the text to edit, ✕ to delete)',
      move: "Drag a commit onto the [All] chip above.\nIts category changes — drop it on a project chip to file it there.\nThat's how you fix a misfiled commit.",
      ship: 'This is the ship button. Give it a tap!\nIt lights up on ship day (Thursday by default); pressing it freezes the week into a release.\n(This is just practice — nothing actually ships ☺)',
      backlog: 'Let\'s tap the /backlog tab above.\nIt\'s a "later" stash. Toss in ideas you don\'t want to forget,\nand pull them into the sprint later with → pull.',
      changelog: 'Now tap the /changelog tab.\nEvery ship adds a line — it\'s the history of all you\'ve done.\nA place to look back and go "wow, I did all this."',
      memo: 'Tap the /memo tab too!\nThese are desktop sticky notes — always-on-top, color change, send-to-commit.\nDrag them and they snap to screen edges & other notes.',
      config: 'Last tab — tap /config.\nVoice (persona), dark/light theme, and data backup (file export/import) all live here.',
      streak: 'Streak is your consecutive ship weeks.\nFinish at least one and ship each week to add a week; ship empty-handed and it drops to 0.\nKeep it alive!',
      easter: "One little secret 🤫\nTap the glitchy pixel art on the banner above!\nKeep tapping and the real Clawd (this app's mascot) shows up.",
      done: "All set! It's your turn now.\nShip a little every week and your life goes up 0.1 too.\nYou've got this week! 🚀",
    },
    ui: {
      nameChange: 'Change name',
      memoSent: 'Sent the note to commits',
      clawd: '✻ You found Clawd! Keep tapping for more ㅎㅎ',
      todoEdit: 'Edit commit',
      projAdd: 'New project',
      projAddHint: 'name (e.g. deploy-day)',
      projRename: 'Rename project',
      projDelAsk: "Delete project '{name}'? Its {n} commit(s) will be removed too. This can't be undone.",
      shipTitle: 'Ship {ver}',
      shipHint: 'one-line summary (optional)',
      emptyProj: 'No commits in this project yet',
      exportToast: 'Backup file saved',
      exportFail: 'Failed to save',
      importAsk: 'Overwrite with this file? Your current data will be gone.',
      importOk: 'Restored',
      importFail: "Restore failed — check that it's a valid backup file",
      resetAsk: "Reset everything? This can't be undone.",
      resetToast: 'Reset done',
      memoDelAsk: 'Delete this note? Its content will be gone too.',
    },
  },
  // ===== Victor — cynical & blunt =====
  {
    id: 'victor',
    name: 'Victor',
    tagline: 'Cynical & blunt. Just the facts, no fluff',
    riskHead: 'No ship today and your {streak}-week streak goes to 0.',
    riskRest: ' Ship at least one thing.',
    warnHead: 'Ship day is tomorrow!',
    warnRest: ' 0 done — finish one today.',
    todayHead: 'Ship day is today!',
    todayRest: ' ⏵⏵ Hit ship and release {ver}.',
    normalHead: 'D-{d} · ship on {day}!',
    normalRest: ' Stacking commits · streak {streak}w',
    tips: "Stack commits in /sprint, ship on {day}. That's it.",
    onboard: 'Drop your name first.\nYou can change it later by tapping it on the banner.',
    about:
      'deploy-day is a todo app that ships your life like software.\n\n· One week = one sprint\n· Tasks stack like commits\n· You ship the week on a set day\n· Done stuff gets logged in release notes, the rest rolls to next week\n· Keep shipping and your streak builds\n\nThe point: stop overplanning, just ship every week.\nNo grand resolutions — just +0.1 a week.\n\nUI is an homage to the Claude Code CLI.',
    emptySprint: 'No commits yet\nAdd one thing to do today.',
    emptyBacklog: "Backlog's empty\nToss in ideas for the next version.",
    emptyChangelog: "No ship history yet\nLet's cut {ver} this {day}.",
    emptyMemo: 'No sticky notes\nSlap one on your desktop with + memo.',
    noReleaseYet: 'No releases yet — your first ship is the headline',
    shipNotReady: 'Shipping is on {day} 🚀 (today you just stack)',
    shipDone: '🚀 {ver} shipped!',
    shipDialogSub: 'Done stuff gets logged · the rest rolls to next sprint',
    tutorial: {
      intro: 'deploy-day is a todo app that "ships" your life like software.\nWeek = sprint, tasks = commits, wrapping up = ship.\nJust tap where I point. Takes a minute.',
      project: 'Make a project first.\nTap the glowing [+ project] and name it (e.g. Workout, Cert).\nIt\'s a big bucket you work on steadily.',
      commit: 'Now type one thing to do this week and press Enter.\nThis is a commit — smaller is better.',
      commit2: "One's boring. Add one more commit.\nThis is how you stack what you'll get done this week.",
      reorder: 'Now drag a commit to reorder it.\nGrab it, move up/down, it swaps.\nPut the important one on top.',
      check: 'Done? Tap ☐ to check it.\nComplete one commit — it sinks to the bottom.\n(Tap text to edit, ✕ to delete)',
      move: "Drag a commit onto the [All] chip above.\nCategory changes — drop it on a project chip to file it there.\nThat's how you fix a misfiled one.",
      ship: 'This is the ship button. Tap it.\nLights up on ship day (Thu by default); pressing it freezes the week into a release.\n(Just practice — nothing actually ships)',
      backlog: 'Tap the /backlog tab above.\nIt\'s the "later" stash. Toss stuff in, pull it into the sprint with → pull.',
      changelog: 'Tap the /changelog tab.\nEvery ship stacks a line — your history. Look back at what you did.',
      memo: 'Tap the /memo tab too.\nDesktop sticky notes. Always-on-top, color change, send-to-commit.\nDrag them and they snap to edges & other notes.',
      config: 'Last one — tap the /config tab.\nVoice (persona), theme, backup (file export/import) — all there.',
      streak: 'Streak = consecutive ship weeks.\nShip with at least one done each week to add a week; ship empty and it resets to 0.\nDon\'t break it.',
      easter: 'One last secret 🤫\nTap the glitchy pixel art on the banner.\nKeep tapping and the real Clawd (mascot) shows up lol.',
      done: 'Done. Your turn now.\nShip a little every week and your life goes up 0.1 too.\nGo get this week 🚀',
    },
    ui: {
      nameChange: 'Change name',
      memoSent: 'Note sent to commits',
      clawd: '✻ Found Clawd! Keep tapping, it breaks again lol',
      todoEdit: 'Edit commit',
      projAdd: 'New project',
      projAddHint: 'name (e.g. deploy-day)',
      projRename: 'Rename project',
      projDelAsk: "Delete '{name}'? Its {n} commit(s) go too. No undo.",
      shipTitle: 'Ship {ver}',
      shipHint: 'one-line summary (optional)',
      emptyProj: 'No commits in this project',
      exportToast: 'Saved as backup file',
      exportFail: 'Save failed',
      importAsk: "Overwrite with this file? Current data's all gone.",
      importOk: 'Restored',
      importFail: "Restore failed — check it's a real backup file",
      resetAsk: 'Reset everything? No undo.',
      resetToast: 'Reset',
      memoDelAsk: 'Delete the note? Content goes too.',
    },
  },
  // ===== Sage — calm & courteous =====
  {
    id: 'sage',
    name: 'Sage',
    tagline: 'Calm and courteous. Plainly states the facts',
    riskHead: 'If you do not ship today, your {streak}-week streak will reset.',
    riskRest: ' Please complete at least one item.',
    warnHead: 'Tomorrow is ship day.',
    warnRest: ' 0 completed — it would be good to finish one today.',
    todayHead: 'Today is ship day.',
    todayRest: ' ⏵⏵ Use ship to release {ver}.',
    normalHead: 'D-{d} · ship on {day}.',
    normalRest: ' In progress · streak {streak}w',
    tips: 'Stack your work in /sprint and ship on {day}.',
    onboard: 'Please enter your name.\nYou can change it by tapping the name on the banner.',
    about:
      'deploy-day is a todo application that ships your life like software.\n\n· One week constitutes a single sprint\n· Tasks accumulate like commits\n· Each week is shipped on a designated day\n· Completed items are recorded in the release notes; unfinished items carry over to the next week\n· Consecutive ships accumulate as a streak\n\nWe favor periodic shipping over a perfect plan.\nRaise your version by 0.1 each week, little by little.\n\nThe UI is an homage to the Claude Code CLI.',
    emptySprint: 'No tasks registered\nTry adding one task for today.',
    emptyBacklog: 'The backlog is empty\nRegister tasks for the next version in advance.',
    emptyChangelog: 'No ship history\nTry recording {ver} this {day}.',
    emptyMemo: 'No sticky notes\nYou can add one to your desktop with + memo.',
    noReleaseYet: 'No releases yet — your first ship will be the first news.',
    shipNotReady: 'Shipping takes place on {day}. 🚀',
    shipDone: '🚀 {ver} has been shipped.',
    shipDialogSub: 'Completed items are recorded; unfinished items carry over to the next sprint',
    tutorial: {
      intro: 'deploy-day is a todo app that "ships" your life like software.\nA week is a sprint, tasks are commits, and wrapping up the week is a ship.\nPlease tap where I indicate to proceed. A minute is enough.',
      project: 'First, register a project.\nTap the highlighted [+ project] and enter a name (e.g. Workout, Certification).\nIt is a large unit you will work on steadily.',
      commit: 'Type a task for this week and press Enter.\nThis is a commit — smaller units are recommended.',
      commit2: 'Please add one more commit.\nThis is how you gather the tasks you will complete this week.',
      reorder: 'Now drag a commit to change its order.\nHold an item and move it up or down to swap positions.\nPlacing important items on top makes them easier to see.',
      check: 'Tap ☐ to check off completed tasks.\nTry completing one commit — it sorts below the group.\n(Tap the text to edit, ✕ to delete)',
      move: 'Drag a commit onto the [All] chip above.\nIts category changes — dropping it on a project chip moves it there.\nUse this to correct a misfiled entry.',
      ship: 'This is the ship button. Please give it a tap.\nIt activates on ship day (Thursday by default); pressing it records the week as a release.\n(This is practice, so nothing is actually shipped.)',
      backlog: 'Tap the /backlog tab above.\nIt is a stash for pending tasks. Keep items here and bring them into the sprint with → pull.',
      changelog: 'Tap the /changelog tab.\nEach ship is recorded here as your history. A space to reflect on your achievements.',
      memo: 'Tap the /memo tab.\nThese are desktop sticky notes — always-on-top, color change, and send-to-commit are supported.\nDragging them aligns to screen edges & other notes.',
      config: 'Finally, tap the /config tab.\nYou can change the voice (persona), theme, and data backup (file export/import) here.',
      streak: 'Streak is the number of consecutive ship weeks.\nIt accumulates when you ship with at least one item completed each week, and resets when you ship empty-handed.',
      easter: 'Lastly, a small secret 🤫\nTap the glitchy pixel art on the banner above.\nTapping repeatedly reveals the real Clawd (the mascot).',
      done: 'That concludes the guide. It is now your turn.\nShipping a little each week raises your life by 0.1 as well.\nI wish you a good week ahead. 🚀',
    },
    ui: {
      nameChange: 'Change name',
      memoSent: 'The note has been sent to commits',
      clawd: '✻ You found Clawd. Tap again to transform it further',
      todoEdit: 'Edit commit',
      projAdd: 'New project',
      projAddHint: 'name (e.g. deploy-day)',
      projRename: 'Rename project',
      projDelAsk: "Delete project '{name}'? Its {n} commit(s) will also be deleted. This cannot be undone.",
      shipTitle: 'Ship {ver}',
      shipHint: 'one-line summary (optional)',
      emptyProj: 'No commits registered in this project',
      exportToast: 'Backup file saved',
      exportFail: 'Failed to save',
      importAsk: 'Overwrite with the contents of this file? Your current data will be lost.',
      importOk: 'Restored',
      importFail: 'Restore failed — please verify it is a valid backup file',
      resetAsk: 'Reset everything? This cannot be undone.',
      resetToast: 'Reset complete',
      memoDelAsk: 'Delete this note? Its content will also be deleted.',
    },
  },
];

export const PERSONAS: Record<Lang, Persona[]> = { ko: koPersonas, en: enPersonas };

// 해당 언어의 페르소나 목록 (config 선택 UI 용)
export const personaList = (lang: Lang): Persona[] => PERSONAS[lang] ?? PERSONAS.ko;

export const personaOf = (s: AppState): Persona => {
  const list = personaList(s.lang);
  return list.find((p) => p.id === s.persona) ?? list[0];
};
