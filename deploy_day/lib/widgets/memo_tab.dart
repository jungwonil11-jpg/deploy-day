import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../app_state.dart';
import '../memo/memo_store.dart';
import '../persona.dart';
import '../theme.dart';

/// /memo 탭 — 바탕화면 포스트잇 관리.
class MemoTab extends ConsumerWidget {
  const MemoTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final memos = ref.watch(memoProvider);
    final n = ref.read(memoProvider.notifier);
    return CliBox(
      title: 'memo · 바탕화면 포스트잇 (항상 위)',
      child: Column(children: [
        // 새 메모 버튼 행
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: C.line))),
          child: Row(children: [
            Expanded(
              child: Text('트레이 우클릭 → 새 메모 로도 만들 수 있음',
                  style: mono(size: 11, color: C.dimmer)),
            ),
            GestureDetector(
              onTap: () => n.newMemo(),
              child: MouseRegion(
                cursor: SystemMouseCursors.click,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 14, vertical: 9),
                  decoration: BoxDecoration(
                      color: C.panel2,
                      border: Border.all(color: C.border),
                      borderRadius: BorderRadius.circular(5)),
                  child: Text('+ memo',
                      style: mono(size: 12, color: C.txt)),
                ),
              ),
            ),
          ]),
        ),
        if (memos.isEmpty)
          emptyBox(personaOf(ref.watch(appProvider)).emptyMemo)
        else
          for (final m in memos) _row(context, ref, m),
      ]),
    );
  }

  Widget _row(BuildContext context, WidgetRef ref, Memo m) {
    final n = ref.read(memoProvider.notifier);
    final open = n.isOpen(m.id);
    final preview = m.text.trim().isEmpty
        ? '(빈 메모)'
        : m.text.trim().split('\n').first;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration:
          const BoxDecoration(border: Border(top: BorderSide(color: C.line))),
      child: Row(children: [
        Text('⏺', style: mono(size: 12, color: open ? C.ship : C.dimmer)),
        const SizedBox(width: 11),
        Expanded(
          child: Text(
            preview,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: kr(
                size: 14,
                color: m.text.trim().isEmpty ? C.dimmer : C.txt),
          ),
        ),
        const SizedBox(width: 8),
        if (open)
          Text('떠있음', style: mono(size: 11, color: C.ship))
        else
          GestureDetector(
            onTap: () => n.openMemo(m.id),
            child: MouseRegion(
              cursor: SystemMouseCursors.click,
              child: Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                child: Text('→ 열기', style: mono(size: 12, color: C.accent)),
              ),
            ),
          ),
        const SizedBox(width: 4),
        GestureDetector(
          onTap: () async {
            final ok = await confirmDialog(context, '메모 삭제함? 내용도 같이 날아감.',
                ok: '삭제');
            if (!ok) return;
            n.deleteMemo(m.id);
          },
          child: MouseRegion(
            cursor: SystemMouseCursors.click,
            child: Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              child: Text('✕', style: mono(size: 13, color: C.dimmer)),
            ),
          ),
        ),
      ]),
    );
  }
}
