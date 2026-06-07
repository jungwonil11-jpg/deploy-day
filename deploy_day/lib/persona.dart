import 'models.dart';

/// 템플릿 치환 — '{key}' 자리를 값으로 교체.
String pfmt(String t, Map<String, Object> v) =>
    v.entries.fold(t, (s, e) => s.replaceAll('{${e.key}}', '${e.value}'));

/// 앱 말투 페르소나.
/// 이름으로만 구분함 — 연령·성별 표기는 정책상 쓰지 않음.
class Persona {
  final String id;
  final String name;
  final String tagline; // 설정 화면 한 줄 소개

  // ▌ 어나운스 라인 (head는 강조색, rest는 dim)
  final String riskHead; // {streak} — 배포일인데 완료 0건 + streak 위험
  final String riskRest;
  final String warnHead; // 배포 전날인데 완료 0건
  final String warnRest;
  final String todayHead; // 배포일
  final String todayRest; // {ver}
  final String normalHead; // {d} {day}
  final String normalRest; // {streak}

  final String tips; // 웰컴 박스 Tips · {day}
  final String onboard; // 첫 실행 이름 입력 안내

  final String emptySprint;
  final String emptyBacklog;
  final String emptyChangelog; // {day} {ver}
  final String emptyMemo;

  final String shipNotReady; // 배포일 아닌 날 ship 클릭 · {day}
  final String shipDone; // {ver}
  final String shipGrad; // {names} {ver}
  final String shipDialogSub; // 배포 모달 부제

  const Persona({
    required this.id,
    required this.name,
    required this.tagline,
    required this.riskHead,
    required this.riskRest,
    required this.warnHead,
    required this.warnRest,
    required this.todayHead,
    required this.todayRest,
    required this.normalHead,
    required this.normalRest,
    required this.tips,
    required this.onboard,
    required this.emptySprint,
    required this.emptyBacklog,
    required this.emptyChangelog,
    required this.emptyMemo,
    required this.shipNotReady,
    required this.shipDone,
    required this.shipGrad,
    required this.shipDialogSub,
  });
}

const kPersonas = [
  // 기본 — 시니컬 직설 (원조 톤)
  Persona(
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
    emptySprint: '아직 커밋 없음\n오늘 할 거 하나 추가ㄱㄱ',
    emptyBacklog: '백로그 비어있음\n다음 버전 아이디어 미리 던져놓기',
    emptyChangelog: '아직 배포 이력 없음\n첫 {day}요일에 {ver} 찍어보자',
    emptyMemo: '포스트잇 없음\n+ memo 로 바탕화면에 하나 붙여보셈',
    shipNotReady: '배포는 {day}요일에 🚀 (지금은 커밋 쌓는 날)',
    shipDone: '🚀 {ver} 배포 완료!',
    shipGrad: '🎉 {names} 졸업 · {ver} 배포!',
    shipDialogSub: '완료한 건 릴리즈노트로 박제 · 못한 건 다음 스프린트로 롤백',
  ),
  // 따뜻한 응원
  Persona(
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
    emptySprint: '아직 할 일이 없어요\n오늘 하고 싶은 것 하나를 적어보세요',
    emptyBacklog: '백로그가 비어 있어요\n다음에 하고 싶은 일을 미리 담아두세요',
    emptyChangelog: '아직 배포 기록이 없어요\n첫 {day}요일에 {ver}을 함께 찍어봐요',
    emptyMemo: '포스트잇이 없어요\n+ memo 로 바탕화면에 붙여보세요',
    shipNotReady: '배포는 {day}요일에 해요 🚀 오늘은 쌓는 날!',
    shipDone: '🚀 {ver} 배포 완료! 수고했어요',
    shipGrad: '🎉 {names} 졸업! {ver} 배포 완료, 축하해요',
    shipDialogSub: '완료한 일은 릴리즈노트에 남고, 못한 일은 다음 주로 넘어가요',
  ),
  // 차분 정중
  Persona(
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
    emptySprint: '등록된 작업이 없습니다\n오늘 할 작업을 하나 추가해 보세요',
    emptyBacklog: '백로그가 비어 있습니다\n다음 버전에 할 작업을 미리 등록해 두세요',
    emptyChangelog: '배포 이력이 없습니다\n첫 {day}요일에 {ver}을 기록해 보세요',
    emptyMemo: '포스트잇이 없습니다\n+ memo 로 바탕화면에 추가할 수 있습니다',
    shipNotReady: '배포는 {day}요일에 진행됩니다 🚀',
    shipDone: '🚀 {ver} 배포가 완료되었습니다',
    shipGrad: '🎉 {names} 졸업 · {ver} 배포가 완료되었습니다',
    shipDialogSub: '완료 항목은 릴리즈노트에 기록되고, 미완료 항목은 다음 스프린트로 이월됩니다',
  ),
];

/// 현재 상태의 페르소나 — 못 찾으면 기본(Victor).
Persona personaOf(AppState s) {
  for (final p in kPersonas) {
    if (p.id == s.persona) return p;
  }
  return kPersonas.first;
}
