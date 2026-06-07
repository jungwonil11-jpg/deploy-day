import 'dart:math';

/// 프로젝트 칩 색상 팔레트 — 원본 HTML PALETTE와 동일.
const kPalette = [
  '#a855f7', '#22d3a6', '#fbbf24', '#60a5fa',
  '#fb7185', '#c084fc', '#34d399', '#f9a8d4',
];

final _rand = Random();

/// HTML 버전 uid()와 같은 형식 (시간 base36 + 랜덤 꼬리).
String uid() =>
    DateTime.now().millisecondsSinceEpoch.toRadixString(36) +
    _rand.nextInt(1 << 20).toRadixString(36);

String verStr(int major, int minor) => 'v$major.$minor';

bool isThursday() => DateTime.now().weekday == DateTime.thursday;

/// 다음 목요일까지 남은 일수 (목요일 당일이면 0).
int daysToThu() => (DateTime.thursday - DateTime.now().weekday + 7) % 7;

String todayStr() => DateTime.now().toIso8601String().substring(0, 10);

class Project {
  final String id;
  final String name;
  final String color; // '#a855f7' 형식 — HTML 백업 JSON과 호환
  final bool done; // 졸업 여부

  const Project({
    required this.id,
    required this.name,
    required this.color,
    this.done = false,
  });

  Project copyWith({bool? done}) =>
      Project(id: id, name: name, color: color, done: done ?? this.done);

  Map<String, dynamic> toJson() =>
      {'id': id, 'name': name, 'color': color, 'done': done};

  factory Project.fromJson(Map<String, dynamic> j) => Project(
        id: j['id'] as String,
        name: (j['name'] ?? '') as String,
        color: (j['color'] ?? kPalette[0]) as String,
        done: j['done'] == true,
      );
}

class Todo {
  final String id;
  final String text;
  final bool done;
  final bool carried; // 지난 배포에서 롤백돼 넘어온 항목
  final String? project;

  const Todo({
    required this.id,
    required this.text,
    this.done = false,
    this.carried = false,
    this.project,
  });

  Todo copyWith({bool? done}) => Todo(
      id: id,
      text: text,
      done: done ?? this.done,
      carried: carried,
      project: project);

  Map<String, dynamic> toJson() => {
        'id': id,
        'text': text,
        'done': done,
        if (carried) 'carried': true,
        'project': project,
      };

  factory Todo.fromJson(Map<String, dynamic> j) => Todo(
        id: j['id'] as String,
        text: (j['text'] ?? '') as String,
        done: j['done'] == true,
        carried: j['carried'] == true,
        project: j['project'] as String?,
      );
}

class BacklogItem {
  final String id;
  final String text;
  final String? project;

  const BacklogItem({required this.id, required this.text, this.project});

  Map<String, dynamic> toJson() => {'id': id, 'text': text, 'project': project};

  factory BacklogItem.fromJson(Map<String, dynamic> j) => BacklogItem(
        id: j['id'] as String,
        text: (j['text'] ?? '') as String,
        project: j['project'] as String?,
      );
}

class ReleaseNote {
  final String text;
  final bool done;
  final String? project;

  const ReleaseNote({required this.text, required this.done, this.project});

  Map<String, dynamic> toJson() =>
      {'text': text, 'done': done, 'project': project};

  factory ReleaseNote.fromJson(Map<String, dynamic> j) => ReleaseNote(
        text: (j['text'] ?? '') as String,
        done: j['done'] == true,
        project: j['project'] as String?,
      );
}

class Release {
  final int major;
  final int minor;
  final String title;
  final String date; // yyyy-MM-dd
  final List<String> graduated; // 이 배포에서 졸업한 프로젝트 id들
  final List<ReleaseNote> notes;

  const Release({
    required this.major,
    required this.minor,
    required this.title,
    required this.date,
    required this.graduated,
    required this.notes,
  });

  String get ver => verStr(major, minor);

  Map<String, dynamic> toJson() => {
        'major': major,
        'minor': minor,
        'title': title,
        'date': date,
        'graduated': graduated,
        'notes': notes.map((n) => n.toJson()).toList(),
      };

  factory Release.fromJson(Map<String, dynamic> j) => Release(
        major: (j['major'] ?? 1) as int,
        minor: (j['minor'] ?? 0) as int,
        title: (j['title'] ?? '') as String,
        date: (j['date'] ?? '') as String,
        graduated:
            ((j['graduated'] ?? []) as List).map((e) => e as String).toList(),
        notes: ((j['notes'] ?? []) as List)
            .map((e) => ReleaseNote.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}

class AppState {
  final String name; // 배포자 이름 — 첫 실행 때 입력받음
  final int major;
  final int minor;
  final int streak;
  final List<Project> projects;
  final List<Todo> todos;
  final List<BacklogItem> backlog;
  final List<Release> releases;

  const AppState({
    this.name = '',
    required this.major,
    required this.minor,
    required this.streak,
    required this.projects,
    required this.todos,
    required this.backlog,
    required this.releases,
  });

  factory AppState.seed() => const AppState(
      major: 1,
      minor: 0,
      streak: 0,
      projects: [],
      todos: [],
      backlog: [],
      releases: []);

  AppState copyWith({
    String? name,
    int? major,
    int? minor,
    int? streak,
    List<Project>? projects,
    List<Todo>? todos,
    List<BacklogItem>? backlog,
    List<Release>? releases,
  }) =>
      AppState(
        name: name ?? this.name,
        major: major ?? this.major,
        minor: minor ?? this.minor,
        streak: streak ?? this.streak,
        projects: projects ?? this.projects,
        todos: todos ?? this.todos,
        backlog: backlog ?? this.backlog,
        releases: releases ?? this.releases,
      );

  Project? proj(String? pid) {
    if (pid == null) return null;
    for (final p in projects) {
      if (p.id == pid) return p;
    }
    return null;
  }

  String pName(String? pid) => proj(pid)?.name ?? '미분류';

  /// 그룹 표시 순서: 프로젝트 등록순 + 미분류(null) 마지막.
  List<String?> projOrder() => [...projects.map((p) => p.id), null];

  /// JSON 키는 HTML 버전(deployday_v1)과 동일 — 기존 백업 그대로 import 가능.
  /// name은 Flutter 버전에서 추가된 키 (HTML 백업엔 없어도 무방).
  Map<String, dynamic> toJson() => {
        'name': name,
        'major': major,
        'minor': minor,
        'streak': streak,
        'projects': projects.map((e) => e.toJson()).toList(),
        'todos': todos.map((e) => e.toJson()).toList(),
        'backlog': backlog.map((e) => e.toJson()).toList(),
        'releases': releases.map((e) => e.toJson()).toList(),
      };

  factory AppState.fromJson(Map<String, dynamic> j) => AppState(
        name: (j['name'] ?? '') as String,
        major: (j['major'] ?? 1) as int,
        minor: (j['minor'] ?? 0) as int,
        streak: (j['streak'] ?? 0) as int,
        projects: ((j['projects'] ?? []) as List)
            .map((e) => Project.fromJson(e as Map<String, dynamic>))
            .toList(),
        todos: ((j['todos'] ?? []) as List)
            .map((e) => Todo.fromJson(e as Map<String, dynamic>))
            .toList(),
        backlog: ((j['backlog'] ?? []) as List)
            .map((e) => BacklogItem.fromJson(e as Map<String, dynamic>))
            .toList(),
        releases: ((j['releases'] ?? []) as List)
            .map((e) => Release.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}
