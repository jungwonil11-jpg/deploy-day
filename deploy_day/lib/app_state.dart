import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'models.dart';

/// main()에서 overrideWithValue로 주입 — Spring의 @Bean 등록과 같은 개념.
final prefsProvider = Provider<SharedPreferences>(
  (ref) => throw UnimplementedError('main()에서 주입'),
);

/// 현재 선택된 프로젝트 칩 필터 ('all' 또는 project id).
final activeProjectProvider =
    NotifierProvider<ActiveProjectNotifier, String>(ActiveProjectNotifier.new);

class ActiveProjectNotifier extends Notifier<String> {
  @override
  String build() => 'all';

  void set(String v) => state = v;
}

/// 앱 전체 상태 + 비즈니스 로직 — Service 계층 격.
final appProvider = NotifierProvider<AppNotifier, AppState>(AppNotifier.new);

class AppNotifier extends Notifier<AppState> {
  static const _key = 'deployday_v1'; // HTML 버전과 동일 키

  @override
  AppState build() {
    final raw = ref.read(prefsProvider).getString(_key);
    if (raw != null) {
      try {
        return AppState.fromJson(jsonDecode(raw) as Map<String, dynamic>);
      } catch (_) {}
    }
    return AppState.seed();
  }

  void _set(AppState s) {
    state = s;
    ref.read(prefsProvider).setString(_key, jsonEncode(s.toJson()));
  }

  /// '전체' 필터면 미분류(null)로 추가 — HTML curTarget() 대응.
  String? _curTarget() {
    final a = ref.read(activeProjectProvider);
    return a == 'all' ? null : a;
  }

  void addTodo(String text) {
    final v = text.trim();
    if (v.isEmpty) return;
    _set(state.copyWith(
        todos: [...state.todos, Todo(id: uid(), text: v, project: _curTarget())]));
  }

  void toggleTodo(String id) => _set(state.copyWith(
      todos: state.todos
          .map((t) => t.id == id ? t.copyWith(done: !t.done) : t)
          .toList()));

  void deleteTodo(String id) => _set(
      state.copyWith(todos: state.todos.where((t) => t.id != id).toList()));

  void addBacklog(String text) {
    final v = text.trim();
    if (v.isEmpty) return;
    _set(state.copyWith(backlog: [
      ...state.backlog,
      BacklogItem(id: uid(), text: v, project: _curTarget())
    ]));
  }

  void deleteBacklog(String id) => _set(state.copyWith(
      backlog: state.backlog.where((t) => t.id != id).toList()));

  /// 백로그 항목을 이번 스프린트로 끌어옴.
  void pullBacklog(String id) {
    BacklogItem? it;
    for (final b in state.backlog) {
      if (b.id == id) it = b;
    }
    if (it == null) return;
    _set(state.copyWith(
      todos: [...state.todos, Todo(id: uid(), text: it.text, project: it.project)],
      backlog: state.backlog.where((b) => b.id != id).toList(),
    ));
  }

  void addProject(String name) {
    final color = kPalette[state.projects.length % kPalette.length];
    final id = uid();
    _set(state.copyWith(
        projects: [...state.projects, Project(id: id, name: name, color: color)]));
    ref.read(activeProjectProvider.notifier).set(id);
  }

  /// 명예의 전당에서 다시 진행.
  void reviveProject(String id) => _set(state.copyWith(
      projects: state.projects
          .map((p) => p.id == id ? p.copyWith(done: false) : p)
          .toList()));

  /// 배포 확정 — HTML mConfirm 로직 1:1 포팅.
  /// 버전 올리고, 릴리즈 기록하고, 미완료는 롤백(carried)으로 다음 스프린트에.
  Release ship({required String title, required Set<String> graduated}) {
    final shippedCount = state.todos.where((t) => t.done).length;
    var major = state.major;
    var minor = state.minor + 1;
    if (minor >= 10) {
      major += 1;
      minor = 0;
    }
    final release = Release(
      major: major,
      minor: minor,
      title: title.trim(),
      date: todayStr(),
      graduated: graduated.toList(),
      notes: state.todos
          .map((t) => ReleaseNote(text: t.text, done: t.done, project: t.project))
          .toList(),
    );
    _set(state.copyWith(
      major: major,
      minor: minor,
      streak: shippedCount > 0 ? state.streak + 1 : 0,
      projects: state.projects
          .map((p) => graduated.contains(p.id) ? p.copyWith(done: true) : p)
          .toList(),
      // 미완료 롤백 — 졸업한 프로젝트 건은 안 들고 감
      todos: state.todos
          .where((t) => !t.done && !graduated.contains(t.project))
          .map((t) => Todo(id: uid(), text: t.text, carried: true, project: t.project))
          .toList(),
      releases: [...state.releases, release],
    ));
    // 졸업한 프로젝트가 현재 필터였으면 전체로
    if (graduated.contains(ref.read(activeProjectProvider))) {
      ref.read(activeProjectProvider.notifier).set('all');
    }
    return release;
  }

  String exportJson() =>
      const JsonEncoder.withIndent('  ').convert(state.toJson());

  /// 백업 JSON 복원. 파싱 실패 시 throw — 호출부에서 toast 처리.
  void importJson(String raw) {
    final s = AppState.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    ref.read(activeProjectProvider.notifier).set('all');
    _set(s);
  }

  void reset() {
    ref.read(activeProjectProvider.notifier).set('all');
    _set(AppState.seed());
  }
}
