import 'package:flutter/material.dart';

import 'models.dart';

/// 팔레트 한 벌 — 다크/라이트 전환용.
class Palette {
  final Color bg, panel, panel2, border, line, txt, dim, dimmer;
  final Color accent, accent2, blue, pink, magenta, ship, warn, rollback;
  const Palette({
    required this.bg,
    required this.panel,
    required this.panel2,
    required this.border,
    required this.line,
    required this.txt,
    required this.dim,
    required this.dimmer,
    required this.accent,
    required this.accent2,
    required this.blue,
    required this.pink,
    required this.magenta,
    required this.ship,
    required this.warn,
    required this.rollback,
  });
}

/// 다크 — Claude Code CLI 터미널 블랙 (기본).
const kDarkPalette = Palette(
  bg: Color(0xFF0C0C0C), // Windows Terminal 블랙
  panel: Color(0xFF111111), // 다이얼로그·토스트 등 떠있는 면만
  panel2: Color(0xFF1A1A1A),
  border: Color(0xFF3A3A3A),
  line: Color(0xFF262626),
  txt: Color(0xFFECECEC),
  dim: Color(0xFF999999),
  dimmer: Color(0xFF5C5C5C),
  accent: Color(0xFFD97757), // Claude orange
  accent2: Color(0xFFC15F3C), // crail (진한 오렌지)
  blue: Color(0xFF4FA3E8), // status line 모델명 블루
  pink: Color(0xFFE5549F), // ⏵⏵ bypass permissions 핑크
  magenta: Color(0xFFCC66CC), // 브랜치명 마젠타
  ship: Color(0xFF5DBE74), // 터미널 그린
  warn: Color(0xFFD9A33C), // 터미널 옐로
  rollback: Color(0xFFE25D56), // 터미널 레드
);

/// 라이트 — Claude 웜 화이트 (라이트 터미널 톤, 채도 낮춰서 대비 확보).
const kLightPalette = Palette(
  bg: Color(0xFFFAF9F5),
  panel: Color(0xFFFFFFFF),
  panel2: Color(0xFFEFEDE7),
  border: Color(0xFFC9C4BA),
  line: Color(0xFFE3E0D8),
  txt: Color(0xFF2D2B28),
  dim: Color(0xFF6E6A62),
  dimmer: Color(0xFFA8A294),
  accent: Color(0xFFC15F3C),
  accent2: Color(0xFFA84B2B),
  blue: Color(0xFF2E7CC3),
  pink: Color(0xFFC23A86),
  magenta: Color(0xFFA04BA0),
  ship: Color(0xFF3E9B57),
  warn: Color(0xFFA67A1E),
  rollback: Color(0xFFC94840),
);

/// 현재 팔레트 — 엔진(메인/메모 서브창)마다 따로 적용됨.
Palette _pal = kDarkPalette;
bool get isDark => identical(_pal, kDarkPalette);

void applyPalette({required bool dark}) {
  _pal = dark ? kDarkPalette : kLightPalette;
}

/// 색 접근자 — 기존 C.xxx 호출부 호환 유지. 팔레트 따라 값이 바뀜.
abstract final class C {
  static Color get bg => _pal.bg;
  static Color get panel => _pal.panel;
  static Color get panel2 => _pal.panel2;
  static Color get border => _pal.border;
  static Color get line => _pal.line;
  static Color get txt => _pal.txt;
  static Color get dim => _pal.dim;
  static Color get dimmer => _pal.dimmer;
  static Color get accent => _pal.accent;
  static Color get accent2 => _pal.accent2;
  static Color get blue => _pal.blue;
  static Color get pink => _pal.pink;
  static Color get magenta => _pal.magenta;
  static Color get ship => _pal.ship;
  static Color get warn => _pal.warn;
  static Color get rollback => _pal.rollback;
}

Color hexColor(String hex) =>
    Color(int.parse(hex.substring(1), radix: 16) | 0xFF000000);

/// 프로젝트 점 색 — 미분류/없는 프로젝트는 dimmer.
Color projectColor(AppState s, String? pid) {
  final p = s.proj(pid);
  return p == null ? C.dimmer : hexColor(p.color);
}

/// JetBrains Mono — CLI 본체 폰트 (에셋 번들, 네트워크 페치 없음).
TextStyle mono({
  double size = 12,
  Color? color,
  FontWeight weight = FontWeight.w400,
  double? spacing,
  double? height,
  bool italic = false,
}) =>
    TextStyle(
        fontFamily: 'JetBrains Mono',
        fontSize: size,
        color: color ?? C.dim,
        fontWeight: weight,
        letterSpacing: spacing,
        height: height,
        fontStyle: italic ? FontStyle.italic : FontStyle.normal);

/// Nanum Gothic Coding — 한글도 고정폭으로 (풀 터미널 감성, 에셋 번들).
TextStyle kr({
  double size = 15,
  Color? color,
  FontWeight weight = FontWeight.w400,
  double? height,
}) =>
    TextStyle(
        fontFamily: 'Nanum Gothic Coding',
        fontSize: size,
        color: color ?? C.txt,
        fontWeight: weight,
        height: height);

ThemeData buildTheme({required bool dark}) => ThemeData(
      brightness: dark ? Brightness.dark : Brightness.light,
      useMaterial3: true,
      scaffoldBackgroundColor: C.bg,
      colorScheme: (dark ? const ColorScheme.dark() : const ColorScheme.light())
          .copyWith(primary: C.accent, secondary: C.accent2, surface: C.panel),
      dialogTheme: DialogThemeData(backgroundColor: C.panel),
      textSelectionTheme: TextSelectionThemeData(cursorColor: C.accent),
    );

/// 하단 토스트 — CLI 메시지 라인 스타일.
void toast(BuildContext context, String msg) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(
      content: Text.rich(
        TextSpan(children: [
          TextSpan(text: '⏺ ', style: mono(size: 13, color: C.accent)),
          TextSpan(text: msg, style: kr(size: 13, color: C.txt)),
        ]),
        textAlign: TextAlign.center,
      ),
      behavior: SnackBarBehavior.floating,
      backgroundColor: C.panel2,
      shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(5),
          side: BorderSide(color: C.border)),
      duration: const Duration(milliseconds: 2200),
      width: 380,
    ));
}

/// 한 줄 텍스트 입력 다이얼로그 — 커밋 수정·프로젝트 이름 등 공용.
/// 빈 값으로 확인하면 null (변경 없음).
Future<String?> promptText(
  BuildContext context, {
  required String title,
  String initial = '',
  String hint = '',
  int maxLength = 60,
}) async {
  final ctl = TextEditingController(text: initial);
  final r = await showDialog<String>(
    context: context,
    builder: (ctx) => AlertDialog(
      backgroundColor: C.panel,
      shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(6),
          side: BorderSide(color: C.border)),
      title: Text(title,
          style: mono(size: 15, color: C.txt, weight: FontWeight.w700)),
      content: TextField(
        controller: ctl,
        autofocus: true,
        maxLength: maxLength,
        style: kr(size: 14),
        decoration: inputDeco(hint).copyWith(
          counterText: '',
          prefixText: '❯ ',
          prefixStyle: mono(size: 14, color: C.accent, weight: FontWeight.w700),
        ),
        onSubmitted: (v) => Navigator.pop(ctx, v),
      ),
      actions: [
        TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('취소', style: mono(size: 13, color: C.dim))),
        TextButton(
            onPressed: () => Navigator.pop(ctx, ctl.text),
            child: Text('저장',
                style: mono(
                    size: 13, color: C.accent, weight: FontWeight.w700))),
      ],
    ),
  );
  final v = r?.trim();
  return (v == null || v.isEmpty) ? null : v;
}

Future<bool> confirmDialog(BuildContext context, String msg,
    {String ok = '확인'}) async {
  final r = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      backgroundColor: C.panel,
      shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(6),
          side: BorderSide(color: C.border)),
      content: Text(msg, style: kr(size: 14)),
      actions: [
        TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text('취소', style: mono(size: 13, color: C.dim))),
        TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(ok,
                style: mono(
                    size: 13, color: C.accent, weight: FontWeight.w700))),
      ],
    ),
  );
  return r == true;
}

/// 프로젝트 색 점 (.pdot).
class PDot extends StatelessWidget {
  final Color color;
  final double size;
  const PDot(this.color, {this.size = 8, super.key});

  @override
  Widget build(BuildContext context) => Container(
      width: size,
      height: size,
      decoration: BoxDecoration(color: color, shape: BoxShape.circle));
}

/// CLI 박스 — ╭─ 제목 ─╮ 처럼 테두리 위에 제목이 박힌 박스.
/// 터미널처럼 채움 없이 선만. 제목 색은 기본적으로 테두리 색 따라감.
class CliBox extends StatelessWidget {
  final String? title;
  final Color? borderColor;
  final Color? titleColor;
  final Widget child;
  const CliBox({
    this.title,
    this.borderColor,
    this.titleColor,
    required this.child,
    super.key,
  });

  @override
  Widget build(BuildContext context) => Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            width: double.infinity,
            margin: title != null ? const EdgeInsets.only(top: 8) : null,
            clipBehavior: Clip.antiAlias,
            decoration: BoxDecoration(
              border: Border.all(color: borderColor ?? C.border),
              borderRadius: BorderRadius.circular(6),
            ),
            child: child,
          ),
          if (title != null)
            Positioned(
              left: 12,
              top: 0,
              child: Container(
                color: C.bg, // 테두리를 끊고 제목이 올라앉음
                padding: const EdgeInsets.symmetric(horizontal: 6),
                child: Text(title!,
                    style: mono(
                        size: 11,
                        color: titleColor ?? borderColor ?? C.border)),
              ),
            ),
        ],
      );
}

/// 패널 박스 — CLI 박스 직사각 (제목 없는 곳용). 채움 없이 선만.
BoxDecoration panelDeco({double radius = 6}) => BoxDecoration(
      border: Border.all(color: C.line),
      borderRadius: BorderRadius.circular(radius),
    );

/// 빈 목록 안내 (.empty).
Widget emptyBox(String text) => Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 34),
      alignment: Alignment.center,
      child: Text.rich(
        TextSpan(children: [
          TextSpan(text: '✻ ', style: mono(size: 13, color: C.dimmer)),
          TextSpan(
              text: text, style: kr(size: 13, color: C.dimmer, height: 1.7)),
        ]),
        textAlign: TextAlign.center,
      ),
    );

/// 입력 필드 공통 데코 — CLI 프롬프트 박스.
InputDecoration inputDeco(String hint) => InputDecoration(
      hintText: hint,
      hintStyle: kr(size: 14, color: C.dimmer),
      filled: true,
      fillColor: C.bg,
      isDense: true,
      contentPadding:
          const EdgeInsets.symmetric(horizontal: 13, vertical: 13),
      enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(5),
          borderSide: BorderSide(color: C.border)),
      focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(5),
          borderSide: BorderSide(color: C.accent)),
    );

/// `❯ ` 프롬프트 입력 행 — Claude Code 입력창 그대로 (박스 없이 ❯ + 이탤릭 힌트).
Widget addRow({
  required TextEditingController controller,
  required FocusNode focusNode,
  required String hint,
  required String button,
  required VoidCallback onAdd,
}) =>
    Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(border: Border(bottom: BorderSide(color: C.line))),
      child: Row(children: [
        Text('❯ ',
            style: mono(size: 15, color: C.accent, weight: FontWeight.w700)),
        Expanded(
          child: TextField(
            controller: controller,
            focusNode: focusNode,
            maxLength: 120,
            style: kr(size: 15),
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: kr(size: 14, color: C.dimmer),
              border: InputBorder.none,
              isDense: true,
              counterText: '',
              contentPadding: const EdgeInsets.symmetric(vertical: 10),
            ),
            onSubmitted: (_) {
              onAdd();
              focusNode.requestFocus(); // 연속 입력 유지
            },
          ),
        ),
        const SizedBox(width: 8),
        GestureDetector(
          onTap: onAdd,
          child: MouseRegion(
            cursor: SystemMouseCursors.click,
            child: Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
              child: Text('⏎ $button', style: mono(size: 12, color: C.dimmer)),
            ),
          ),
        ),
      ]),
    );
