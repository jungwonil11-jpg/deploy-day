import 'dart:math';

/// 프로젝트 칩 색상 팔레트 — Claude CLI 터미널 톤 (튀는 원색 금지).
const kPalette = [
  '#d97757', '#5dbe74', '#d9a33c', '#4fa3e8',
  '#e25d56', '#cc66cc', '#56b6c2', '#e8a287',
];

/// 구버전(HTML 컨셉) 팔레트 → 현행 팔레트 마이그레이션 (인덱스 1:1).
/// 저장된 프로젝트 색이 옛 팔레트면 로드 시 자동 교체됨.
const _legacyPalette = {
  '#a855f7': '#d97757', // 보라 → Claude 오렌지
  '#22d3a6': '#5dbe74',
  '#fbbf24': '#d9a33c',
  '#60a5fa': '#4fa3e8',
  '#fb7185': '#e25d56',
  '#c084fc': '#cc66cc',
  '#34d399': '#56b6c2',
  '#f9a8d4': '#e8a287',
};

String _migrateColor(String c) => _legacyPalette[c] ?? c;

final _rand = Random();

/// HTML 버전 uid()와 같은 형식 (시간 base36 + 랜덤 꼬리).
String uid() =>
    DateTime.now().millisecondsSinceEpoch.toRadixString(36) +
    _rand.nextInt(1 << 20).toRadixString(36);

String verStr(int major, int minor) => 'v$major.$minor';

/// DateTime.weekday(1=월..7=일) 인덱스로 쓰는 요일 이름 (0번은 비움).
const kDayKr = ['', '월', '화', '수', '목', '금', '토', '일'];
const kDayEn = [
  '', 'monday', 'tuesday', 'wednesday', 'thursday',
  'friday', 'saturday', 'sunday',
];

bool isShipDay(int day) => DateTime.now().weekday == day;

/// 다음 배포일까지 남은 일수 (당일이면 0).
int daysToShip(int day) => (day - DateTime.now().weekday + 7) % 7;

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

  Project copyWith({String? name, bool? done}) => Project(
      id: id, name: name ?? this.name, color: color, done: done ?? this.done);

  Map<String, dynamic> toJson() =>
      {'id': id, 'name': name, 'color': color, 'done': done};

  factory Project.fromJson(Map<String, dynamic> j) => Project(
        id: j['id'] as String,
        name: (j['name'] ?? '') as String,
        color: _migrateColor((j['color'] ?? kPalette[0]) as String),
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

  Todo copyWith({String? text, bool? done}) => Todo(
      id: id,
      text: text ?? this.text,
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
  final String persona; // 앱 말투 페르소나 id (persona.dart)
  final bool dark; // 다크모드 (기본 on) — 메모 창에도 같이 적용
  final int shipDay; // 배포 요일 (DateTime.weekday, 기본 목요일)
  final int major;
  final int minor;
  final int streak;
  final List<Project> projects;
  final List<Todo> todos;
  final List<BacklogItem> backlog;
  final List<Release> releases;

  const AppState({
    this.name = '',
    this.persona = 'victor',
    this.dark = true,
    this.shipDay = DateTime.thursday,
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
    String? persona,
    bool? dark,
    int? shipDay,
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
        persona: persona ?? this.persona,
        dark: dark ?? this.dark,
        shipDay: shipDay ?? this.shipDay,
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
        'persona': persona,
        'dark': dark,
        'shipDay': shipDay,
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
        persona: (j['persona'] ?? 'victor') as String,
        dark: j['dark'] as bool? ?? true,
        shipDay: (j['shipDay'] ?? DateTime.thursday) as int,
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
