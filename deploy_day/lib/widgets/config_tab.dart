import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../app_state.dart';
import '../legal.dart';
import '../memo/memo_store.dart';
import '../models.dart';
import '../persona.dart';
import '../theme.dart';

/// /config 탭 — 페르소나·앱 소개·정책 문서.
class ConfigTab extends ConsumerWidget {
  const ConfigTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(appProvider);
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      // ----- 테마 -----
      CliBox(
        title: 'theme · 다크/라이트',
        child: Row(children: [
          _themeBtn(context, ref, s, dark: true, label: 'dark', first: true),
          Container(width: 1, height: 44, color: C.line),
          _themeBtn(context, ref, s, dark: false, label: 'light', first: false),
        ]),
      ),
      const SizedBox(height: 16),
      // ----- 페르소나 -----
      CliBox(
        title: 'persona · 앱 말투 변경',
        child: Column(children: [
          for (var i = 0; i < kPersonas.length; i++)
            _personaRow(context, ref, s, kPersonas[i], first: i == 0),
        ]),
      ),
      const SizedBox(height: 16),
      // ----- 사용법 -----
      const CliBox(
        title: 'manual · 사용법',
        child: _LegalTile(title: '처음 왔으면 읽기 — 5분 사용법', body: kManual, first: true),
      ),
      const SizedBox(height: 16),
      // ----- 앱 소개 -----
      CliBox(
        title: 'about · 이 앱은 뭔가',
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Text(kAbout, style: kr(size: 13, height: 1.8)),
        ),
      ),
      const SizedBox(height: 16),
      // ----- 정책 -----
      CliBox(
        title: 'policy · 정책',
        child: Column(children: [
          const _LegalTile(title: '개인정보처리방침', body: kPrivacyPolicy, first: true),
          const _LegalTile(title: '이용약관', body: kTerms),
        ]),
      ),
      const SizedBox(height: 14),
      // ----- 푸터 -----
      Center(
        child: Text('deploy-day · 문의 jungwonil11@gmail.com',
            style: mono(size: 11, color: C.dimmer)),
      ),
    ]);
  }

  Widget _themeBtn(BuildContext context, WidgetRef ref, AppState s,
      {required bool dark, required String label, required bool first}) {
    final on = s.dark == dark;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          if (on) return;
          ref.read(appProvider.notifier).setDark(dark);
          // 떠 있는 포스트잇에도 즉시 반영
          ref.read(memoProvider.notifier).broadcastTheme(dark);
        },
        behavior: HitTestBehavior.opaque,
        child: MouseRegion(
          cursor: SystemMouseCursors.click,
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 13),
            alignment: Alignment.center,
            color: on ? C.panel2 : Colors.transparent,
            child: Text.rich(TextSpan(children: [
              TextSpan(
                  text: on ? '◉ ' : '○ ',
                  style: mono(size: 13, color: on ? C.accent : C.dimmer)),
              TextSpan(
                  text: label,
                  style: mono(
                      size: 13,
                      color: on ? C.txt : C.dim,
                      weight: on ? FontWeight.w700 : FontWeight.w400)),
            ])),
          ),
        ),
      ),
    );
  }

  Widget _personaRow(BuildContext context, WidgetRef ref, AppState s,
      Persona p,
      {required bool first}) {
    final on = personaOf(s).id == p.id;
    return GestureDetector(
      onTap: () {
        if (on) return;
        ref.read(appProvider.notifier).setPersona(p.id);
        toast(context, '페르소나 변경됨 — ${p.name}');
      },
      behavior: HitTestBehavior.opaque,
      child: MouseRegion(
        cursor: SystemMouseCursors.click,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
          decoration: first
              ? null
              : BoxDecoration(border: Border(top: BorderSide(color: C.line))),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Padding(
              padding: const EdgeInsets.only(top: 1),
              child: Text(on ? '◉' : '○',
                  style: mono(size: 13, color: on ? C.accent : C.dimmer)),
            ),
            const SizedBox(width: 11),
            Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      Text(p.name,
                          style: mono(
                              size: 14,
                              color: on ? C.txt : C.dim,
                              weight:
                                  on ? FontWeight.w700 : FontWeight.w400)),
                      if (p.id == 'victor') ...[
                        const SizedBox(width: 8),
                        Text('(기본)', style: mono(size: 11, color: C.accent)),
                      ],
                    ]),
                    const SizedBox(height: 3),
                    Text(p.tagline,
                        style: kr(size: 13, color: C.dim, height: 1.4)),
                    const SizedBox(height: 5),
                    // 말투 미리보기 — 어나운스 한 줄
                    Text('"${pfmt(p.normalHead, {'d': 3, 'day': '목'})}'
                        '${pfmt(p.normalRest, {'streak': 5})}"',
                        style: kr(size: 12, color: C.dimmer, height: 1.4)),
                  ]),
            ),
          ]),
        ),
      ),
    );
  }
}

/// 접었다 펴는 문서 타일 — changelog 릴리즈 타일과 같은 패턴.
class _LegalTile extends StatefulWidget {
  final String title;
  final String body;
  final bool first;
  const _LegalTile({required this.title, required this.body, this.first = false});

  @override
  State<_LegalTile> createState() => _LegalTileState();
}

class _LegalTileState extends State<_LegalTile> {
  bool open = false;

  @override
  Widget build(BuildContext context) => Container(
        decoration: widget.first
            ? null
            : BoxDecoration(border: Border(top: BorderSide(color: C.line))),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          GestureDetector(
            onTap: () => setState(() => open = !open),
            behavior: HitTestBehavior.opaque,
            child: MouseRegion(
              cursor: SystemMouseCursors.click,
              child: Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
                child: Row(children: [
                  Text(open ? '▾' : '▸', style: mono(size: 13, color: C.dim)),
                  const SizedBox(width: 10),
                  Text(widget.title,
                      style: kr(
                          size: 14,
                          color: open ? C.txt : C.dim,
                          weight: FontWeight.w500)),
                ]),
              ),
            ),
          ),
          if (open)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Text(widget.body,
                  style: kr(size: 13, color: C.dim, height: 1.8)),
            ),
        ]),
      );
}
