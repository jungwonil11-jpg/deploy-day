import 'dart:ffi';

import 'package:ffi/ffi.dart';
import 'package:win32/win32.dart';

/// desktop_multi_window 서브창의 Win32 직접 제어 헬퍼.
///
/// 서브창 엔진엔 window_manager 같은 플러그인이 등록되지 않아서
/// (desktop_multi_window가 자기 채널만 등록함) 스타일링은 win32 FFI로 직접 함.

const _subWindowClass = 'FLUTTER_MULTI_WINDOW_WIN32_WINDOW';

/// 내 프로세스의 "아직 제목 없는" 서브창 HWND를 찾음.
/// 서브창은 빈 제목으로 생성되고, 각 창이 시작하자마자 제목을 박아 선점하므로
/// 빈 제목 = 방금 생긴 내 창. (스폰은 메인에서 순차 await라 레이스 없음)
int findOwnSubWindowHwnd() {
  return using((arena) {
    final cls = _subWindowClass.toNativeUtf16(allocator: arena);
    final pidPtr = arena<Uint32>();
    final myPid = GetCurrentProcessId();
    var h = 0;
    while (true) {
      h = FindWindowEx(NULL, h, cls, nullptr);
      if (h == 0) return 0;
      GetWindowThreadProcessId(h, pidPtr);
      if (pidPtr.value == myPid && GetWindowTextLength(h) == 0) return h;
    }
  });
}

void claimWindowTitle(int hwnd, String title) {
  using((arena) {
    SetWindowText(hwnd, title.toNativeUtf16(allocator: arena));
  });
}

/// 타이틀바 제거. WS_THICKFRAME은 남겨서 가장자리 리사이즈는 유지.
/// 항상 위는 기본 OFF — setTopmost로 따로 켬 (일반 메모앱 관례).
void makeStickyStyle(int hwnd) {
  final style = GetWindowLongPtr(hwnd, GWL_STYLE);
  SetWindowLongPtr(hwnd, GWL_STYLE,
      style & ~(WS_CAPTION | WS_MINIMIZEBOX | WS_MAXIMIZEBOX | WS_SYSMENU));
  SetWindowPos(hwnd, NULL, 0, 0, 0, 0,
      SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_FRAMECHANGED);
}

/// 항상 위 토글 — 메모 타이틀바 [pin]에서 호출.
void setTopmost(int hwnd, bool on) {
  SetWindowPos(hwnd, on ? HWND_TOPMOST : HWND_NOTOPMOST, 0, 0, 0, 0,
      SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE);
}

void setWindowRect(int hwnd, double x, double y, double w, double h) {
  SetWindowPos(hwnd, NULL, x.round(), y.round(), w.round(), h.round(),
      SWP_NOZORDER | SWP_NOACTIVATE);
}

({double x, double y, double w, double h})? getWindowRect(int hwnd) {
  return using((arena) {
    final r = arena<RECT>();
    if (GetWindowRect(hwnd, r) == 0) return null;
    return (
      x: r.ref.left.toDouble(),
      y: r.ref.top.toDouble(),
      w: (r.ref.right - r.ref.left).toDouble(),
      h: (r.ref.bottom - r.ref.top).toDouble(),
    );
  });
}

/// 타이틀바 드래그 흉내 — 드래그 핸들 onPanStart에서 호출.
void startWindowDrag(int hwnd) {
  ReleaseCapture();
  SendMessage(hwnd, WM_NCLBUTTONDOWN, HTCAPTION, 0);
}

void postCloseWindow(int hwnd) {
  PostMessage(hwnd, WM_CLOSE, 0, 0);
}

/// 창이 놓인 모니터의 작업영역(작업표시줄 제외) — 가장자리 스냅 기준.
({double l, double t, double r, double b})? getWorkArea(int hwnd) {
  return using((arena) {
    final mon = MonitorFromWindow(hwnd, MONITOR_DEFAULTTONEAREST);
    if (mon == 0) return null;
    final mi = arena<MONITORINFO>();
    mi.ref.cbSize = sizeOf<MONITORINFO>();
    if (GetMonitorInfo(mon, mi) == 0) return null;
    final w = mi.ref.rcWork;
    return (
      l: w.left.toDouble(),
      t: w.top.toDouble(),
      r: w.right.toDouble(),
      b: w.bottom.toDouble(),
    );
  });
}

/// 같은 프로세스의 다른 메모 창들의 사각형 (자기 자신 제외) — 메모끼리 스냅용.
List<({double l, double t, double r, double b})> siblingMemoRects(int selfHwnd) {
  final out = <({double l, double t, double r, double b})>[];
  using((arena) {
    final cls = _subWindowClass.toNativeUtf16(allocator: arena);
    final pidPtr = arena<Uint32>();
    final myPid = GetCurrentProcessId();
    var h = 0;
    while (true) {
      h = FindWindowEx(NULL, h, cls, nullptr);
      if (h == 0) break;
      if (h == selfHwnd) continue;
      GetWindowThreadProcessId(h, pidPtr);
      if (pidPtr.value != myPid) continue;
      final r = arena<RECT>();
      if (GetWindowRect(h, r) == 0) continue;
      out.add((
        l: r.ref.left.toDouble(),
        t: r.ref.top.toDouble(),
        r: r.ref.right.toDouble(),
        b: r.ref.bottom.toDouble(),
      ));
    }
  });
  return out;
}
