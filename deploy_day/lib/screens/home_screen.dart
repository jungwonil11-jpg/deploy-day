import 'dart:async';

import 'package:confetti/confetti.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../app_state.dart';
import '../desktop_shell.dart';
import '../memo/memo_store.dart';
import '../models.dart';
import '../theme.dart';
import '../widgets/backlog_tab.dart';
import '../widgets/changelog_tab.dart';
import '../widgets/memo_tab.dart';
import '../widgets/sprint_tab.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  int tab = 0;
  late final ConfettiController _confetti =
      ConfettiController(duration: const Duration(milliseconds: 1700));
  Timer? _midnight;

  @override
  void initState() {
    super.initState();
    _scheduleMidnight();
  }

  /// 자정 넘어가면 D-day 표시 갱신 (HTML은 새로고침해야 갱신됐음).
  void _scheduleMidnight() {
    final now = DateTime.now();
    final next = DateTime(now.year, now.month, now.day + 1);
    _midnight = Timer(next.difference(now) + const Duration(seconds: 1), () {
      if (mounted) setState(() {});
      _scheduleMidnight();
    });
  }

  @override
  void dispose() {
    _confetti.dispose();
    _midnight?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(appProvider);
    return Scaffold(
      body: Stack(children: [
        SafeArea(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 760),
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 96),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _topbar(s),
                    _announce(s),
                    const SizedBox(height: 28),
                    _tabs(s),
                    const SizedBox(height: 16),
                    switch (tab) {
                      0 => SprintTab(confetti: _confetti),
                      1 => const BacklogTab(),
                      2 => const ChangelogTab(),
                      _ => const MemoTab(),
                    },
                    _tools(),
                  ],
                ),
              ),
            ),
          ),
        ),
        // 배포 컨페티 — Claude 오렌지 팔레트
        Align(
          alignment: const Alignment(0, -0.3),
          child: ConfettiWidget(
            confettiController: _confetti,
            blastDirectionality: BlastDirectionality.explosive,
            numberOfParticles: 35,
            maxBlastForce: 28,
            minBlastForce: 8,
            emissionFrequency: 0.02,
            gravity: 0.25,
            colors: const [
              C.accent,
              C.accent2,
              C.ship,
              C.warn,
              Color(0xFFECEAE5),
              Color(0xFFE8A287),
            ],
          ),
        ),
        _statusLine(s),
      ]),
    );
  }

  /// Claude Code 시작 배너 — 오렌지 박스 좌(웰컴+픽셀 로고)/우(Tips·What's new) 2단.
  Widget _topbar(AppState s) {
    final recent = s.releases.reversed.take(3).toList();
    return Padding(
      padding: const EdgeInsets.only(top: 22),
      child: CliBox(
        title: 'deploy-day v${s.major}.${s.minor}',
        borderColor: C.accent,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(18, 16, 18, 16),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            // 좌측 — 환영 인사 + 픽셀 Clawd
            Expanded(
              flex: 5,
              child: Column(children: [
                const SizedBox(height: 4),
                Text('Welcome back Victor!',
                    style:
                        mono(size: 14, color: C.txt, weight: FontWeight.w700)),
                const SizedBox(height: 16),
                Text(' ▐▛███▜▌\n▝▜█████▛▘\n  ▘▘ ▝▝',
                    textAlign: TextAlign.center,
                    style: mono(size: 15, color: C.accent, height: 1.05)),
                const SizedBox(height: 16),
                Text('인생 배포 (1주 cycle) · 매주 목요일',
                    style: mono(size: 12, color: C.dim)),
                const SizedBox(height: 4),
                Text.rich(TextSpan(style: mono(size: 12), children: [
                  TextSpan(text: 'streak ${s.streak}주'),
                  const TextSpan(text: ' · '),
                  TextSpan(text: '● LIVE', style: mono(size: 12, color: C.ship)),
                ])),
                const SizedBox(height: 4),
                Text('cwd: ~/life', style: mono(size: 12, color: C.dimmer)),
              ]),
            ),
            const SizedBox(width: 20),
            // 우측 — Tips / What's new (최근 릴리즈가 곧 뉴스)
            Expanded(
              flex: 6,
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Tips for getting started',
                        style: mono(
                            size: 13,
                            color: C.accent,
                            weight: FontWeight.w700)),
                    const SizedBox(height: 6),
                    Text('/sprint 에 커밋 쌓고 목요일에 ship 하면 됨',
                        style: kr(size: 13, height: 1.5)),
                    const SizedBox(height: 12),
                    Container(height: 1, color: C.accent),
                    const SizedBox(height: 12),
                    Text("What's new",
                        style: mono(
                            size: 13,
                            color: C.accent,
                            weight: FontWeight.w700)),
                    const SizedBox(height: 6),
                    if (recent.isEmpty)
                      Text('아직 릴리즈 없음 — 첫 배포가 첫 뉴스임',
                          style: kr(size: 13, color: C.dim, height: 1.5))
                    else
                      for (final r in recent)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 2),
                          child: Text(
                              '${r.ver}${r.title.isNotEmpty ? ' ${r.title}' : ''} · ${r.date}',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: kr(size: 13, height: 1.5)),
                        ),
                    const SizedBox(height: 4),
                    Text('/changelog for more',
                        style: mono(size: 12, color: C.dim, italic: true)),
                  ]),
            ),
          ]),
        ),
      ),
    );
  }

  /// ▌ 어나운스 라인 — "Opus 4.8 is here!" 자리. D-day·경고가 여기 뜸.
  Widget _announce(AppState s) {
    final today = isThursday();
    final dd = daysToThu();
    final doneN = s.todos.where((t) => t.done).length;
    Color color = C.accent;
    String head;
    String rest;
    if (today && s.streak > 0 && doneN == 0) {
      color = C.rollback;
      head = '오늘 배포 안 하면 streak ${s.streak}주 → 0.';
      rest = ' 하나라도 ship ㄱㄱ';
    } else if (dd == 1 && doneN == 0 && s.todos.isNotEmpty) {
      color = C.warn;
      head = '내일이 배포일!';
      rest = ' 완료 0건 — 오늘 하나는 끝내자';
    } else if (today) {
      head = '오늘이 배포일!';
      rest = ' ⏵⏵ ship 으로 ${verStr(s.major, s.minor + 1)} 릴리즈 ㄱㄱ';
    } else {
      head = 'D-$dd · 목요일 배포!';
      rest = ' 커밋 쌓는 중 · streak ${s.streak}주';
    }
    return Container(
      margin: const EdgeInsets.only(top: 26),
      padding: const EdgeInsets.only(left: 10),
      decoration: BoxDecoration(
          border: Border(left: BorderSide(color: color, width: 3))),
      child: Text.rich(TextSpan(children: [
        TextSpan(
            text: head,
            style: mono(size: 13, color: color, weight: FontWeight.w700)),
        TextSpan(text: rest, style: mono(size: 13, color: C.dim)),
      ])),
    );
  }

  /// 하단 고정 status line — 모델명 블루 + ⏵⏵ 핑크 2줄, Claude Code 그대로.
  Widget _statusLine(AppState s) => Positioned(
        left: 0,
        right: 0,
        bottom: 0,
        child: Container(
          color: C.bg,
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 10),
          child: SafeArea(
            top: false,
            child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(children: [
                    Text('deploy-day v${s.major}.${s.minor} (1주 cycle)',
                        style: mono(
                            size: 12, color: C.blue, weight: FontWeight.w700)),
                    Text(' · streak ${s.streak}주 · ',
                        style: mono(size: 12, color: C.dimmer)),
                    Text('main',
                        style: mono(
                            size: 12,
                            color: C.magenta,
                            weight: FontWeight.w700)),
                    const Spacer(),
                    if (isDesktopShell)
                      // 항상 위 고정 토글
                      ValueListenableBuilder<bool>(
                        valueListenable: pinned,
                        builder: (_, on, _) => GestureDetector(
                          onTap: togglePin,
                          child: MouseRegion(
                            cursor: SystemMouseCursors.click,
                            child: Text('[pin${on ? ' ●' : ''}]',
                                style: mono(
                                    size: 12,
                                    color: on ? C.accent : C.dimmer)),
                          ),
                        ),
                      ),
                  ]),
                  const SizedBox(height: 3),
                  Row(children: [
                    Text('⏵⏵ deploy mode on',
                        style: mono(
                            size: 12, color: C.pink, weight: FontWeight.w700)),
                    Text(' (every thursday)',
                        style: mono(size: 12, color: C.pink)),
                    Text(
                        isThursday()
                            ? ' · 🚀 today'
                            : ' · D-${daysToThu()} for ship',
                        style: mono(size: 12, color: C.dimmer)),
                  ]),
                ]),
          ),
        ),
      );

  /// 탭 — 슬래시 커맨드 스타일 (/sprint /backlog /changelog /memo).
  Widget _tabs(AppState s) {
    final items = [
      ('/sprint', s.todos.length),
      ('/backlog', s.backlog.length),
      ('/changelog', s.releases.length),
      // 포스트잇은 데스크탑 전용
      if (isDesktopShell) ('/memo', ref.watch(memoProvider).length),
    ];
    return Row(
      children: [
        for (var i = 0; i < items.length; i++) ...[
          if (i > 0) const SizedBox(width: 4),
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => tab = i),
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 11),
                decoration: BoxDecoration(
                  color: tab == i ? C.panel2 : Colors.transparent,
                  border: Border.all(
                      color: tab == i ? C.accent : Colors.transparent),
                  borderRadius: BorderRadius.circular(5),
                ),
                child: Center(
                  child: Text.rich(TextSpan(children: [
                    TextSpan(
                        text: items[i].$1,
                        style: mono(
                            size: 13,
                            weight: FontWeight.w500,
                            color: tab == i ? C.accent : C.dim)),
                    TextSpan(
                        text: ' ${items[i].$2}',
                        style: mono(
                            size: 13,
                            color: tab == i ? C.txt : C.dimmer)),
                  ])),
                ),
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _tools() => Padding(
        padding: const EdgeInsets.only(top: 26),
        child: Wrap(
          alignment: WrapAlignment.center,
          spacing: 8,
          runSpacing: 8,
          children: [
            _toolBtn('⬇ export json', _export),
            _toolBtn('⬆ import', _import),
            _toolBtn('reset', _reset),
          ],
        ),
      );

  Widget _toolBtn(String label, VoidCallback onTap) => GestureDetector(
        onTap: onTap,
        child: MouseRegion(
          cursor: SystemMouseCursors.click,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
                border: Border.all(color: C.line),
                borderRadius: BorderRadius.circular(5)),
            child: Text(label, style: mono(size: 11, color: C.dimmer)),
          ),
        ),
      );

  void _export() {
    final json = ref.read(appProvider.notifier).exportJson();
    Clipboard.setData(ClipboardData(text: json));
    toast(context, '백업 JSON 클립보드에 복사됨 — 메모장 등에 붙여넣어 보관');
  }

  Future<void> _import() async {
    final data = await Clipboard.getData(Clipboard.kTextPlain);
    if (!mounted) return;
    final raw = data?.text?.trim();
    if (raw == null || raw.isEmpty) {
      toast(context, '클립보드 비어있음 — 백업 JSON 복사 후 다시');
      return;
    }
    try {
      ref.read(appProvider.notifier).importJson(raw);
      toast(context, '복원 완료');
    } catch (_) {
      toast(context, 'JSON 파싱 실패 — 백업 JSON 맞는지 확인');
    }
  }

  Future<void> _reset() async {
    final ok = await confirmDialog(context, '전부 초기화함? 되돌릴 수 없음.', ok: '초기화');
    if (!ok || !mounted) return;
    ref.read(appProvider.notifier).reset();
    toast(context, '초기화 완료');
  }
}
