import 'dart:async';
import 'dart:convert';
import 'dart:math' as math;

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
  Timer? _anim; // 스냅 슬라이드 애니메이션
  bool _animating = false;
  ({double x, double y, double w, double h})? _lastRect;

  @override
  void initState() {
    super.initState();
    // 메인 창의 다크/라이트 설정을 이 엔진 팔레트에도 적용
    applyPalette(dark: _args['dark'] as bool? ?? true);
    // makeStickyStyle의 SetWindowPos(SWP_FRAMECHANGED)가 warm-up 프레임
    // 콜스택 안에서 실행되면 재진입 WM_PAINT로 엔진 raster가 깨져 프로세스가
    // 통째 죽음(특히 시작 시 여러 메모 동시 복원). postFrameCallback도 warm-up
    // 프레임 안에서 도므로 부족 → 첫 프레임 완료 후 이벤트 루프 한 턴 뒤로 뺌.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Future.delayed(const Duration(milliseconds: 150), _setupWindow);
    });
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _rectWatch?.cancel();
    _anim?.cancel();
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
    // 이동/리사이즈 추적 — OS 드래그라 종료 훅이 없어서 폴링.
    // (드래그 중엔 OS 모달 루프가 돌아 타이머가 안 뜀 → 끝난 직후 한 번에 잡힘)
    _rectWatch = Timer.periodic(const Duration(milliseconds: 350), (_) {
      if (_animating) return; // 슬라이드 중엔 폴링 무시 (자기 이동을 드래그로 오인 X)
      final r = getWindowRect(_hwnd);
      if (r == null || r == _lastRect) return;
      // 드래그/리사이즈 끝남 — 가장자리·이웃 메모에 자석 스냅
      final snapped = _snap(r);
      if (snapped != null && (snapped.x != r.x || snapped.y != r.y)) {
        _animateSnapTo(r, snapped.x, snapped.y); // 자석에 미끄러지듯
      } else {
        _lastRect = r;
        _send('memoRect', {'x': r.x, 'y': r.y, 'w': r.w, 'h': r.h});
      }
    });
  }

  /// 현재 위치에서 목표(tx,ty)까지 ease-out으로 슬라이드 — 자석 빨림 느낌.
  void _animateSnapTo(
      ({double x, double y, double w, double h}) from, double tx, double ty) {
    _anim?.cancel();
    _animating = true;
    final sx = from.x, sy = from.y, w = from.w, h = from.h;
    final dx = tx - sx, dy = ty - sy;
    const steps = 14; // ~170ms (12ms × 14)
    var step = 0;
    _anim = Timer.periodic(const Duration(milliseconds: 12), (tm) {
      step++;
      final t = (step / steps).clamp(0.0, 1.0);
      final e = 1 - math.pow(1 - t, 3); // cubic ease-out
      setWindowRect(_hwnd, sx + dx * e, sy + dy * e, w, h);
      if (step >= steps) {
        tm.cancel();
        setWindowRect(_hwnd, tx, ty, w, h); // 끝값 정확히
        _lastRect = getWindowRect(_hwnd) ?? (x: tx, y: ty, w: w, h: h);
        _send('memoRect',
            {'x': _lastRect!.x, 'y': _lastRect!.y, 'w': w, 'h': h});
        _animating = false;
      }
    });
  }

  static const double _snapDist = 18; // 스냅 작동 거리(px)

  /// 자석 스냅 — 화면 작업영역 가장자리(A) + 이웃 메모 모서리(B)에 붙임.
  /// 가장 가까운 후보 하나로 x/y 각각 끌어당김. 후보 없으면 null.
  ({double x, double y})? _snap(({double x, double y, double w, double h}) r) {
    var x = r.x, y = r.y;
    final right = r.x + r.w, bottom = r.y + r.h;

    // 후보 수집: 가장 가까운 것만 채택 (스냅 거리 안쪽일 때만)
    double? bestXTo; var bestXGap = _snapDist;
    double? bestYTo; var bestYGap = _snapDist;
    void considerX(double targetLeft, double dist) {
      if (dist < bestXGap) { bestXGap = dist; bestXTo = targetLeft; }
    }
    void considerY(double targetTop, double dist) {
      if (dist < bestYGap) { bestYGap = dist; bestYTo = targetTop; }
    }

    // A. 화면 작업영역 가장자리
    final wa = getWorkArea(_hwnd);
    if (wa != null) {
      considerX(wa.l, (x - wa.l).abs()); // 왼끝에 left 붙임
      considerX(wa.r - r.w, (right - wa.r).abs()); // 오른끝에 right 붙임
      considerY(wa.t, (y - wa.t).abs());
      considerY(wa.b - r.h, (bottom - wa.b).abs());
    }

    // B. 이웃 메모 — 마주보는 모서리끼리 붙임 + 같은 변 정렬
    for (final s in siblingMemoRects(_hwnd)) {
      // 내 left ↔ 이웃 right (옆에 딱), 내 right ↔ 이웃 left
      considerX(s.r, (x - s.r).abs());
      considerX(s.l - r.w, (right - s.l).abs());
      considerX(s.l, (x - s.l).abs()); // 왼변 정렬
      considerX(s.r - r.w, (right - s.r).abs()); // 오른변 정렬
      // 세로도 동일
      considerY(s.b, (y - s.b).abs());
      considerY(s.t - r.h, (bottom - s.t).abs());
      considerY(s.t, (y - s.t).abs());
      considerY(s.b - r.h, (bottom - s.b).abs());
    }

    if (bestXTo != null) x = bestXTo!;
    if (bestYTo != null) y = bestYTo!;
    if (x == r.x && y == r.y) return null;
    return (x: x, y: y);
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
    // 밝은/어두운 배경 모두에서 보이도록 오버레이는 잉크색 기반으로
    final barTint = ink.withValues(alpha: .06);
    final lineTint = ink.withValues(alpha: .14);
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: bg.computeLuminance() < .5
            ? Brightness.dark
            : Brightness.light,
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
                color: barTint,
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
            Divider(height: 1, thickness: 1, color: lineTint),
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
