import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app_state.dart';
import 'models.dart';
import 'persona.dart';
import 'theme.dart';

/* ---------- 스포트라이트 타겟 키 — 해당 위젯에 KeyedSubtree로 부착 ---------- */

final tutKeyAddProject = GlobalKey(); // [+ 프로젝트] 칩
final tutKeyAddRow = GlobalKey(); // ❯ 커밋 입력줄
final tutKeyFirstTodo = GlobalKey(); // 첫 번째 투두 행
final tutKeyShip = GlobalKey(); // ship 바
final tutKeyTabs = GlobalKey(); // 탭 행

/* ---------- 단계 정의 ---------- */

/// 한 단계 — clearWhen이 있으면 "직접 해보기"(상태 변화로 자동 진행),
/// 없으면 설명만 하고 [다음] 버튼으로 진행.
class TutStep {
  final GlobalKey? target;
  final bool Function(AppState prev, AppState next)? clearWhen;
  const TutStep({this.target, this.clearWhen});
}

int _doneN(AppState s) => s.todos.where((t) => t.done).length;

final kTutSteps = [
  TutStep(
      target: tutKeyAddProject,
      clearWhen: (a, b) => b.projects.length > a.projects.length),
  TutStep(
      target: tutKeyAddRow,
      clearWhen: (a, b) => b.todos.length > a.todos.length),
  TutStep(
      target: tutKeyFirstTodo, clearWhen: (a, b) => _doneN(b) > _doneN(a)),
  TutStep(target: tutKeyShip),
  TutStep(target: tutKeyTabs),
  const TutStep(), // 마무리 — 타겟 없이 중앙 풍선
];

/* ---------- 진행 상태 ---------- */

/// null = 꺼짐, 0~5 = 진행 중인 단계.
final tutorialProvider =
    NotifierProvider<TutorialNotifier, int?>(TutorialNotifier.new);

class TutorialNotifier extends Notifier<int?> {
  @override
  int? build() => null;

  void start() {
    ref.read(tabProvider.notifier).set(0); // 튜토리얼은 /sprint 에서 시작
    state = 0;
  }

  void next() {
    final s = state;
    if (s == null) return;
    state = (s + 1 >= kTutSteps.length) ? null : s + 1;
  }

  void stop() => state = null;
}

/* ---------- 오버레이 ---------- */

/// 코치마크 오버레이 — HomeScreen Stack 맨 위에 깔림.
/// 타겟에만 구멍을 뚫고 나머지 터치는 전부 흡수. 진행은 상태 변화 감지로.
class TutorialOverlay extends ConsumerStatefulWidget {
  const TutorialOverlay({super.key});

  @override
  ConsumerState<TutorialOverlay> createState() => _TutorialOverlayState();
}

class _TutorialOverlayState extends ConsumerState<TutorialOverlay> {
  Rect? _hole;
  int? _measuredStep;

  /// 단계 바뀌면: 타겟이 보이게 스크롤 → 자리 잡힌 뒤 rect 측정.
  Future<void> _measure(int step) async {
    _measuredStep = step;
    final key = kTutSteps[step].target;
    if (key == null) {
      if (mounted) setState(() => _hole = null);
      return;
    }
    final ctx = key.currentContext;
    if (ctx == null) {
      // 타겟이 아직 안 그려짐 (탭 전환 직후 등) — 다음 프레임에 재시도
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted && ref.read(tutorialProvider) == step) _measure(step);
      });
      return;
    }
    await Scrollable.ensureVisible(ctx,
        alignment: .35, duration: const Duration(milliseconds: 250));
    await Future<void>.delayed(const Duration(milliseconds: 80));
    if (!mounted || ref.read(tutorialProvider) != step) return;
    if (!ctx.mounted) return;
    final box = ctx.findRenderObject() as RenderBox?;
    if (box == null || !box.attached) return;
    setState(() =>
        _hole = box.localToGlobal(Offset.zero) & box.size);
  }

  @override
  Widget build(BuildContext context) {
    // 미션 클리어 감지 — 잠깐 여운 주고 다음 단계로
    ref.listen(appProvider, (prev, next) {
      final i = ref.read(tutorialProvider);
      if (i == null || prev == null) return;
      final c = kTutSteps[i].clearWhen;
      if (c != null && c(prev, next)) {
        Future.delayed(const Duration(milliseconds: 700), () {
          if (mounted && ref.read(tutorialProvider) == i) {
            ref.read(tutorialProvider.notifier).next();
          }
        });
      }
    });

    final step = ref.watch(tutorialProvider);
    if (step == null) {
      _measuredStep = null;
      return const SizedBox.shrink();
    }
    if (_measuredStep != step) {
      _hole = null; // 이전 구멍 제거 후 재측정
      WidgetsBinding.instance.addPostFrameCallback((_) => _measure(step));
    }

    final size = MediaQuery.sizeOf(context);
    final s = ref.watch(appProvider);
    final p = personaOf(s);
    final manual = kTutSteps[step].clearWhen == null;
    final hole = _hole?.inflate(6);

    return Stack(children: [
      // 구멍 사방의 가림막 4장 — 구멍 영역만 터치가 앱으로 통과됨
      ..._scrims(size, hole).map((r) => Positioned.fromRect(
            rect: r,
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: () {}, // 흡수
              child: Container(color: Colors.black.withValues(alpha: .72)),
            ),
          )),
      // 타겟 하이라이트 테두리
      if (hole != null)
        Positioned.fromRect(
          rect: hole,
          child: IgnorePointer(
            child: Container(
              decoration: BoxDecoration(
                border: Border.all(color: C.accent, width: 2),
                borderRadius: BorderRadius.circular(6),
              ),
            ),
          ),
        ),
      // 말풍선 — 타겟이 화면 위쪽이면 아래에, 아래쪽이면 위에
      _bubble(size, hole, step, p, manual),
    ]);
  }

  List<Rect> _scrims(Size size, Rect? hole) {
    final full = Offset.zero & size;
    if (hole == null) return [full];
    return [
      Rect.fromLTRB(0, 0, size.width, hole.top),
      Rect.fromLTRB(0, hole.bottom, size.width, size.height),
      Rect.fromLTRB(0, hole.top, hole.left, hole.bottom),
      Rect.fromLTRB(hole.right, hole.top, size.width, hole.bottom),
    ];
  }

  Widget _bubble(Size size, Rect? hole, int step, Persona p, bool manual) {
    final below = hole == null || hole.center.dy < size.height / 2;
    final width = (size.width - 48).clamp(200.0, 460.0);
    final n = ref.read(tutorialProvider.notifier);

    final box = Container(
      width: width,
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
      decoration: BoxDecoration(
        color: C.panel,
        border: Border.all(color: C.accent),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('tutorial · ${step + 1}/${kTutSteps.length}',
                style: mono(size: 11, color: C.accent)),
            const SizedBox(height: 8),
            Text(p.tutorial[step], style: kr(size: 14, height: 1.6)),
            const SizedBox(height: 10),
            Row(children: [
              GestureDetector(
                onTap: n.stop,
                child: MouseRegion(
                  cursor: SystemMouseCursors.click,
                  child: Text('건너뛰기 ✕', style: mono(size: 12, color: C.dimmer)),
                ),
              ),
              const Spacer(),
              if (manual)
                GestureDetector(
                  onTap: n.next,
                  child: MouseRegion(
                    cursor: SystemMouseCursors.click,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                          color: C.accent,
                          borderRadius: BorderRadius.circular(5)),
                      child: Text(
                          step + 1 >= kTutSteps.length ? '⏵⏵ 시작' : '다음 →',
                          style: mono(
                              size: 12,
                              color: C.bg,
                              weight: FontWeight.w700)),
                    ),
                  ),
                )
              else
                Text('↑ 직접 해보면 넘어감',
                    style: mono(size: 11, color: C.dim, italic: true)),
            ]),
          ]),
    );

    if (hole == null) {
      return Center(child: box);
    }
    // 타겟 아래 또는 위에 12px 띄워서
    return Positioned(
      left: (size.width - width) / 2,
      top: below ? hole.bottom + 12 : null,
      bottom: below ? null : (size.height - hole.top) + 12,
      child: box,
    );
  }
}
