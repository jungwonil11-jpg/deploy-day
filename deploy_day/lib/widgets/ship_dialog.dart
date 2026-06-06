import 'package:flutter/material.dart';

import '../models.dart';
import '../theme.dart';

/// 배포 모달의 결과 — 릴리즈 제목 + 졸업 확정한 프로젝트 id들.
class ShipResult {
  final String title;
  final Set<String> graduated;
  const ShipResult(this.title, this.graduated);
}

Future<ShipResult?> showShipDialog(BuildContext context, AppState s) =>
    showDialog<ShipResult>(
        context: context, builder: (_) => _ShipDialog(s: s));

class _ShipDialog extends StatefulWidget {
  final AppState s;
  const _ShipDialog({required this.s});

  @override
  State<_ShipDialog> createState() => _ShipDialogState();
}

class _ShipDialogState extends State<_ShipDialog> {
  final _title = TextEditingController();
  final _gradPick = <String>{};

  @override
  void dispose() {
    _title.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.s;
    return Dialog(
      backgroundColor: C.panel,
      shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(6),
          side: const BorderSide(color: C.border)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 480),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          // 헤더
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: const BoxDecoration(
                border: Border(bottom: BorderSide(color: C.line))),
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text.rich(TextSpan(children: [
                TextSpan(
                    text: '✻ ',
                    style: mono(
                        size: 24, color: C.accent, weight: FontWeight.w800)),
                TextSpan(
                    text: '${verStr(s.major, s.minor + 1)} 배포',
                    style: mono(
                        size: 24, color: C.txt, weight: FontWeight.w800)),
              ])),
              const SizedBox(height: 4),
              Text('완료한 건 릴리즈노트로 박제 · 못한 건 다음 스프린트로 롤백',
                  style: mono()),
            ]),
          ),
          // 본문
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 18, 20, 18),
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    TextField(
                      controller: _title,
                      maxLength: 60,
                      style: kr(size: 14),
                      decoration: inputDeco(
                              '이번 릴리즈 한 줄 요약 (선택) · 예: 성경썰앱 최종 완료')
                          .copyWith(counterText: ''),
                    ),
                    const SizedBox(height: 14),
                    ..._groups(s),
                  ]),
            ),
          ),
          // 푸터
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            decoration: const BoxDecoration(
                border: Border(top: BorderSide(color: C.line))),
            child: Row(children: [
              Expanded(
                child: GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: Container(
                    padding: const EdgeInsets.all(13),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                        border: Border.all(color: C.border),
                        borderRadius: BorderRadius.circular(5)),
                    child: Text('취소',
                        style: mono(
                            size: 14,
                            color: C.dim,
                            weight: FontWeight.w700)),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: GestureDetector(
                  onTap: () => Navigator.pop(
                      context, ShipResult(_title.text, _gradPick)),
                  child: Container(
                    padding: const EdgeInsets.all(13),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                        color: C.accent,
                        borderRadius: BorderRadius.circular(5)),
                    child: Text('⏵⏵ 배포 확정',
                        style: mono(
                            size: 14,
                            color: C.bg,
                            weight: FontWeight.w700)),
                  ),
                ),
              ),
            ]),
          ),
        ]),
      ),
    );
  }

  List<Widget> _groups(AppState s) {
    final out = <Widget>[];
    for (final pid in s.projOrder()) {
      final ns = s.todos.where((t) => t.project == pid).toList();
      if (ns.isEmpty) continue;
      final on = pid != null && _gradPick.contains(pid);
      out.add(Padding(
        padding: const EdgeInsets.only(top: 10, bottom: 4),
        child: Row(children: [
          PDot(projectColor(s, pid)),
          const SizedBox(width: 7),
          Text(s.pName(pid), style: mono(size: 11)),
          const Spacer(),
          if (pid != null)
            GestureDetector(
              onTap: () => setState(() =>
                  on ? _gradPick.remove(pid) : _gradPick.add(pid)),
              child: MouseRegion(
                cursor: SystemMouseCursors.click,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 9, vertical: 3),
                  decoration: BoxDecoration(
                    color: on ? C.ship : null,
                    border:
                        Border.all(color: on ? C.ship : C.border),
                    borderRadius: BorderRadius.circular(5),
                  ),
                  child: Text(on ? '🎓 졸업 확정' : '🎓 졸업?',
                      style: mono(
                          size: 10,
                          color: on ? C.bg : C.dim,
                          weight:
                              on ? FontWeight.w700 : FontWeight.w400)),
                ),
              ),
            ),
        ]),
      ));
      for (final t in ns) {
        out.add(Padding(
          padding: const EdgeInsets.fromLTRB(4, 4, 0, 4),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(t.done ? '+' : '↩',
                style: mono(
                    size: 13, color: t.done ? C.ship : C.rollback)),
            const SizedBox(width: 9),
            Expanded(
                child: Text(t.text,
                    style: kr(
                        size: 14,
                        color: t.done ? C.txt : C.dim,
                        height: 1.35))),
          ]),
        ));
      }
    }
    if (out.isEmpty) {
      out.add(Text('스프린트가 비어있음. 빈 배포도 배포긴 함.',
          style: mono(size: 13, color: C.dimmer)));
    }
    return out;
  }
}
