# deploy-day

> **매주 목요일은 내 인생 배포일.**
> 인생을 소프트웨어처럼 운영하는 todo 앱 — 평일에 커밋을 쌓고, 목요일마다 내 인생의 새 버전을 배포한다.

Claude Code CLI 스타일의 터미널 감성 UI로 만든 Flutter 데스크탑/모바일 앱.

## 컨셉

할 일 관리에 소프트웨어 릴리즈 사이클을 그대로 가져왔다.

| 개발 용어 | 이 앱에서의 의미 |
|-----------|------------------|
| `commit` | 이번 주에 할 일 추가 |
| **deploy day** | 매주 목요일 — 한 주 결산하고 버전 올리는 날 (v1.3 → v1.4) |
| `ship` | 완료한 일을 릴리즈 노트로 박제 |
| `rollback` | 못 끝낸 일은 다음 스프린트로 이월 |
| `streak` | 연속 배포 주차 — 빈손 배포면 0으로 리셋 |
| `SHIPPED` 🎓 | 끝까지 간 프로젝트 졸업 (명예의 전당행) |

## 기능

- **`/sprint`** — 이번 주 할 일. 프로젝트별 분류, 목요일에 `⏵⏵ ship` 버튼 활성화
- **`/backlog`** — 다음 버전 아이디어 메모, 스프린트로 pull
- **`/changelog`** — 내 인생 릴리즈 히스토리. 버전별 + / − 디프 형식
- **`/memo`** — 바탕화면 포스트잇 (Windows 전용)
  - 메모를 별도 창으로 띄워 항상 위에 고정
  - 위치·크기·내용 자동 저장, 앱 재시작 시 그 자리에 복원
- **데스크탑 상주** (Windows 전용)
  - 트레이 상주: 닫기(X)를 눌러도 트레이에서 대기
  - 윈도우 시작 시 자동 실행 (트레이 메뉴에서 토글)
  - 항상 위 고정 `[pin]`
- 배포일 D-day · streak 추적 · 배포 컨페티 · JSON 백업/복원

## 스택

- **Flutter** (Windows / Android / Web) + Riverpod
- 로컬 저장: `shared_preferences` — 단일 JSON 직렬화
- 멀티윈도우: `desktop_multi_window` + **win32 FFI 직접 호출**
  - 서브윈도우 엔진에는 플러그인이 등록되지 않으므로, 포스트잇의 frameless/TOPMOST/드래그는 `package:win32`로 직접 처리
- 트레이/자동시작: `tray_manager` · `launch_at_startup` · `window_manager`
- 폰트: JetBrains Mono + Nanum Gothic Coding (한글 고정폭)

## 실행

```bash
cd deploy_day
flutter pub get
flutter run -d windows   # 또는 -d chrome
```

> 네이티브 플러그인을 추가/제거한 뒤에는 반드시 `flutter clean` 후 빌드할 것.
> 빌드 캐시가 꼬이면 앱이 시작 직후 로그 없이 종료된다.

## 구조

```
deploy-day.html        # 원본 프로토타입 (단일 HTML, localStorage)
deploy_day/            # Flutter 재작성
  lib/
    theme.dart         # Claude Code CLI 스타일 테마 (오렌지 #D97757, CliBox)
    app_state.dart     # 앱 상태 + 비즈니스 로직 (Riverpod)
    desktop_shell.dart # 트레이 · 자동시작 · 항상 위
    memo/              # 바탕화면 포스트잇 (멀티윈도우 + win32 FFI)
    screens/ widgets/  # UI
```

## 로드맵

- [x] Phase 1 — 로컬 저장 기능 패리티 + 데스크탑 상주 + 포스트잇
- [ ] Phase 2 — Firebase Auth(구글 로그인) + Firestore 기기 간 동기화
- [ ] Phase 3 — Firebase Hosting(웹) + Play Store 배포
