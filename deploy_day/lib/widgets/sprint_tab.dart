import 'package:confetti/confetti.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../app_state.dart';
import '../models.dart';
import '../persona.dart';
import '../theme.dart';
import '../tutorial.dart';
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
          KeyedSubtree(
            key: tutKeyAddRow,
            child: addRow(
              controller: _input,
              focusNode: _focus,
              hint: '[$target] 할 거 입력 (Enter)',
              button: 'commit',
              onAdd: _add,
            ),
          ),
          ..._todoRows(s, active),
        ]),
      ),
      const SizedBox(height: 18),
      KeyedSubtree(key: tutKeyShip, child: _shipBar(s)),
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
    final ps = s.projects.where((p) => !p.done).toList();
    return Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
      chip(label: '전체', on: active == 'all', onTap: () => setActive('all')),
      const SizedBox(width: 7),
      // 프로젝트 칩 — ≡ 핸들 드래그로 순서 변경 (가로 리스트)
      Expanded(
        child: SizedBox(
          height: 36,
          child: ReorderableListView.builder(
            scrollDirection: Axis.horizontal,
            buildDefaultDragHandles: false,
            proxyDecorator: (child, _, _) =>
                Material(color: Colors.transparent, child: child),
            itemCount: ps.length,
            onReorderItem: (o, n) {
              final ids = ps.map((p) => p.id).toList();
              ids.insert(n, ids.removeAt(o));
              ref.read(appProvider.notifier).reorderProjects(ids);
            },
            itemBuilder: (_, i) {
              final p = ps[i];
              final on = active == p.id;
              return Padding(
                key: ValueKey(p.id),
                padding: const EdgeInsets.only(right: 7),
                child: GestureDetector(
                  // 활성 칩은 ✎ 힌트 — 한 번 더 누르면 이름 수정
                  onTap: () => on ? _renameProject(p) : setActive(p.id),
                  child: MouseRegion(
                    cursor: SystemMouseCursors.click,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      decoration: BoxDecoration(
                        color: on ? C.panel2 : C.panel,
                        border: Border.all(color: on ? C.accent : C.line),
                        borderRadius: BorderRadius.circular(5),
                      ),
                      child: Row(mainAxisSize: MainAxisSize.min, children: [
                        ReorderableDragStartListener(
                          index: i,
                          child: MouseRegion(
                            cursor: SystemMouseCursors.grab,
                            child: Padding(
                              padding: const EdgeInsets.only(right: 7),
                              child: Text('≡',
                                  style: mono(size: 13, color: C.dimmer)),
                            ),
                          ),
                        ),
                        PDot(hexColor(p.color)),
                        const SizedBox(width: 7),
                        Text(on ? '${p.name} ✎' : p.name,
                            style: mono(color: on ? C.txt : C.dim)),
                      ]),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ),
      const SizedBox(width: 7),
      KeyedSubtree(
          key: tutKeyAddProject,
          child: chip(
              label: '+ 프로젝트', on: false, dashed: true, onTap: _addProject)),
    ]);
  }

  /// 프로젝트 이름 수정 — 순서는 칩의 ≡ 드래그로.
  Future<void> _renameProject(Project p) async {
    final v = await promptText(context,
        title: '프로젝트 이름 수정', initial: p.name, hint: '이름', maxLength: 30);
    if (v == null || !mounted) return;
    ref.read(appProvider.notifier).renameProject(p.id, v);
  }

  Future<void> _addProject() async {
    final ctl = TextEditingController();
    final name = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: C.panel,
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(6),
            side: BorderSide(color: C.border)),
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
      return [emptyBox(personaOf(s).emptySprint)];
    }
    final rows = <Widget>[];
    var tutKeyed = false; // 첫 섹션 첫 행에만 튜토리얼 타겟 키

    // 미완료/완료 섹션 분리 — 드래그는 같은 섹션 안에서만 (섞이면 헷갈림)
    void addSections(String? pid, List<Todo> its) {
      for (final done in [false, true]) {
        final sec = its.where((t) => t.done == done).toList();
        if (sec.isEmpty) continue;
        rows.add(_section(s, pid, sec, done, tutTarget: !tutKeyed));
        tutKeyed = true;
      }
    }

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
        addSections(pid, its);
      }
    } else {
      final its = s.todos.where((t) => t.project == active).toList();
      if (its.isEmpty) return [emptyBox('이 프로젝트엔 커밋 없음')];
      addSections(active, its);
    }
    return rows;
  }

  /// 한 섹션(같은 프로젝트·같은 완료상태) — ≡ 핸들 드래그로 재배열.
  Widget _section(AppState s, String? pid, List<Todo> items, bool done,
          {required bool tutTarget}) =>
      ReorderableListView.builder(
        key: ValueKey('sec_${pid}_$done'),
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        buildDefaultDragHandles: false,
        proxyDecorator: (child, _, _) =>
            Material(color: C.panel2, child: child),
        itemCount: items.length,
        onReorderItem: (o, n) {
          final ids = items.map((t) => t.id).toList();
          ids.insert(n, ids.removeAt(o));
          ref.read(appProvider.notifier).reorderTodoSection(pid, done, ids);
        },
        itemBuilder: (_, i) => _todoItem(s, items[i],
            key: ValueKey(items[i].id),
            index: i,
            tutTarget: tutTarget && i == 0),
      );

  Widget _todoItem(AppState s, Todo t,
      {required Key key, required int index, bool tutTarget = false}) {
    final n = ref.read(appProvider.notifier);
    Widget row = Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration:
          BoxDecoration(border: Border(top: BorderSide(color: C.line))),
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
        // 텍스트 클릭 → 수정
        Expanded(
          child: GestureDetector(
            onTap: () => _editTodo(t),
            behavior: HitTestBehavior.opaque,
            child: MouseRegion(
              cursor: SystemMouseCursors.text,
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
        // ≡ 드래그 핸들 — 같은 섹션(완료/미완료) 안에서만 이동
        ReorderableDragStartListener(
          index: index,
          child: MouseRegion(
            cursor: SystemMouseCursors.grab,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
              child: Text('≡', style: mono(size: 14, color: C.dimmer)),
            ),
          ),
        ),
        _miniBtn('✕', () => n.deleteTodo(t.id)),
      ]),
    );
    if (tutTarget) {
      row = KeyedSubtree(key: tutKeyFirstTodo, child: row);
    }
    return KeyedSubtree(key: key, child: row);
  }

  Widget _miniBtn(String glyph, VoidCallback onTap) => GestureDetector(
        onTap: onTap,
        child: MouseRegion(
          cursor: SystemMouseCursors.click,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
            child: Text(glyph, style: mono(size: 13, color: C.dimmer)),
          ),
        ),
      );

  Future<void> _editTodo(Todo t) async {
    final v = await promptText(context,
        title: '커밋 수정', initial: t.text, hint: '내용', maxLength: 120);
    if (v == null || !mounted) return;
    ref.read(appProvider.notifier).editTodo(t.id, v);
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
          toast(context,
              pfmt(personaOf(s).shipNotReady, {'day': kDayKr[s.shipDay]}));
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
    final p = personaOf(s);
    final names = res.graduated.map(s.pName).join(', ');
    toast(
        context,
        res.graduated.isNotEmpty
            ? pfmt(p.shipGrad, {'names': names, 'ver': rel.ver})
            : pfmt(p.shipDone, {'ver': rel.ver}));
  }
}
