# deploy-day v2 — Tauri 재작성 플랜

> v1(Flutter)에서 **데스크탑 멀티윈도우(바탕화면 포스트잇) 안정성 한계**에 부딪혀
> Tauri로 재설계. 토이 프로젝트라 출시 일정 압박 없음 — 제대로 만드는 게 목표.
>
> 최종 목표(불변): **멀티기기 동기화** (학원·회사·집 PC + 폰 = 4대).

---

## 0. 왜 Tauri인가 (의사결정 기록 = 면접 서사)

- **문제**: v1의 floating 포스트잇 메모 = `desktop_multi_window`가 메모 1장당
  Flutter 엔진을 띄움 → 엔진 레벨 access violation 크래시(0xc0000005).
  Flutter 공식 이슈(#138248 "두 번째 view 생성 시 크래시", #113220 "창 정리 안 됨)로도
  미해결인 구조적 결함. Dart로 못 막음.
- **핵심**: 데스크탑 멀티윈도우는 이 앱의 **핵심 UX**라 안정성 = 제품 가치.
- **선택**: Tauri는 창마다 무거운 엔진 대신 **OS 네이티브 웹뷰** 사용 → 멀티윈도우가
  가볍고 안정적. 번들도 수 MB (Electron Chromium ~150MB 대비).
- **대안 탈락 근거**:
  - Electron: 멀티윈도우 안정적이나 **모바일 불가** → 4대 동기화 목표 탈락.
  - .NET MAUI: 모바일 성숙도·Firebase 지원 약함.
- **한 줄 서사**: "Flutter로 먼저 만들었다가 핵심 기능의 안정성 한계를 데이터(크래시
  로그·공식 이슈)로 확인하고 Tauri로 재설계한 프로젝트."

---

## 1. 확정 스택

| 레이어 | 선택 | 근거 |
|---|---|---|
| 셸 | **Tauri 2** | 네이티브 멀티윈도우 안정 + 데스크탑/모바일 동시 커버 |
| 프론트 | **React + TypeScript** | 상태 복잡(메모·투두·프로젝트·릴리즈·튜토리얼)·생태계·Firebase 레퍼런스 풍부 |
| 빌드 | **Vite** | Tauri 기본, 빠른 HMR |
| 상태 | **Zustand** | 전역 스토어를 훅으로 가볍게. Redux는 이 규모에 과함. 창별 구독에 깔끔 |
| 스타일 | **순수 CSS** | 터미널 감성 단순 + HTML 원본 CSS 재활용. 의존성 0 |
| 저장(로컬) | **@tauri-apps/plugin-store** | shared_preferences 대응 키-값 JSON |
| 동기화(최종) | **Firebase JS SDK** | 데스크탑/모바일 한 SDK 통일 (FlutterFire보다 단순) |
| 트레이/자동시작/항상위 | Tauri 내장 + tauri-plugin-autostart | v1 desktop_shell 대응 |

- **Rust 최소**: 멀티윈도우·트레이·저장·항상위 전부 JS API. Rust는 커스텀 명령 필요 시만.
- 위치: `C:\dev\deploy-day-v2` (v1은 `C:\dev\deploy-day` 그대로 보존 — 참고·롤백용)

---

## 2. 아키텍처

### 멀티윈도우 (메모)
- 메모 1장 = Tauri `WebviewWindow` (borderless·always-on-top 토글·투명 옵션).
- 메인 ↔ 메모 통신: Tauri `emit`/`listen` 이벤트 (v1의 method channel IPC 대응).
- 저장 단일 주체: 메인이 plugin-store에 기록. 메모 창은 이벤트로 보고.
- **v1에서 고생한 것 = Tauri에선 공짜**: 창 생성/스타일/항상위/스냅이 네이티브라
  warm-up 프레임 레이스·SetWindowPos 크래시 같은 게 없음.
- 스냅(가장자리·메모끼리)·핀·7색·슬라이드: Tauri 창 API로 재구현 (로직은 v1 그대로 포팅).

### 모바일 (최종)
- 폰엔 멀티윈도우 개념 없음 → 메모는 **인앱 카드**로 렌더 (플랫폼 분기).
- 공유 React UI + `desktop ? FloatingMemo : InAppMemo` 조건 렌더.

### 동기화 (최종)
- 로컬 우선(plugin-store) + Firestore 백업/머지.
- Firebase Auth 구글 로그인: 데스크탑은 시스템 브라우저 OAuth + deep-link 복귀
  (tauri-plugin-deep-link), 모바일은 네이티브.
- 스키마: `users/{uid}/state` 에 앱 상태 JSON.

---

## 3. v1에서 가져올 자산 (코드 아님, 설계/데이터)

- [ ] **팔레트 hex** — 다크/라이트 + 메모 7색 (theme.dart → CSS 변수)
- [ ] **CLI 박스 감성** — 테두리 제목 박스, ❯ 프롬프트, status line 2줄
- [ ] **페르소나 텍스트** — Victor/Sunny/Sage 한국어 문구 (persona.dart 그대로 복사)
- [ ] **도메인 로직** — AppState: ship/streak/졸업/롤백/배포요일 (models.dart·app_state.dart → TS)
- [ ] **튜토리얼 플로우** — 6단계 코치마크 + 상태변화 감지
- [ ] **정책 문서** — 개인정보처리방침·이용약관·about·매뉴얼 (legal.dart)
- [ ] **아이콘** — assets/icon/app_icon_1080.png 그대로 재사용
- [ ] **HTML 원본** — deploy-day.html: 마크업/CSS 출발점

---

## 4. 진행 단계

### Phase A — 스캐폴딩 & 코어
- [ ] Tauri 2 + React-TS-Vite 프로젝트 생성 (`C:\dev\deploy-day-v2`)
- [ ] 팔레트·폰트(JetBrains Mono·Nanum Gothic Coding 번들)·CLI 컴포넌트
- [ ] AppState(Zustand) + plugin-store 영속화 — ship/streak/졸업 로직 포팅
- [ ] /sprint /backlog /changelog 탭 (단일 창에서 기능 패리티)

### Phase B — 데스크탑 셸 & 메모 (핵심 차별점)
- [ ] 트레이·자동시작·항상위(앱 전체)
- [ ] 메모 floating 창 (WebviewWindow) — 생성·핀·색·→commit
- [ ] 스냅(가장자리+메모끼리)·슬라이드 애니 재구현
- [ ] **안정성 검증**: 메모 다수 생성/닫기/재시작 반복 → 크래시 0 확인 (v1 실패 지점)

### Phase C — 마무리 & 출시
- [ ] /config (페르소나·테마·정책), 튜토리얼, 첫 실행 온보딩
- [~] MS Store: Tauri MSIX 빌드 + 파트너센터 (bibleSsul 경험 재활용) — **제출 완료, 심사 중 (2026-06-10)**, 통과 시 게시

### Phase D — 최종 목표: 동기화
- [ ] Firebase 프로젝트 + Auth(구글) + Firestore
- [ ] 로컬 ↔ 클라우드 동기화 레이어, 충돌 처리
- [ ] 모바일(Tauri 2 Android/iOS) 빌드 — 메모 인앱 분기

---

## 5. 리스크 / 미정

- Tauri 2 **모바일은 데스크탑보다 덜 성숙** (2024 안정화) — Phase D에서 체감 예정.
- 데스크탑 구글 OAuth 흐름(deep-link) — Phase D 검증 필요.
- v1은 그대로 보존. v2가 기능 패리티 + 안정성 입증할 때까지 폐기 안 함.

---

## 메모
- v1 위치: `C:\dev\deploy-day` (Flutter, 작동하지만 메모 크래시 잔존)
- v1 todo·진행기록: `C:\dev\deploy-day\todo.md`
- 면접 서사의 핵심은 "v1 실패 → 근거 있는 전환" — v1을 지우지 말 것.
