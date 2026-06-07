import 'package:flutter/material.dart';

import 'models.dart';

/// Claude Code CLI 팔레트 — 터미널 블랙 + Claude 오렌지.
/// 실제 Claude Code 스크린샷에서 뽑은 색. 박스는 채움 없이 선만 (터미널 감성).
abstract final class C {
  static const bg = Color(0xFF0C0C0C); // Windows Terminal 블랙
  static const panel = Color(0xFF111111); // 다이얼로그·토스트 등 떠있는 면만
  static const panel2 = Color(0xFF1A1A1A);
  static const border = Color(0xFF3A3A3A);
  static const line = Color(0xFF262626);
  static const txt = Color(0xFFECECEC);
  static const dim = Color(0xFF999999);
  static const dimmer = Color(0xFF5C5C5C);
  static const accent = Color(0xFFD97757); // Claude orange
  static const accent2 = Color(0xFFC15F3C); // crail (진한 오렌지)
  static const blue = Color(0xFF4FA3E8); // status line 모델명 블루
  static const pink = Color(0xFFE5549F); // ⏵⏵ bypass permissions 핑크
  static const magenta = Color(0xFFCC66CC); // 브랜치명 마젠타
  static const ship = Color(0xFF5DBE74); // 터미널 그린
  static const warn = Color(0xFFD9A33C); // 터미널 옐로
  static const rollback = Color(0xFFE25D56); // 터미널 레드
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
  Color color = C.dim,
  FontWeight weight = FontWeight.w400,
  double? spacing,
  double? height,
  bool italic = false,
}) =>
    TextStyle(
        fontFamily: 'JetBrains Mono',
        fontSize: size,
        color: color,
        fontWeight: weight,
        letterSpacing: spacing,
        height: height,
        fontStyle: italic ? FontStyle.italic : FontStyle.normal);

/// Nanum Gothic Coding — 한글도 고정폭으로 (풀 터미널 감성, 에셋 번들).
TextStyle kr({
  double size = 15,
  Color color = C.txt,
  FontWeight weight = FontWeight.w400,
  double? height,
}) =>
    TextStyle(
        fontFamily: 'Nanum Gothic Coding',
        fontSize: size,
        color: color,
        fontWeight: weight,
        height: height);

ThemeData buildTheme() => ThemeData(
      brightness: Brightness.dark,
      useMaterial3: true,
      scaffoldBackgroundColor: C.bg,
      colorScheme: const ColorScheme.dark(
          primary: C.accent, secondary: C.accent2, surface: C.panel),
      dialogTheme: const DialogThemeData(backgroundColor: C.panel),
      textSelectionTheme: const TextSelectionThemeData(cursorColor: C.accent),
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
          side: const BorderSide(color: C.border)),
      duration: const Duration(milliseconds: 2200),
      width: 380,
    ));
}

Future<bool> confirmDialog(BuildContext context, String msg,
    {String ok = '확인'}) async {
  final r = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      backgroundColor: C.panel,
      shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(6),
          side: const BorderSide(color: C.border)),
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
  final Color borderColor;
  final Color? titleColor;
  final Widget child;
  const CliBox({
    this.title,
    this.borderColor = C.border,
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
              border: Border.all(color: borderColor),
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
                    style: mono(size: 11, color: titleColor ?? borderColor)),
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
          borderSide: const BorderSide(color: C.border)),
      focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(5),
          borderSide: const BorderSide(color: C.accent)),
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
      decoration: const BoxDecoration(
          border: Border(bottom: BorderSide(color: C.line))),
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
