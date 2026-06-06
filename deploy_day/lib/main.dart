import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'app_state.dart';
import 'desktop_shell.dart';
import 'screens/home_screen.dart';
import 'theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
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
