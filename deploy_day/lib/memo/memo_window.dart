import 'dart:async';
import 'dart:convert';

import 'package:desktop_multi_window/desktop_multi_window.dart';
import 'package:flutter/material.dart';

import '../theme.dart' show C;
import 'memo_store.dart';
import 'win32_util.dart';

/// 서브창 엔진 전용 폰트 — google_fonts는 path_provider 플러그인이 필요한데
/// 서브창 엔진엔 등록 안 되므로 시스템 폰트로 감 (Consolas + 맑은고딕 폴백).
TextStyle _memoStyle({
  double size = 13,
  Color color = C.txt,
  FontWeight weight = FontWeight.w400,
}) =>
    TextStyle(
      fontFamily: 'Consolas',
      fontFamilyFallback: const ['Malgun Gothic'],
      fontSize: size,
      color: color,
      fontWeight: weight,
      height: 1.45,
    );

/// 포스트잇 서브창 앱 — main()에서 multi_window 분기로 진입.
class MemoWindowApp extends StatefulWidget {
  final String windowId;
  final String argument;
  const MemoWindowApp(
      {required this.windowId, required this.argument, super.key});

  @override
  State<MemoWindowApp> createState() => _MemoWindowAppState();
}

class _MemoWindowAppState extends State<MemoWindowApp> {
  late final Map<String, dynamic> _args =
      jsonDecode(widget.argument) as Map<String, dynamic>;
  late final String _mainId = _args['mainId'] as String;
  late final Memo _memo =
      Memo.fromJson(_args['memo'] as Map<String, dynamic>);

  late final TextEditingController _text =
      TextEditingController(text: _memo.text);
  int _hwnd = 0;
  Timer? _debounce;
  Timer? _rectWatch;
  ({double x, double y, double w, double h})? _lastRect;

  @override
  void initState() {
    super.initState();
    // SetWindowPos(SWP_FRAMECHANGED)가 빌드 중 메트릭 변경을 동기로 쏘면
    // 첫 프레임이 깨지며 엔진이 죽으므로, 창 스타일링은 첫 프레임 이후로 미룸.
    WidgetsBinding.instance.addPostFrameCallback((_) => _setupWindow());
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _rectWatch?.cancel();
    _text.dispose();
    super.dispose();
  }

  Future<void> _setupWindow() async {
    _hwnd = findOwnSubWindowHwnd();
    if (_hwnd == 0) return;
    claimWindowTitle(_hwnd, 'dd-memo-${_memo.id}');
    makeStickyStyle(_hwnd);
    final c = await WindowController.fromCurrentEngine();
    // 메인이 보내는 강제 종료 (메모 삭제 시)
    await c.setWindowMethodHandler((call) async {
      if (call.method == 'memoKill') postCloseWindow(_hwnd);
      return null;
    });
    await c.show();
    // show가 위치를 덮어쓰므로 표시 후에 저장된 자리로 복원
    setWindowRect(_hwnd, _memo.x, _memo.y, _memo.w, _memo.h);
    _lastRect = getWindowRect(_hwnd);
    // 이동/리사이즈 추적 — 드래그 종료 훅이 없어서 폴링으로
    _rectWatch = Timer.periodic(const Duration(seconds: 2), (_) {
      final r = getWindowRect(_hwnd);
      if (r == null || r == _lastRect) return;
      _lastRect = r;
      _send('memoRect', {'x': r.x, 'y': r.y, 'w': r.w, 'h': r.h});
    });
  }

  void _send(String method, Map<String, dynamic> args) {
    try {
      WindowController.fromWindowId(_mainId)
          .invokeMethod(method, jsonEncode({'id': _memo.id, ...args}));
    } catch (_) {
      // 메인창 핸들러 미등록 등 — 다음 이벤트 때 재시도되므로 무시
    }
  }

  void _onChanged(String v) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 600),
        () => _send('memoText', {'text': v}));
  }

  void _close() {
    _debounce?.cancel();
    _send('memoText', {'text': _text.text}); // 디바운스 잔여분 플러시
    final r = getWindowRect(_hwnd);
    if (r != null) {
      _send('memoRect', {'x': r.x, 'y': r.y, 'w': r.w, 'h': r.h});
    }
    _send('memoClosed', {});
    postCloseWindow(_hwnd);
  }

  @override
  Widget build(BuildContext context) => MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          brightness: Brightness.dark,
          scaffoldBackgroundColor: C.bg,
          textSelectionTheme:
              const TextSelectionThemeData(cursorColor: C.accent),
        ),
        home: Scaffold(
          body: Container(
            decoration: BoxDecoration(
              color: C.panel,
              border: Border.all(color: C.border),
            ),
            child: Column(children: [
              // 드래그 핸들 — 미니 터미널 타이틀바
              GestureDetector(
                onPanStart: (_) => startWindowDrag(_hwnd),
                child: Container(
                  height: 30,
                  color: C.panel2,
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  child: Row(children: [
                    Text('✻',
                        style: _memoStyle(
                            size: 12,
                            color: C.accent,
                            weight: FontWeight.w700)),
                    const SizedBox(width: 6),
                    Text('memo',
                        style: _memoStyle(size: 12, color: C.dim)),
                    const Spacer(),
                    MouseRegion(
                      cursor: SystemMouseCursors.click,
                      child: GestureDetector(
                        onTap: _close,
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 4),
                          child: Text('✕',
                              style:
                                  _memoStyle(size: 13, color: C.dimmer)),
                        ),
                      ),
                    ),
                  ]),
                ),
              ),
              const Divider(height: 1, thickness: 1, color: C.line),
              // 메모 본문
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
                  child: TextField(
                    controller: _text,
                    onChanged: _onChanged,
                    maxLines: null,
                    expands: true,
                    autofocus: true,
                    style: _memoStyle(size: 13.5),
                    decoration: InputDecoration(
                      border: InputBorder.none,
                      isDense: true,
                      hintText: '> 메모...',
                      hintStyle: _memoStyle(size: 13.5, color: C.dimmer),
                    ),
                  ),
                ),
              ),
            ]),
          ),
        ),
      );
}
