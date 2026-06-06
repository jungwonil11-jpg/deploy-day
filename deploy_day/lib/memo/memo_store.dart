import 'dart:convert';

import 'package:desktop_multi_window/desktop_multi_window.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../app_state.dart';
import '../desktop_shell.dart';
import '../models.dart';

/// 바탕화면 포스트잇 메모 한 장.
class Memo {
  final String id;
  final String text;
  final double x, y, w, h;
  final bool open; // 현재 창으로 떠 있는지 (재시작 시 복원 기준)

  const Memo({
    required this.id,
    this.text = '',
    required this.x,
    required this.y,
    this.w = 320,
    this.h = 260,
    this.open = true,
  });

  Memo copyWith({String? text, double? x, double? y, double? w, double? h, bool? open}) =>
      Memo(
        id: id,
        text: text ?? this.text,
        x: x ?? this.x,
        y: y ?? this.y,
        w: w ?? this.w,
        h: h ?? this.h,
        open: open ?? this.open,
      );

  Map<String, dynamic> toJson() =>
      {'id': id, 'text': text, 'x': x, 'y': y, 'w': w, 'h': h, 'open': open};

  factory Memo.fromJson(Map<String, dynamic> j) => Memo(
        id: j['id'] as String,
        text: j['text'] as String? ?? '',
        x: (j['x'] as num?)?.toDouble() ?? 120,
        y: (j['y'] as num?)?.toDouble() ?? 120,
        w: (j['w'] as num?)?.toDouble() ?? 320,
        h: (j['h'] as num?)?.toDouble() ?? 260,
        open: j['open'] as bool? ?? false,
      );
}

final memoProvider = NotifierProvider<MemoNotifier, List<Memo>>(MemoNotifier.new);

/// 메인 엔진 쪽 메모 관리 — 저장은 전부 여기서 함.
/// 서브창 엔진엔 shared_preferences 플러그인이 없어서 메시지로 받아 메인이 저장.
class MemoNotifier extends Notifier<List<Memo>> {
  static const _key = 'deployday_memos_v1';

  /// memoId -> 떠 있는 서브창 windowId
  final _winByMemo = <String, String>{};
  String? _mainWindowId;

  @override
  List<Memo> build() {
    final raw = ref.read(prefsProvider).getString(_key);
    if (raw == null) return [];
    try {
      return (jsonDecode(raw) as List)
          .map((e) => Memo.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return [];
    }
  }

  void _persist(List<Memo> next) {
    state = next;
    ref.read(prefsProvider).setString(
        _key, jsonEncode(next.map((m) => m.toJson()).toList()));
  }

  void _update(String id, Memo Function(Memo) f) => _persist(
      state.map((m) => m.id == id ? f(m) : m).toList());

  /// 앱 시작 시 1회 — 메시지 핸들러 등록 + 열려 있던 메모 복원.
  Future<void> initDesktop() async {
    if (!isDesktopShell) return;
    final me = await WindowController.fromCurrentEngine();
    _mainWindowId = me.windowId;
    await me.setWindowMethodHandler(_onMessage);
    for (final m in state.where((m) => m.open)) {
      await _spawn(m);
    }
  }

  /// 서브창들이 보내는 메시지 수신.
  Future<dynamic> _onMessage(MethodCall call) async {
    final a = jsonDecode(call.arguments as String) as Map<String, dynamic>;
    final id = a['id'] as String;
    switch (call.method) {
      case 'memoText':
        _update(id, (m) => m.copyWith(text: a['text'] as String));
      case 'memoRect':
        _update(
            id,
            (m) => m.copyWith(
                  x: (a['x'] as num).toDouble(),
                  y: (a['y'] as num).toDouble(),
                  w: (a['w'] as num).toDouble(),
                  h: (a['h'] as num).toDouble(),
                ));
      case 'memoClosed':
        _winByMemo.remove(id);
        _update(id, (m) => m.copyWith(open: false));
    }
    return null;
  }

  Future<void> newMemo() async {
    if (!isDesktopShell) return;
    final n = state.length;
    final m = Memo(
      id: uid(),
      x: 140 + (n % 8) * 36,
      y: 140 + (n % 8) * 36,
    );
    _persist([...state, m]);
    await _spawn(m);
  }

  Future<void> openMemo(String id) async {
    if (_winByMemo.containsKey(id)) return; // 이미 떠 있음
    final m = state.firstWhere((m) => m.id == id);
    _update(id, (m) => m.copyWith(open: true));
    await _spawn(m.copyWith(open: true));
  }

  Future<void> deleteMemo(String id) async {
    final wid = _winByMemo.remove(id);
    if (wid != null) {
      // 떠 있으면 창부터 강제 종료
      try {
        await WindowController.fromWindowId(wid).invokeMethod('memoKill');
      } catch (_) {}
    }
    _persist(state.where((m) => m.id != id).toList());
  }

  bool isOpen(String id) => _winByMemo.containsKey(id);

  Future<void> _spawn(Memo m) async {
    final c = await WindowController.create(WindowConfiguration(
      arguments: jsonEncode({'mainId': _mainWindowId, 'memo': m.toJson()}),
      hiddenAtLaunch: true,
    ));
    _winByMemo[m.id] = c.windowId;
  }
}
