import 'dart:convert';

import 'package:desktop_multi_window/desktop_multi_window.dart';
import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../app_state.dart';
import '../desktop_shell.dart';
import '../models.dart';

/// 메모 색 팔레트 — (배경, 잉크) 쌍. 7색.
/// 0번 = 다크 기본(차콜), 1~5 = 공용 액센트, 6번 = 라이트 기본(페이퍼).
/// 새 메모는 앱 테마에 맞춰 기본색이 정해짐 (다크→0, 라이트→6).
const kMemoColors = [
  (0xFF1A1A1A, 0xFFECECEC), // 0 다크 기본 차콜
  (0xFF2A1C16, 0xFFE8B79E), // 1 오렌지
  (0xFF15241A, 0xFF9EE0B0), // 2 그린
  (0xFF1A2230, 0xFF9EC9F0), // 3 블루
  (0xFF2A1620, 0xFFF0A0C8), // 4 핑크
  (0xFF2A2410, 0xFFE8D08A), // 5 옐로
  (0xFFFAF6E9, 0xFF2D2B28), // 6 라이트 기본 페이퍼 (밝은 면 + 어두운 글씨)
];

/// 다크 기본 색 인덱스 / 라이트 기본 색 인덱스.
const kMemoDarkDefault = 0;
const kMemoLightDefault = 6;

/// 바탕화면 포스트잇 메모 한 장.
class Memo {
  final String id;
  final String text;
  final double x, y, w, h;
  final bool open; // 현재 창으로 떠 있는지 (재시작 시 복원 기준)
  final bool pinned; // 항상 위 고정 — 켰을 때만 topmost (일반 메모앱 관례)
  final int color; // kMemoColors 인덱스

  const Memo({
    required this.id,
    this.text = '',
    required this.x,
    required this.y,
    this.w = 320,
    this.h = 260,
    this.open = true,
    this.pinned = false,
    this.color = 0,
  });

  Memo copyWith(
          {String? text,
          double? x,
          double? y,
          double? w,
          double? h,
          bool? open,
          bool? pinned,
          int? color}) =>
      Memo(
        id: id,
        text: text ?? this.text,
        x: x ?? this.x,
        y: y ?? this.y,
        w: w ?? this.w,
        h: h ?? this.h,
        open: open ?? this.open,
        pinned: pinned ?? this.pinned,
        color: color ?? this.color,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'text': text,
        'x': x,
        'y': y,
        'w': w,
        'h': h,
        'open': open,
        'pinned': pinned,
        'color': color,
      };

  factory Memo.fromJson(Map<String, dynamic> j) => Memo(
        id: j['id'] as String,
        text: j['text'] as String? ?? '',
        x: (j['x'] as num?)?.toDouble() ?? 120,
        y: (j['y'] as num?)?.toDouble() ?? 120,
        w: (j['w'] as num?)?.toDouble() ?? 320,
        h: (j['h'] as num?)?.toDouble() ?? 260,
        open: j['open'] as bool? ?? false,
        pinned: j['pinned'] as bool? ?? false,
        color: (j['color'] as num?)?.toInt() ?? 0,
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
    // 서브창 엔진 생성(CreateIsolate)이 메인 엔진의 warm-up 프레임과 겹치면
    // "CreateIsolate expects there to be no current isolate"로 네이티브 abort됨
    // (desktop_multi_window 레벨 레이스). 시작 직후 프레임들이 다 지나가도록
    // 넉넉히 미뤄서 회피.
    await WidgetsBinding.instance.endOfFrame;
    await Future<void>.delayed(const Duration(seconds: 2));
    // 여러 메모를 한꺼번에 띄우면 서브창 엔진들이 동시에 warm-up 프레임을 돌며
    // SetWindowPos 재진입으로 죽으므로, 하나씩 간격을 두고 순차 복원.
    for (final m in state.where((m) => m.open)) {
      await _spawn(m);
      await Future<void>.delayed(const Duration(milliseconds: 600));
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
      case 'memoPin':
        _update(id, (m) => m.copyWith(pinned: a['pinned'] == true));
      case 'memoColor':
        _update(id, (m) => m.copyWith(color: (a['color'] as num).toInt()));
      case 'memoToCommit':
        // 서브창이 "→ 커밋" 누름 — 본문을 미분류 커밋으로 승격
        ref.read(appProvider.notifier).addTodo(a['text'] as String);
      case 'memoClosed':
        _winByMemo.remove(id);
        _update(id, (m) => m.copyWith(open: false));
    }
    return null;
  }

  Future<void> newMemo() async {
    if (!isDesktopShell) return;
    final n = state.length;
    // 새 메모 기본색은 앱 테마를 따라감 (다크→차콜, 라이트→페이퍼)
    final dark = ref.read(appProvider).dark;
    final m = Memo(
      id: uid(),
      x: 140 + (n % 8) * 36,
      y: 140 + (n % 8) * 36,
      color: dark ? kMemoDarkDefault : kMemoLightDefault,
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
      arguments: jsonEncode({
        'mainId': _mainWindowId,
        'memo': m.toJson(),
        'dark': ref.read(appProvider).dark, // 서브창 엔진은 팔레트를 따로 적용
      }),
      hiddenAtLaunch: true,
    ));
    _winByMemo[m.id] = c.windowId;
  }

  /// 다크/라이트 전환을 떠 있는 포스트잇 전부에 전파.
  Future<void> broadcastTheme(bool dark) async {
    for (final wid in _winByMemo.values) {
      try {
        await WindowController.fromWindowId(wid)
            .invokeMethod('memoTheme', jsonEncode({'dark': dark}));
      } catch (_) {
        // 닫히는 중인 창 등 — 무시
      }
    }
  }
}
