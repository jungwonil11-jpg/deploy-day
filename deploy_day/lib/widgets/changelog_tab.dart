import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../app_state.dart';
import '../models.dart';
import '../persona.dart';
import '../theme.dart';

class ChangelogTab extends ConsumerWidget {
  const ChangelogTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(appProvider);
    final grads = s.projects.where((p) => p.done).toList();
    final releases = s.releases.reversed.toList();
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      if (grads.isNotEmpty) ...[
        _hall(context, ref, s, grads),
        const SizedBox(height: 14),
      ],
      CliBox(
        title: 'changelog · 내 인생 릴리즈 히스토리',
        child: Column(children: [
          if (releases.isEmpty)
            emptyBox(pfmt(personaOf(s).emptyChangelog, {
              'day': kDayKr[s.shipDay],
              'ver': verStr(s.major, s.minor + 1),
            }))
          else
            for (var i = 0; i < releases.length; i++)
              _ReleaseTile(
                  key: ValueKey('${releases[i].ver}_${releases[i].date}'),
                  release: releases[i],
                  s: s,
                  first: i == 0,
                  initiallyOpen: i == 0),
        ]),
      ),
    ]);
  }

  /* ---------- 명예의 전당 ---------- */

  Release? _gradRelease(AppState s, String pid) {
    for (final r in s.releases) {
      if (r.graduated.contains(pid)) return r;
    }
    return null;
  }

  Widget _hall(
      BuildContext context, WidgetRef ref, AppState s, List<Project> grads) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: panelDeco(),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('🎓 SHIPPED PROJECTS · 명예의 전당',
            style: mono(size: 11, color: C.ship, spacing: .5)),
        const SizedBox(height: 12),
        Wrap(spacing: 10, runSpacing: 10, children: [
          for (final p in grads)
            GestureDetector(
              onTap: () async {
                final ok =
                    await confirmDialog(context, "'${p.name}' 다시 진행함?");
                if (!ok || !context.mounted) return;
                ref.read(appProvider.notifier).reviveProject(p.id);
                toast(context, '프로젝트 부활 ↻');
              },
              child: MouseRegion(
                cursor: SystemMouseCursors.click,
                child: Container(
                  constraints: const BoxConstraints(minWidth: 150),
                  padding: const EdgeInsets.symmetric(
                      horizontal: 13, vertical: 12),
                  decoration: BoxDecoration(
                    color: C.bg,
                    border: Border.all(color: C.border),
                    borderRadius: BorderRadius.circular(5),
                  ),
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Row(mainAxisSize: MainAxisSize.min, children: [
                          PDot(hexColor(p.color)),
                          const SizedBox(width: 7),
                          Text(p.name,
                              style: kr(size: 14, weight: FontWeight.w500)),
                        ]),
                        const SizedBox(height: 7),
                        Builder(builder: (_) {
                          final gi = _gradRelease(s, p.id);
                          return Text(
                              '🎓 ${gi != null ? '${gi.ver} · ${gi.date}' : '졸업'}',
                              style: mono(size: 11));
                        }),
                        const SizedBox(height: 9),
                        Text('↻ 다시 진행',
                            style: mono(size: 11, color: C.ship)),
                      ]),
                ),
              ),
            ),
        ]),
      ]),
    );
  }
}

/* ---------- 릴리즈 한 건 (접기/펼치기) ---------- */

class _ReleaseTile extends StatefulWidget {
  final Release release;
  final AppState s;
  final bool first;
  final bool initiallyOpen;
  const _ReleaseTile(
      {required this.release,
      required this.s,
      required this.first,
      required this.initiallyOpen,
      super.key});

  @override
  State<_ReleaseTile> createState() => _ReleaseTileState();
}

class _ReleaseTileState extends State<_ReleaseTile> {
  late bool open = widget.initiallyOpen;

  @override
  Widget build(BuildContext context) {
    final r = widget.release;
    final shipped = r.notes.where((n) => n.done).length;
    final missed = r.notes.length - shipped;
    return Container(
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
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child:
                  Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                // ⏺ 불릿 — 전부 shipped면 초록, 롤백 있으면 노랑
                Text('⏺',
                    style: mono(
                        size: 13, color: missed == 0 ? C.ship : C.warn)),
                const SizedBox(width: 11),
                Expanded(
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Wrap(
                            spacing: 9,
                            crossAxisAlignment: WrapCrossAlignment.center,
                            children: [
                              Text(r.ver,
                                  style: mono(
                                      size: 16,
                                      color: C.accent,
                                      weight: FontWeight.w800)),
                              if (r.title.isNotEmpty)
                                Text(r.title,
                                    style: kr(
                                        size: 14, weight: FontWeight.w500)),
                            ]),
                        const SizedBox(height: 3),
                        Text(r.date, style: mono(size: 11)),
                      ]),
                ),
                Padding(
                  padding: const EdgeInsets.only(top: 3),
                  child: Text.rich(TextSpan(
                      style: mono(size: 11, color: C.dimmer),
                      children: [
                        TextSpan(
                            text: '$shipped',
                            style: mono(
                                size: 11,
                                color: C.ship,
                                weight: FontWeight.w700)),
                        const TextSpan(text: ' shipped'),
                        if (missed > 0)
                          TextSpan(text: ' · $missed rolled'),
                      ])),
                ),
              ]),
            ),
          ),
        ),
        if (open)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 2, 16, 14),
            child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: _body(r)),
          ),
      ]),
    );
  }

  List<Widget> _body(Release r) {
    final out = <Widget>[];
    // 릴리즈 기록 시점의 프로젝트 기준으로 그룹핑 (현재 projOrder + 미분류)
    for (final pid in widget.s.projOrder()) {
      final ns = r.notes.where((n) => n.project == pid).toList();
      if (ns.isEmpty) continue;
      final isGrad = pid != null && r.graduated.contains(pid);
      out.add(Padding(
        padding: const EdgeInsets.only(top: 10, bottom: 4),
        child: Row(children: [
          if (isGrad) ...[
            const Text('🎉 ', style: TextStyle(fontSize: 11)),
          ],
          PDot(projectColor(widget.s, pid)),
          const SizedBox(width: 7),
          Text(widget.s.pName(pid),
              style: mono(
                  size: 11,
                  color: isGrad ? C.ship : C.dim,
                  weight: isGrad ? FontWeight.w700 : FontWeight.w400)),
          if (isGrad) ...[
            const SizedBox(width: 7),
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
              decoration: BoxDecoration(
                color: C.ship.withValues(alpha: .15),
                border: Border.all(color: C.ship.withValues(alpha: .4)),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text('SHIPPED',
                  style: mono(size: 9, color: C.ship, spacing: .5)),
            ),
          ],
        ]),
      ));
      for (final n in ns) {
        out.add(Padding(
          padding: const EdgeInsets.fromLTRB(4, 4, 0, 4),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(n.done ? '+' : '−',
                style: mono(
                    size: 13, color: n.done ? C.ship : C.rollback)),
            const SizedBox(width: 9),
            Expanded(
                child: Text(n.text,
                    style: kr(
                        size: 14,
                        color: n.done ? C.txt : C.dim,
                        height: 1.35))),
          ]),
        ));
      }
    }
    if (out.isEmpty) {
      out.add(Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Text('빈 배포', style: mono(size: 13, color: C.dimmer)),
      ));
    }
    return out;
  }
}
