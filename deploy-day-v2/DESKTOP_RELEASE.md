# DESKTOP_RELEASE.md — deploy-day MS Store(MSIX) 출시

> Tauri는 MSIX를 기본 생성 안 함 → Microsoft 공식 **winapp CLI** 로 패키징.
> MSIX는 **업로드하면 스토어가 서명** → 코드서명 인증서 불필요(무료).

## 상태 (2026-06-10)

- ✅ Partner Center 앱 생성: **deploy-day** (MSIX/PWA 타입)
- ✅ MSIX 빌드·검증 완료 → `dist-msix\deploy-day_0.3.9.0_x64.msix` (unsigned, 제출용)
- ✅ 정책 URL 라이브: `https://jungwonil11-jpg.github.io/deploy-day/privacy.html` · `/terms.html`
- ✅ 스크린샷(1920×1080) · 등록정보 입력 · **제출 완료**
- ⏳ **심사(인증) 중** — 통과하면 스토어에 게시(출시). 보통 1~3일.
- ⬜ 게시 후: README·GitHub 릴리즈 다운로드 링크를 스토어 페이지로 교체

## 식별자 (Partner Center → Product identity, manifest와 일치)

| 항목 | 값 |
|---|---|
| Package/Identity Name | `VictorWorld.deploy-day` |
| Publisher | `CN=CF6591F8-F079-415A-8986-CDDB16AA7981` |
| Publisher display name | `VictorWorld` |
| Store ID | `9NFVKM751187` |

## MSIX 빌드 (재현)

```powershell
winget install Microsoft.WinAppCLI          # 최초 1회
cd deploy-day-v2
powershell -ExecutionPolicy Bypass -File .\build-msix.ps1
# → dist-msix\deploy-day_<ver>_x64.msix
```
- `build-msix.ps1` = 릴리즈 빌드 → 레이아웃(exe+아이콘+manifest) → `winapp package`.
- **버전 올릴 때**: package.json·tauri.conf.json·Cargo.toml + `Package.appxmanifest` 의 `Identity Version`(4자리 x.x.x.0) 함께 올림.
- 에셋은 Tauri 생성분(`src-tauri/icons/Square*Logo.png`, `StoreLogo.png`) 재사용.
- ⚠️ unsigned라 **로컬 더블클릭 설치는 안 됨**(스토어가 서명). 동작 검증은 NSIS setup.exe로 — 같은 exe라 동일.

## Partner Center 제출

1. deploy-day 앱 → **패키지** → 위 `.msix` 업로드 (검증 통과 = 식별자 일치)
2. **속성**: 카테고리 = 생산성(Productivity)
3. **연령 등급(IARC 설문)**: 폭력·성적·욕설·도박·UGC·데이터수집 전부 **아니요** → 전체 이용가
4. **스토어 등록정보**(언어별):
   - 개인정보처리방침 URL: `https://jungwonil11-jpg.github.io/deploy-day/privacy.html`
   - 표시명: 한국어 = `인생을 배포` (이름 관리에서 추가 예약 필요) / 영어 = `deploy-day`
   - 설명·스크린샷: 아래 복붙용 참고
5. 가격: 무료 / 지역: 전체(또는 한국 우선)
6. 제출 → 심사(보통 1~3일)

---

## 스토어 등록정보 복붙용

**카테고리:** 생산성 / Productivity
**개인정보:** 수집 0 · 네트워크 0 · 완전 오프라인 (Data Safety: 데이터 수집/공유 "아니요")

### 한국어
- **이름:** 인생을 배포
- **짧은 설명:** 인생을 소프트웨어처럼 배포하는 todo 앱. 한 주=스프린트, 할 일=커밋, 매주 ship.
- **설명:**
```
인생을 소프트웨어처럼 운영하는 todo 앱입니다.

· 한 주가 하나의 스프린트
· 할 일은 커밋처럼 쌓고
· 정해진 요일(기본 목요일, 변경 가능)에 한 주를 ship
· 완료한 일은 릴리즈노트에 박제, 못한 일은 다음 주로 롤백
· 꾸준히 배포하면 streak이 쌓임

기능
· /sprint · /backlog · /changelog · 바탕화면 포스트잇 메모(항상 위)
· 데스크탑 상주(트레이·자동 시작) · 다크/라이트 · 한국어/영어
· 말투 페르소나 3종 · 파일 백업(export/import) · 인터랙티브 튜토리얼

모든 데이터는 기기에만 저장됩니다. 수집·전송·광고·추적 전혀 없음, 인터넷 없이 동작.
UI는 Claude Code CLI에 대한 오마주입니다.
```

### English
- **Name:** deploy-day
- **Short:** A todo app that ships your life like software. Week = sprint, tasks = commits, ship weekly.
- **Description:**
```
Run your life like software.

· One week is one sprint
· Stack tasks like commits
· Ship the week on a set day (Thursday by default, changeable)
· Done items go to release notes; unfinished ones roll over
· Keep shipping and your streak grows

Features
· /sprint · /backlog · /changelog · desktop sticky notes (always on top)
· system tray + autostart · dark/light · Korean/English
· 3 voice personas · file backup (export/import) · interactive tutorial

All data stays on your device. No collection, no network, no ads, no tracking — fully offline.
The UI is an homage to the Claude Code CLI.
```

### 스크린샷 (1920×1080 PNG, 앱 실행본으로 — 제출 완료)
추천 컷: /sprint(커밋 목록) · /changelog · 메모 포스트잇 · 튜토리얼 · /config(테마/언어)

---

> Android(Play)는 별도 트랙 — Tauri Android 타깃 미초기화. 데스크탑 출시 후. 정책 URL은 그대로 재사용.
