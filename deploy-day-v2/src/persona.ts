// 앱 말투 페르소나 — 이름으로만 구분(연령·성별 표기 없음).
// 모든 voice 있는 UI 문구가 페르소나를 따름. 정책 문서(개인정보/약관)만 예외(표준).
import type { AppState } from './types';

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
  reviveAsk: string; // {name}
  reviveToast: string;
  exportToast: string;
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
  shipNotReady: string;
  shipDone: string;
  shipGrad: string;
  shipDialogSub: string;
  tutorial: Record<string, string>;
  ui: PersonaUI;
}

// '{key}' 치환
export const pfmt = (t: string, v: Record<string, string | number>): string =>
  Object.entries(v).reduce((s, [k, val]) => s.split(`{${k}}`).join(`${val}`), t);

export const kPersonas: Persona[] = [
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
      'deploy-day는 인생을 소프트웨어처럼 배포하는 todo 앱이에요.\n\n· 일주일이 하나의 스프린트예요\n· 할 일은 커밋처럼 쌓아요\n· 정해진 요일에 한 주를 ship 해요\n· 완료한 일은 릴리즈노트에 남고, 못한 일은 다음 주로 넘어가요\n· 꾸준히 배포하면 streak이 쌓여요\n· 끝낸 프로젝트는 졸업해서 명예의 전당에 남아요\n\n완벽한 계획보다 꾸준한 배포가 더 멀리 가요.\n매주 작게라도 버전을 올려봐요 — 당신의 인생도 매주 0.1씩!\n\nUI는 Claude Code CLI에 대한 오마주예요.',
    emptySprint: '아직 할 일이 없어요\n오늘 하고 싶은 것 하나를 적어보세요',
    emptyBacklog: '백로그가 비어 있어요\n다음에 하고 싶은 일을 미리 담아두세요',
    emptyChangelog: '아직 배포 기록이 없어요\n첫 {day}요일에 {ver}을 함께 찍어봐요',
    emptyMemo: '포스트잇이 없어요\n+ memo 로 바탕화면에 붙여보세요',
    shipNotReady: '배포는 {day}요일에 해요 🚀 오늘은 쌓는 날!',
    shipDone: '🚀 {ver} 배포 완료! 수고했어요',
    shipGrad: '🎉 {names} 졸업! {ver} 배포 완료, 축하해요',
    shipDialogSub: '완료한 일은 릴리즈노트에 남고, 못한 일은 다음 주로 넘어가요',
    tutorial: {
      intro: '안녕하세요! deploy-day는 인생을 소프트웨어처럼 "배포"하는 todo 앱이에요.\n한 주가 스프린트, 할 일이 커밋, 한 주의 마무리가 ship 이에요.\n제가 하나씩 직접 따라하면서 알려드릴게요 — 1분이면 돼요!',
      project: '먼저 프로젝트를 만들어볼까요?\n[+ 프로젝트]를 눌러 이름을 지어주세요 (예: 운동, 자격증).\n공부·사이드프로젝트처럼 "꾸준히 할 큰 묶음"이에요.',
      commit: '이번 주에 할 일을 하나 적고 Enter!\n이게 커밋이에요 — 작게 쪼갤수록 좋아요.\n위 프로젝트 칩을 고르고 적으면 그 프로젝트로 분류돼요.',
      check: '끝낸 일은 ☐ 를 눌러 체크해요.\n완료한 일은 그룹 아래로 자동으로 내려가요.\n(글자를 누르면 수정, ✕ 로 삭제할 수 있어요)',
      reorder: '커밋은 끌어서 순서를 바꿀 수 있어요.\n커밋을 잡고 위아래로 옮기면 자리가 바뀌어요.\n중요한 일을 위로 올려두면 한눈에 보기 좋아요!',
      move: '실수로 미분류에 적었나요? 괜찮아요.\n커밋을 끌어서 위쪽 프로젝트 칩에 떨어뜨리면 그 프로젝트로 옮겨져요.\n(다음 단계로 넘기려면 [다음]을 눌러주세요)',
      backlog: '/backlog 는 "다음에 할 일" 보관함이에요.\n지금 당장은 아니지만 잊기 싫은 아이디어를 던져두고,\n나중에 → pull 로 이번 스프린트에 가져올 수 있어요.',
      ship: '여기가 ship 버튼이에요.\n배포 요일(설정 가능, 기본 목요일)이 되면 켜지고,\n누르면 한 주가 릴리즈로 박제돼요. 못한 일은 다음 주로 넘어가니 걱정 마세요.',
      changelog: '/changelog 는 나의 릴리즈 역사예요.\nship 할 때마다 한 줄씩 쌓여요. 졸업한 프로젝트는 🎓 명예의 전당에 남아요.\n내가 이만큼 해냈구나 — 돌아보는 곳이에요.',
      memo: '/memo 는 바탕화면 포스트잇이에요.\n[pin] 으로 항상 위 고정, ◑ 로 색 변경, →commit 으로 스프린트에 보내기.\n끌어서 옮기면 화면 가장자리·다른 메모에 자석처럼 붙어요.',
      config: '/config 에서 다 바꿀 수 있어요.\n지금 이 말투(페르소나)도 여기서 Victor·Sunny·Sage 중에 고르고,\n다크/라이트 테마, 데이터 백업(export/import)도 여기 있어요.',
      streak: 'streak은 연속 배포 주수예요.\n매주 하나라도 완료하고 ship 하면 1주씩 쌓이고,\n빈손으로 배포하면 0으로 초기화돼요. 끊기지 않게 지켜봐요!',
      easter: '마지막으로 작은 비밀 하나 🤫\n위 배너의 깨진 픽셀 그림을 계속 눌러보세요.\n언젠가 진짜 Clawd(이 앱의 마스코트)가 나타나요!',
      done: '준비 끝! 이제 당신 차례예요.\n매주 작게라도 ship 하면 인생도 매주 0.1씩 올라가요.\n이번 주도 화이팅! 🚀',
    },
    ui: {
      nameChange: '이름 바꾸기',
      memoSent: '메모를 커밋으로 보냈어요',
      clawd: '✻ Clawd를 찾았어요! 계속 누르면 또 바뀌어요 ㅎㅎ',
      todoEdit: '커밋 수정하기',
      projAdd: '새 프로젝트',
      projAddHint: '이름 (예: 성경썰앱)',
      projRename: '프로젝트 이름 수정',
      projDelAsk: "'{name}' 프로젝트를 삭제할까요? 이 프로젝트의 커밋 {n}개도 함께 사라져요. 되돌릴 수 없어요.",
      shipTitle: '{ver} 배포하기',
      shipHint: '한 줄 요약 (선택)',
      emptyProj: '이 프로젝트엔 아직 커밋이 없어요',
      reviveAsk: "'{name}' 다시 진행할까요?",
      reviveToast: '프로젝트를 다시 시작해요 ↻',
      exportToast: '백업을 클립보드에 복사했어요',
      importAsk: '클립보드의 백업으로 덮어쓸까요?',
      importOk: '복원했어요',
      importFail: '복원에 실패했어요 — 클립보드를 확인해주세요',
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
      'deploy-day는 인생을 소프트웨어처럼 배포하는 todo 앱임.\n\n· 일주일 = 스프린트 한 판\n· 할 일은 커밋처럼 쌓음\n· 정해진 요일에 한 주를 ship\n· 완료한 건 릴리즈노트로 박제, 못한 건 다음 주 롤백\n· 연속 배포하면 streak 쌓임\n· 끝낸 프로젝트는 졸업시킴\n\n핵심은 완벽한 계획보다 그냥 매주 배포하는 거임.\n거창한 결심 ㄴㄴ, 매주 0.1씩 올리면 됨.\n\nUI는 Claude Code CLI 오마주임.',
    emptySprint: '아직 커밋 없음\n오늘 할 거 하나 추가ㄱㄱ',
    emptyBacklog: '백로그 비어있음\n다음 버전 아이디어 미리 던져놓기',
    emptyChangelog: '아직 배포 이력 없음\n첫 {day}요일에 {ver} 찍어보자',
    emptyMemo: '포스트잇 없음\n+ memo 로 바탕화면에 하나 붙여보셈',
    shipNotReady: '배포는 {day}요일에 🚀 (지금은 커밋 쌓는 날)',
    shipDone: '🚀 {ver} 배포 완료!',
    shipGrad: '🎉 {names} 졸업 · {ver} 배포!',
    shipDialogSub: '완료한 건 릴리즈노트로 박제 · 못한 건 다음 스프린트로 롤백',
    tutorial: {
      intro: 'deploy-day는 인생을 소프트웨어처럼 "배포"하는 todo 앱임.\n한 주 = 스프린트, 할 일 = 커밋, 한 주 마무리 = ship.\n내가 직접 따라하면서 알려줌. 1분컷.',
      project: '프로젝트부터 하나 파셈.\n[+ 프로젝트] 눌러서 이름 박으면 됨 (예: 운동, 자격증).\n꾸준히 할 큰 묶음임.',
      commit: '이제 이번 주에 할 거 하나 적고 Enter.\n이게 커밋임 — 작을수록 좋음.\n위 프로젝트 칩 고르고 적으면 그걸로 분류됨.',
      check: '했으면 ☐ 눌러서 체크.\n완료된 건 밑으로 가라앉음.\n(글자 누르면 수정, ✕ 로 삭제)',
      reorder: '커밋은 끌어서 순서 바꿀 수 있음.\n잡고 위아래로 옮기면 자리 바뀜.\n중요한 거 위로 올려두면 됨.',
      move: '미분류에 잘못 적었어도 ㄱㅊ.\n커밋 끌어서 위 프로젝트 칩에 떨구면 옮겨짐.\n([다음]으로 넘어가셈)',
      backlog: '/backlog 는 나중에 할 거 보관함임.\n지금 말고 잊기 싫은 거 던져두고,\n나중에 → pull 로 스프린트에 끌어옴.',
      ship: '이게 ship 버튼임.\n배포 요일(설정 가능, 기본 목요일) 되면 켜지고,\n누르면 한 주가 릴리즈로 박제됨. 못한 건 다음 주 롤백.',
      changelog: '/changelog 는 릴리즈 역사임.\nship 할 때마다 한 줄씩 쌓임. 졸업한 프로젝트는 🎓 명예의 전당행.\n내가 뭐 했나 돌아보는 곳.',
      memo: '/memo 는 바탕화면 포스트잇임.\n[pin] 항상위, ◑ 색변경, →commit 으로 스프린트행.\n끌면 가장자리·다른 메모에 자석처럼 붙음.',
      config: '/config 에서 다 바꿈.\n지금 이 말투(페르소나)도 거기서 Victor·Sunny·Sage 중 고름.\n테마·백업도 거기 있음.',
      streak: 'streak = 연속 배포 주수.\n매주 하나라도 ship 하면 1주씩 쌓이고,\n빈손 배포면 0으로 리셋됨. 안 끊기게 잘 ㄱㄱ.',
      easter: '마지막 비밀 하나 🤫\n위 배너 깨진 픽셀 그림 계속 눌러보셈.\n언젠가 진짜 Clawd(마스코트) 나옴 ㅋㅋ',
      done: '끝. 이제 니 차례임.\n매주 작게라도 ship 하면 인생도 매주 0.1씩 오름.\n이번 주도 ㄱㄱ 🚀',
    },
    ui: {
      nameChange: '이름 바꿈',
      memoSent: '메모 커밋으로 보냄',
      clawd: '✻ Clawd 찾음! 계속 누르면 또 깨짐 ㅋㅋ',
      todoEdit: '커밋 수정',
      projAdd: '새 프로젝트',
      projAddHint: '이름 (예: 성경썰앱)',
      projRename: '프로젝트 이름 수정',
      projDelAsk: "'{name}' 삭제함? 이 프로젝트 커밋 {n}개도 같이 날아감. 못 되돌림.",
      shipTitle: '{ver} 배포',
      shipHint: '한 줄 요약 (선택)',
      emptyProj: '이 프로젝트엔 커밋 없음',
      reviveAsk: "'{name}' 다시 함?",
      reviveToast: '프로젝트 부활 ↻',
      exportToast: '백업 JSON 클립보드에 복사함',
      importAsk: '클립보드 백업으로 덮어씀?',
      importOk: '복원함',
      importFail: '복원 실패 — 클립보드 JSON 확인',
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
      'deploy-day는 인생을 소프트웨어처럼 배포하는 todo 애플리케이션입니다.\n\n· 일주일이 하나의 스프린트입니다\n· 할 일은 커밋처럼 누적합니다\n· 정해진 요일에 한 주를 ship 합니다\n· 완료 항목은 릴리즈노트에 기록되고, 미완료 항목은 다음 주로 이월됩니다\n· 연속 배포 시 streak이 누적됩니다\n· 완료한 프로젝트는 졸업하여 명예의 전당에 남습니다\n\n완벽한 계획보다 주기적인 배포를 지향합니다.\n매주 조금씩, 버전을 0.1씩 올려 나가십시오.\n\nUI는 Claude Code CLI에 대한 오마주입니다.',
    emptySprint: '등록된 작업이 없습니다\n오늘 할 작업을 하나 추가해 보세요',
    emptyBacklog: '백로그가 비어 있습니다\n다음 버전에 할 작업을 미리 등록해 두세요',
    emptyChangelog: '배포 이력이 없습니다\n첫 {day}요일에 {ver}을 기록해 보세요',
    emptyMemo: '포스트잇이 없습니다\n+ memo 로 바탕화면에 추가할 수 있습니다',
    shipNotReady: '배포는 {day}요일에 진행됩니다 🚀',
    shipDone: '🚀 {ver} 배포가 완료되었습니다',
    shipGrad: '🎉 {names} 졸업 · {ver} 배포가 완료되었습니다',
    shipDialogSub: '완료 항목은 릴리즈노트에 기록되고, 미완료 항목은 다음 스프린트로 이월됩니다',
    tutorial: {
      intro: 'deploy-day는 인생을 소프트웨어처럼 "배포"하는 todo 앱입니다.\n한 주가 스프린트, 할 일이 커밋, 한 주의 마무리가 ship 입니다.\n직접 따라하며 안내하겠습니다. 1분이면 충분합니다.',
      project: '먼저 프로젝트를 등록합니다.\n[+ 프로젝트]를 눌러 이름을 입력하세요 (예: 운동, 자격증).\n꾸준히 진행할 큰 단위입니다.',
      commit: '이번 주에 할 작업을 입력하고 Enter를 누릅니다.\n이것이 커밋입니다 — 작은 단위를 권장합니다.\n위 프로젝트 칩을 선택하면 해당 프로젝트로 분류됩니다.',
      check: '완료한 작업은 ☐ 를 눌러 체크합니다.\n완료 항목은 그룹 아래로 정렬됩니다.\n(텍스트를 누르면 수정, ✕ 로 삭제됩니다)',
      reorder: '커밋은 끌어서 순서를 변경할 수 있습니다.\n원하는 항목을 잡고 위아래로 옮기면 자리가 바뀝니다.\n중요한 항목을 위로 두면 보기 편합니다.',
      move: '미분류에 잘못 입력하셨다면,\n커밋을 끌어 위 프로젝트 칩에 놓아 이동할 수 있습니다.\n([다음]을 눌러 진행하세요)',
      backlog: '/backlog 는 대기 작업 보관함입니다.\n당장은 아니지만 잊지 않을 작업을 보관하고,\n→ pull 로 이번 스프린트에 가져옵니다.',
      ship: 'ship 버튼입니다.\n배포 요일(설정 가능, 기본 목요일)에 활성화되며,\n누르면 한 주가 릴리즈로 기록됩니다. 미완료 작업은 다음 주로 이월됩니다.',
      changelog: '/changelog 는 릴리즈 이력입니다.\nship 할 때마다 기록되며, 졸업한 프로젝트는 🎓 명예의 전당에 남습니다.\n성취를 돌아보는 공간입니다.',
      memo: '/memo 는 바탕화면 포스트잇입니다.\n[pin] 항상 위 고정, ◑ 색 변경, →commit 으로 스프린트 전송.\n끌어서 옮기면 화면 가장자리·다른 메모에 정렬됩니다.',
      config: '/config 에서 설정을 변경합니다.\n현재 말투(페르소나)도 여기서 Victor·Sunny·Sage 중 선택하며,\n테마와 데이터 백업도 제공됩니다.',
      streak: 'streak은 연속 배포 주수입니다.\n매주 한 건 이상 완료 후 ship 하면 누적되고,\n빈손으로 배포하면 초기화됩니다.',
      easter: '마지막으로 작은 비밀입니다 🤫\n상단 배너의 깨진 픽셀 그림을 반복해서 누르면,\n진짜 Clawd(마스코트)가 나타납니다.',
      done: '안내를 마칩니다. 이제 시작하실 차례입니다.\n매주 조금씩 배포하면 인생도 매주 0.1씩 올라갑니다.\n이번 주도 좋은 한 주 되시길 바랍니다. 🚀',
    },
    ui: {
      nameChange: '이름 변경',
      memoSent: '메모를 커밋으로 보냈습니다',
      clawd: '✻ Clawd를 찾았습니다. 다시 누르면 또 변형됩니다',
      todoEdit: '커밋 수정',
      projAdd: '새 프로젝트',
      projAddHint: '이름 (예: 성경썰앱)',
      projRename: '프로젝트 이름 변경',
      projDelAsk: "'{name}' 프로젝트를 삭제하시겠습니까? 이 프로젝트의 커밋 {n}개도 함께 삭제됩니다. 되돌릴 수 없습니다.",
      shipTitle: '{ver} 배포',
      shipHint: '한 줄 요약 (선택)',
      emptyProj: '이 프로젝트에 등록된 커밋이 없습니다',
      reviveAsk: "'{name}' 프로젝트를 다시 진행하시겠습니까?",
      reviveToast: '프로젝트를 다시 시작합니다 ↻',
      exportToast: '백업을 클립보드에 복사했습니다',
      importAsk: '클립보드의 백업으로 덮어쓰시겠습니까?',
      importOk: '복원했습니다',
      importFail: '복원에 실패했습니다 — 클립보드를 확인하십시오',
      resetAsk: '전체를 초기화하시겠습니까? 되돌릴 수 없습니다.',
      resetToast: '초기화했습니다',
      memoDelAsk: '메모를 삭제하시겠습니까? 내용도 함께 삭제됩니다.',
    },
  },
];

export const personaOf = (s: AppState): Persona =>
  kPersonas.find((p) => p.id === s.persona) ?? kPersonas[0];
