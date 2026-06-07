import 'dart:async';
import 'dart:convert';

import 'package:desktop_multi_window/desktop_multi_window.dart';
import 'package:flutter/material.dart';

import '../theme.dart' show C, applyPalette;
import 'memo_store.dart';
import 'win32_util.dart';

/// 서브창 엔진 전용 폰트 — google_fonts는 path_provider 플러그인이 필요한데
/// 서브창 엔진엔 등록 안 되므로 시스템 폰트로 감 (Consolas + 맑은고딕 폴백).
TextStyle _memoStyle({
  double size = 13,
  Color? color,
  FontWeight weight = FontWeight.w400,
}) =>
    TextStyle(
      fontFamily: 'Consolas',
      fontFamilyFallback: const ['Malgun Gothic'],
      fontSize: size,
      color: color ?? C.txt,
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
  late bool _pinned = _memo.pinned;
  late int _color = _memo.color;
  int _hwnd = 0;
  Timer? _debounce;
  Timer? _rectWatch;
  ({double x, double y, double w, double h})? _lastRect;

  @override
  void initState() {
    super.initState();
    // 메인 창의 다크/라이트 설정을 이 엔진 팔레트에도 적용
    applyPalette(dark: _args['dark'] as bool? ?? true);
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
    // 메인이 보내는 메시지 — 강제 종료(삭제 시)·테마 전환
    await c.setWindowMethodHandler((call) async {
      if (call.method == 'memoKill') postCloseWindow(_hwnd);
      if (call.method == 'memoTheme') {
        final a = jsonDecode(call.arguments as String) as Map<String, dynamic>;
        applyPalette(dark: a['dark'] as bool? ?? true);
        if (mounted) setState(() {});
      }
      return null;
    });
    await c.show();
    // show가 위치를 덮어쓰므로 표시 후에 저장된 자리로 복원
    setWindowRect(_hwnd, _memo.x, _memo.y, _memo.w, _memo.h);
    if (_pinned) setTopmost(_hwnd, true); // 고정해뒀던 메모만 항상 위
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

  void _cycleColor() {
    setState(() => _color = (_color + 1) % kMemoColors.length);
    _send('memoColor', {'color': _color});
  }

  void _toCommit() {
    final t = _text.text.trim();
    if (t.isEmpty) return;
    _send('memoText', {'text': _text.text});
    _send('memoToCommit', {'text': t});
  }

  @override
  Widget build(BuildContext context) {
    final (bgHex, inkHex) = kMemoColors[_color.clamp(0, kMemoColors.length - 1)];
    final bg = Color(bgHex);
    final ink = Color(inkHex);
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: bg,
        textSelectionTheme: TextSelectionThemeData(cursorColor: C.accent),
      ),
      home: Scaffold(
        body: Container(
          decoration: BoxDecoration(
            color: bg,
            border: Border.all(color: C.border),
          ),
          child: Column(children: [
            // 드래그 핸들 — 미니 터미널 타이틀바
            GestureDetector(
              onPanStart: (_) => startWindowDrag(_hwnd),
              child: Container(
                height: 30,
                color: Colors.white.withValues(alpha: .05),
                padding: const EdgeInsets.symmetric(horizontal: 10),
                child: Row(children: [
                  Text('✻',
                      style: _memoStyle(
                          size: 12, color: C.accent, weight: FontWeight.w700)),
                  const SizedBox(width: 6),
                  Text('memo', style: _memoStyle(size: 12, color: ink)),
                  const Spacer(),
                  // 색 변경 — 다음 색으로 순환
                  _barBtn('◑', _cycleColor, ink, '색 변경'),
                  // 메모 → 스프린트 커밋으로 승격
                  _barBtn('→commit', _toCommit, ink, '커밋으로 보내기'),
                  // 항상 위 토글 — 켰을 때만 topmost
                  _barBtn('[pin${_pinned ? ' ●' : ''}]', () {
                    setState(() => _pinned = !_pinned);
                    setTopmost(_hwnd, _pinned);
                    _send('memoPin', {'pinned': _pinned});
                  }, _pinned ? C.accent : ink.withValues(alpha: .55), '항상 위'),
                  _barBtn('✕', _close, ink.withValues(alpha: .55), '닫기'),
                ]),
              ),
            ),
            Divider(height: 1, thickness: 1, color: Colors.white.withValues(alpha: .08)),
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
                  style: _memoStyle(size: 13.5, color: ink),
                  decoration: InputDecoration(
                    border: InputBorder.none,
                    isDense: true,
                    hintText: '> 메모...',
                    hintStyle:
                        _memoStyle(size: 13.5, color: ink.withValues(alpha: .4)),
                  ),
                ),
              ),
            ),
          ]),
        ),
      ),
    );
  }

  Widget _barBtn(String label, VoidCallback onTap, Color color, String tip) =>
      MouseRegion(
        cursor: SystemMouseCursors.click,
        child: Tooltip(
          message: tip,
          child: GestureDetector(
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 4),
              child: Text(label, style: _memoStyle(size: 11, color: color)),
            ),
          ),
        ),
      );
}
