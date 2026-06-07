import 'package:confetti/confetti.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../app_state.dart';
import '../models.dart';
import '../theme.dart';
import 'ship_dialog.dart';

class SprintTab extends ConsumerStatefulWidget {
  final ConfettiController confetti;
  const SprintTab({required this.confetti, super.key});

  @override
  ConsumerState<SprintTab> createState() => _SprintTabState();
}

class _SprintTabState extends ConsumerState<SprintTab> {
  final _input = TextEditingController();
  final _focus = FocusNode();

  @override
  void dispose() {
    _input.dispose();
    _focus.dispose();
    super.dispose();
  }

  void _add() {
    ref.read(appProvider.notifier).addTodo(_input.text);
    _input.clear();
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(appProvider);
    final active = ref.watch(activeProjectProvider);
    final target = active == 'all' ? '미분류' : s.pName(active);
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      _chips(s, active),
      const SizedBox(height: 14),
      CliBox(
        title: 'sprint · 다음 배포까지 쌓을 커밋',
        child: Column(children: [
          addRow(
            controller: _input,
            focusNode: _focus,
            hint: '[$target] 할 거 입력 (Enter)',
            button: 'commit',
            onAdd: _add,
          ),
          ..._todoRows(s, active),
        ]),
      ),
      const SizedBox(height: 18),
      _shipBar(s),
    ]);
  }

  /* ---------- 프로젝트 칩 ---------- */

  Widget _chips(AppState s, String active) {
    Widget chip({
      required String label,
      Color? dot,
      required bool on,
      bool dashed = false,
      required VoidCallback onTap,
    }) =>
        GestureDetector(
          onTap: onTap,
          child: MouseRegion(
            cursor: SystemMouseCursors.click,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
              decoration: BoxDecoration(
                color: on ? C.panel2 : C.panel,
                border: Border.all(color: on ? C.accent : C.line),
                borderRadius: BorderRadius.circular(5),
              ),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                if (dot != null) ...[PDot(dot), const SizedBox(width: 7)],
                Text(label,
                    style: mono(
                        color: dashed
                            ? C.dimmer
                            : on
                                ? C.txt
                                : C.dim)),
              ]),
            ),
          ),
        );

    final setActive = ref.read(activeProjectProvider.notifier).set;
    return Wrap(spacing: 7, runSpacing: 7, children: [
      chip(
          label: '전체',
          on: active == 'all',
          onTap: () => setActive('all')),
      for (final p in s.projects.where((p) => !p.done))
        chip(
            label: p.name,
            dot: hexColor(p.color),
            on: active == p.id,
            onTap: () => setActive(p.id)),
      chip(label: '+ 프로젝트', on: false, dashed: true, onTap: _addProject),
    ]);
  }

  Future<void> _addProject() async {
    final ctl = TextEditingController();
    final name = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: C.panel,
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(6),
            side: const BorderSide(color: C.border)),
        title: Text('새 프로젝트',
            style: mono(size: 15, color: C.txt, weight: FontWeight.w700)),
        content: TextField(
          controller: ctl,
          autofocus: true,
          maxLength: 30,
          style: kr(size: 14),
          decoration: inputDeco('이름 (예: 성경썰앱)').copyWith(counterText: ''),
          onSubmitted: (v) => Navigator.pop(ctx, v),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: Text('취소', style: mono(size: 13, color: C.dim))),
          TextButton(
              onPressed: () => Navigator.pop(ctx, ctl.text),
              child: Text('추가',
                  style: mono(
                      size: 13, color: C.accent, weight: FontWeight.w700))),
        ],
      ),
    );
    if (name == null || name.trim().isEmpty || !mounted) return;
    ref.read(appProvider.notifier).addProject(name.trim());
    toast(context, '프로젝트 추가됨');
  }

  /* ---------- 투두 목록 ---------- */

  List<Widget> _todoRows(AppState s, String active) {
    if (s.todos.isEmpty) {
      return [emptyBox('아직 커밋 없음\n오늘 할 거 하나 추가ㄱㄱ')];
    }
    final rows = <Widget>[];
    if (active == 'all') {
      for (final pid in s.projOrder()) {
        final its = s.todos.where((t) => t.project == pid).toList();
        if (its.isEmpty) continue;
        final done = its.where((t) => t.done).length;
        rows.add(Padding(
          padding: const EdgeInsets.fromLTRB(16, 13, 16, 6),
          child: Row(children: [
            PDot(projectColor(s, pid)),
            const SizedBox(width: 8),
            Text(s.pName(pid), style: mono(size: 11, spacing: .3)),
            Text(' · $done/${its.length}',
                style: mono(size: 11, color: C.dimmer)),
          ]),
        ));
        rows.addAll(its.map((t) => _todoItem(s, t)));
      }
    } else {
      final its = s.todos.where((t) => t.project == active).toList();
      if (its.isEmpty) return [emptyBox('이 프로젝트엔 커밋 없음')];
      rows.addAll(its.map((t) => _todoItem(s, t)));
    }
    return rows;
  }

  Widget _todoItem(AppState s, Todo t) {
    final n = ref.read(appProvider.notifier);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration:
          const BoxDecoration(border: Border(top: BorderSide(color: C.line))),
      child: Row(children: [
        // 체크박스 — CLI 투두 글리프 ☐/☒
        GestureDetector(
          onTap: () => n.toggleTodo(t.id),
          behavior: HitTestBehavior.opaque,
          child: MouseRegion(
            cursor: SystemMouseCursors.click,
            child: SizedBox(
              width: 24,
              height: 24,
              child: Center(
                child: Text(t.done ? '☒' : '☐',
                    style: mono(
                        size: 17,
                        color: t.done ? C.ship : C.dimmer,
                        height: 1)),
              ),
            ),
          ),
        ),
        const SizedBox(width: 11),
        PDot(projectColor(s, t.project)),
        const SizedBox(width: 11),
        Expanded(
          child: Text(
            t.text,
            style: kr(
              size: 15,
              color: t.done ? C.dim : C.txt,
              height: 1.35,
            ).copyWith(
              decoration: t.done ? TextDecoration.lineThrough : null,
              decorationColor: C.dimmer,
            ),
          ),
        ),
        if (t.carried) ...[
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
            decoration: BoxDecoration(
                border: Border.all(color: C.warn.withValues(alpha: .3)),
                borderRadius: BorderRadius.circular(4)),
            child: Text('rollback', style: mono(size: 10, color: C.warn)),
          ),
        ],
        const SizedBox(width: 8),
        GestureDetector(
          onTap: () => n.deleteTodo(t.id),
          child: MouseRegion(
            cursor: SystemMouseCursors.click,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              child: Text('✕', style: mono(size: 13, color: C.dimmer)),
            ),
          ),
        ),
      ]),
    );
  }

  /* ---------- 배포 버튼 ---------- */

  /// 배포 바 — "⏵⏵ accept edits on" 스타일.
  Widget _shipBar(AppState s) {
    final ready = isShipDay(s.shipDay);
    final done = s.todos.where((t) => t.done).length;
    final label = ready
        ? '⏵⏵ ship ${verStr(s.major, s.minor + 1)} · $done건 완료'
        : '\$ ship — D-${daysToShip(s.shipDay)} · $done/${s.todos.length} 완료';
    return GestureDetector(
      onTap: () {
        if (!ready) {
          toast(context, '배포는 ${kDayKr[s.shipDay]}요일에 🚀 (지금은 커밋 쌓는 날)');
          return;
        }
        _openShip(s);
      },
      child: MouseRegion(
        cursor: SystemMouseCursors.click,
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(15),
          decoration: ready
              ? BoxDecoration(
                  color: C.accent,
                  borderRadius: BorderRadius.circular(5),
                )
              : BoxDecoration(
                  color: C.panel,
                  border: Border.all(color: C.border),
                  borderRadius: BorderRadius.circular(5),
                ),
          child: Center(
            child: Text(label,
                style: mono(
                    size: 15,
                    weight: FontWeight.w700,
                    color: ready ? C.bg : C.dim)),
          ),
        ),
      ),
    );
  }

  Future<void> _openShip(AppState s) async {
    final res = await showShipDialog(context, s);
    if (res == null || !mounted) return;
    final rel = ref
        .read(appProvider.notifier)
        .ship(title: res.title, graduated: res.graduated);
    widget.confetti.play();
    final names = res.graduated.map(s.pName).join(', ');
    toast(
        context,
        res.graduated.isNotEmpty
            ? '🎉 $names 졸업 · ${rel.ver} 배포!'
            : '🚀 ${rel.ver} 배포 완료!');
  }
}
