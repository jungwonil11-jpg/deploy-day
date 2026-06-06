import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:launch_at_startup/launch_at_startup.dart';
import 'package:tray_manager/tray_manager.dart';
import 'package:window_manager/window_manager.dart';

import 'memo/memo_store.dart';

/// 데스크탑 셸(트레이/자동시작/항상위) 활성 여부 — Windows 데스크탑 전용.
/// Android/Web 빌드에선 전부 no-op으로 빠짐.
bool get isDesktopShell => !kIsWeb && Platform.isWindows;

/// 항상 위 고정 상태 — 웰컴 박스 pin 버튼과 트레이 메뉴가 공유.
final pinned = ValueNotifier<bool>(false);

/// 윈도우 시작 시 자동 실행 상태 캐시 (트레이 메뉴 체크 표시용).
bool _autostart = false;

/// runApp 전에 1회 호출 — 창 옵션 + 자동시작 등록 준비.
Future<void> initDesktopShell() async {
  if (!isDesktopShell) return;
  await windowManager.ensureInitialized();
  launchAtStartup.setup(
    appName: 'deploy-day',
    appPath: Platform.resolvedExecutable,
  );
  const opts = WindowOptions(
    size: Size(860, 940),
    minimumSize: Size(420, 560),
    center: true,
    title: 'deploy-day',
  );
  await windowManager.waitUntilReadyToShow(opts, () async {
    await windowManager.setPreventClose(true); // X = 종료 대신 트레이로
    await windowManager.show();
    await windowManager.focus();
  });
}

/// 항상 위 토글 — pin 버튼/트레이 메뉴 공용.
Future<void> togglePin() async {
  if (!isDesktopShell) return;
  pinned.value = !pinned.value;
  await windowManager.setAlwaysOnTop(pinned.value);
  await _rebuildTrayMenu();
}

Future<void> _toggleAutostart() async {
  _autostart ? await launchAtStartup.disable() : await launchAtStartup.enable();
  _autostart = await launchAtStartup.isEnabled();
  await _rebuildTrayMenu();
}

Future<void> _showWindow() async {
  await windowManager.show();
  await windowManager.focus();
}

/// 진짜 종료 — preventClose 풀고 트레이 아이콘까지 정리.
Future<void> quitApp() async {
  await trayManager.destroy();
  await windowManager.setPreventClose(false);
  await windowManager.destroy();
}

Future<void> _rebuildTrayMenu() async {
  await trayManager.setContextMenu(Menu(items: [
    MenuItem(key: 'show', label: '열기'),
    MenuItem(key: 'new_memo', label: '새 메모'),
    MenuItem.separator(),
    MenuItem.checkbox(key: 'pin', label: '항상 위에 고정', checked: pinned.value),
    MenuItem.checkbox(
        key: 'autostart', label: '윈도우 시작 시 실행', checked: _autostart),
    MenuItem.separator(),
    MenuItem(key: 'quit', label: '종료'),
  ]));
}

/// 트레이/창 이벤트 리스너 호스트 — 앱 최상단에 한 번 감싸면 끝.
class DesktopShellHost extends ConsumerStatefulWidget {
  final Widget child;
  const DesktopShellHost({required this.child, super.key});

  @override
  ConsumerState<DesktopShellHost> createState() => _DesktopShellHostState();
}

class _DesktopShellHostState extends ConsumerState<DesktopShellHost>
    with WindowListener, TrayListener {
  @override
  void initState() {
    super.initState();
    if (isDesktopShell) {
      windowManager.addListener(this);
      trayManager.addListener(this);
      _initTray();
      // 메모 메시지 핸들러 등록 + 열려 있던 포스트잇 복원
      ref.read(memoProvider.notifier).initDesktop();
    }
  }

  Future<void> _initTray() async {
    await trayManager.setIcon('assets/tray_icon.ico');
    await trayManager.setToolTip('deploy-day — 매주 목요일은 배포일');
    _autostart = await launchAtStartup.isEnabled();
    await _rebuildTrayMenu();
  }

  @override
  void dispose() {
    if (isDesktopShell) {
      windowManager.removeListener(this);
      trayManager.removeListener(this);
    }
    super.dispose();
  }

  /// X 버튼 — 종료 대신 트레이로 숨김.
  @override
  void onWindowClose() async {
    if (await windowManager.isPreventClose()) {
      await windowManager.hide();
    }
  }

  @override
  void onTrayIconMouseDown() => _showWindow();

  @override
  void onTrayIconRightMouseDown() => trayManager.popUpContextMenu();

  @override
  void onTrayMenuItemClick(MenuItem menuItem) async {
    switch (menuItem.key) {
      case 'show':
        await _showWindow();
      case 'new_memo':
        await ref.read(memoProvider.notifier).newMemo();
      case 'pin':
        await togglePin();
      case 'autostart':
        await _toggleAutostart();
      case 'quit':
        await quitApp();
    }
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
