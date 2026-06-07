import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../app_state.dart';
import '../persona.dart';
import '../theme.dart';

class BacklogTab extends ConsumerStatefulWidget {
  const BacklogTab({super.key});

  @override
  ConsumerState<BacklogTab> createState() => _BacklogTabState();
}

class _BacklogTabState extends ConsumerState<BacklogTab> {
  final _input = TextEditingController();
  final _focus = FocusNode();

  @override
  void dispose() {
    _input.dispose();
    _focus.dispose();
    super.dispose();
  }

  void _add() {
    ref.read(appProvider.notifier).addBacklog(_input.text);
    _input.clear();
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(appProvider);
    final n = ref.read(appProvider.notifier);
    return CliBox(
      title: 'backlog · 다음 버전에 할 거 미리 메모',
      child: Column(children: [
        addRow(
          controller: _input,
          focusNode: _focus,
          hint: '다음에 하고 싶은 거',
          button: 'backlog',
          onAdd: _add,
        ),
        if (s.backlog.isEmpty)
          emptyBox(personaOf(s).emptyBacklog)
        else
          for (final b in s.backlog)
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: const BoxDecoration(
                  border: Border(top: BorderSide(color: C.line))),
              child: Row(children: [
                PDot(projectColor(s, b.project)),
                const SizedBox(width: 11),
                Expanded(
                    child: Text(b.text, style: kr(size: 15, height: 1.35))),
                GestureDetector(
                  onTap: () {
                    n.pullBacklog(b.id);
                    toast(context, '스프린트로 pull 함');
                  },
                  child: MouseRegion(
                    cursor: SystemMouseCursors.click,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 6, vertical: 2),
                      child: Text('→ pull',
                          style: mono(size: 13, color: C.ship)),
                    ),
                  ),
                ),
                const SizedBox(width: 4),
                GestureDetector(
                  onTap: () => n.deleteBacklog(b.id),
                  child: MouseRegion(
                    cursor: SystemMouseCursors.click,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 6, vertical: 2),
                      child:
                          Text('✕', style: mono(size: 13, color: C.dimmer)),
                    ),
                  ),
                ),
              ]),
            ),
      ]),
    );
  }
}
