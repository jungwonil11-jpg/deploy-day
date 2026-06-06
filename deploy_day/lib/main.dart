import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'app_state.dart';
import 'desktop_shell.dart';
import 'memo/memo_window.dart';
import 'screens/home_screen.dart';
import 'theme.dart';

Future<void> main(List<String> args) async {
  WidgetsFlutterBinding.ensureInitialized();
  // desktop_multi_window 서브창 진입 — args = ['multi_window', windowId, argument]
  // 서브창 엔진엔 플러그인이 없으므로 prefs/트레이 초기화 없이 메모 UI만 띄움.
  if (args.isNotEmpty && args.first == 'multi_window') {
    runApp(MemoWindowApp(windowId: args[1], argument: args[2]));
    return;
  }
  final prefs = await SharedPreferences.getInstance();
  await initDesktopShell();
  runApp(ProviderScope(
    overrides: [prefsProvider.overrideWithValue(prefs)],
    child: const DesktopShellHost(child: DeployDayApp()),
  ));
}

class DeployDayApp extends StatelessWidget {
  const DeployDayApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'DEPLOY DAY',
      debugShowCheckedModeBanner: false,
      theme: buildTheme(),
      home: const HomeScreen(),
    );
  }
}
