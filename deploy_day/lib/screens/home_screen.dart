import 'dart:async';

import 'package:confetti/confetti.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../app_state.dart';
import '../desktop_shell.dart';
import '../models.dart';
import '../theme.dart';
import '../widgets/backlog_tab.dart';
import '../widgets/changelog_tab.dart';
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
              child: Column(children: [
                Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: _topbar()),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 80),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _header(s),
                        _alertBar(s),
                        const SizedBox(height: 26),
                        _tabs(s),
                        const SizedBox(height: 16),
                        switch (tab) {
                          0 => SprintTab(confetti: _confetti),
                          1 => const BacklogTab(),
                          _ => const ChangelogTab(),
                        },
                        _tools(),
                      ],
                    ),
                  ),
                ),
              ]),
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

  /// ✻ 웰컴 박스 — Claude Code 시작 배너 대응.
  Widget _topbar() => Padding(
        padding: const EdgeInsets.only(top: 14),
        child: CliBox(
          borderColor: C.border,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text.rich(TextSpan(children: [
                TextSpan(
                    text: '✻ ',
                    style: mono(
                        size: 14, color: C.accent, weight: FontWeight.w700)),
                TextSpan(
                    text: 'Welcome to deploy-day!',
                    style: mono(
                        size: 14, color: C.txt, weight: FontWeight.w700)),
              ])),
              const SizedBox(height: 8),
              Row(children: [
                Text('  cwd: ~/life', style: mono(color: C.dimmer)),
                const SizedBox(width: 14),
                Text('\$ deploy --every thursday', style: mono()),
                const Spacer(),
                Text('● LIVE', style: mono(color: C.ship, spacing: .5)),
                if (isDesktopShell) ...[
                  const SizedBox(width: 12),
                  // 항상 위 고정 토글
                  ValueListenableBuilder<bool>(
                    valueListenable: pinned,
                    builder: (_, on, _) => GestureDetector(
                      onTap: togglePin,
                      child: MouseRegion(
                        cursor: SystemMouseCursors.click,
                        child: Text('[pin${on ? ' ●' : ''}]',
                            style: mono(color: on ? C.accent : C.dimmer)),
                      ),
                    ),
                  ),
                ],
              ]),
            ]),
          ),
        ),
      );

  /// 하단 고정 status line — "⏵⏵ accept edits on" 패러디.
  Widget _statusLine(AppState s) => Positioned(
        left: 0,
        right: 0,
        bottom: 0,
        child: Container(
          color: C.bg,
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 10),
          child: SafeArea(
            top: false,
            child: Row(children: [
              Text('⏵⏵ deploy mode on',
                  style: mono(size: 11, color: C.accent2)),
              Text(' (every thursday)',
                  style: mono(size: 11, color: C.dimmer)),
              const Spacer(),
              Text(
                  isThursday()
                      ? 'v${s.major}.${s.minor} · 🚀 today'
                      : 'v${s.major}.${s.minor} · D-${daysToThu()}',
                  style: mono(size: 11, color: C.dimmer)),
            ]),
          ),
        ),
      );

  Widget _header(AppState s) {
    final today = isThursday();
    final dd = daysToThu();
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 34, 4, 22),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // v1.0 큰 버전 — 플랫 Claude 오렌지
        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('v${s.major}',
              style: mono(
                  size: 64,
                  color: C.accent,
                  weight: FontWeight.w800,
                  spacing: -2,
                  height: 0.95)),
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Text('.${s.minor}',
                style: mono(
                    size: 32, color: C.dimmer, weight: FontWeight.w500)),
          ),
        ]),
        const SizedBox(height: 14),
        Row(children: [
          // D-day 뱃지
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
            decoration: today
                ? BoxDecoration(
                    color: C.accent,
                    borderRadius: BorderRadius.circular(5),
                  )
                : BoxDecoration(
                    color: C.panel,
                    border: Border.all(color: C.border),
                    borderRadius: BorderRadius.circular(5),
                  ),
            child: Text(today ? '⏵⏵ 오늘이 배포일' : 'D-$dd · 목요일',
                style: mono(
                    size: 13,
                    weight: FontWeight.w700,
                    color: today ? C.bg : C.dim)),
          ),
          const SizedBox(width: 14),
          Text.rich(TextSpan(style: mono(), children: [
            const TextSpan(text: '🔥 streak '),
            TextSpan(
                text: '${s.streak}',
                style: mono(color: C.ship, weight: FontWeight.w700)),
            const TextSpan(text: '주'),
          ])),
        ]),
      ]),
    );
  }

  Widget _alertBar(AppState s) {
    final today = isThursday();
    final dd = daysToThu();
    final doneN = s.todos.where((t) => t.done).length;
    String? msg;
    Color? color;
    if (today && s.streak > 0 && doneN == 0) {
      msg = '⚠️ 오늘 배포 안 하면 streak ${s.streak}주 → 0. 하나라도 ship ㄱㄱ';
      color = C.rollback;
    } else if (dd == 1 && doneN == 0 && s.todos.isNotEmpty) {
      msg = '⏳ 내일 배포일인데 완료 0건. 오늘 하나는 끝내자';
      color = C.warn;
    }
    if (msg == null) return const SizedBox.shrink();
    return Container(
      margin: const EdgeInsets.only(top: 16),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: color!.withValues(alpha: .09),
        border: Border.all(color: color.withValues(alpha: .4)),
        borderRadius: BorderRadius.circular(5),
      ),
      child: Text(msg, style: mono(size: 13, color: color, height: 1.4)),
    );
  }

  /// 탭 — 슬래시 커맨드 스타일 (/sprint /backlog /changelog).
  Widget _tabs(AppState s) {
    final items = [
      ('/sprint', s.todos.length),
      ('/backlog', s.backlog.length),
      ('/changelog', s.releases.length),
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
