# deploy-day

> **매주 정해진 요일은 내 인생 배포일.**
> 인생을 소프트웨어처럼 운영하는 todo 앱 — 평일에 커밋을 쌓고, 배포일마다 내 인생의 새 버전을 배포한다.

Claude Code CLI 스타일의 터미널 감성 UI로 만든 데스크탑/모바일 앱.

## ⬇️ 다운로드 (Windows)

**[→ 최신 릴리즈에서 받기](https://github.com/jungwonil11-jpg/deploy-day/releases/latest)**

| 파일 | 설명 |
|------|------|
| `deploy-day_x.y.z_x64-setup.exe` | 설치 관리자 (권장) |
| `deploy-day_x.y.z_x64_en-US.msi` | MSI 패키지 |

> ⚠️ 서명되지 않은 빌드라 설치 시 **SmartScreen / Smart App Control** 경고가 뜰 수 있습니다.
> `추가 정보 → 실행`으로 진행하세요. (정식 서명은 MS Store 출시 시 적용 예정)
>
> 설치 파일 용량은 **~3MB** — 모든 데이터는 기기에만 저장되고 네트워크 전송이 없습니다.

---

## ⚠️ 현재 버전: v2 (Tauri) — [`deploy-day-v2/`](deploy-day-v2/)

이 프로젝트는 **Flutter(v1)로 먼저 만들었다가, Tauri(v2)로 재작성**했다.

**왜 갈아탔나:** v1의 핵심 기능인 *바탕화면 포스트잇(멀티윈도우)* 이
`desktop_multi_window` + Flutter 엔진 레벨에서 access violation 크래시(0xc0000005)를
일으켰다. Flutter 공식 이슈(#138248 등)로도 미해결인 구조적 결함이라 Dart로 막을 수 없었다.
멀티윈도우가 이 앱의 핵심 UX인 만큼, **"메모 여러 개 띄운 채 재시작 → 크래시 0"** 을
기준으로 Tauri(OS 네이티브 웹뷰, 창마다 무거운 엔진을 띄우지 않음)로 재설계했고,
그 시나리오를 통과시켰다.

| | v1 (Flutter) | v2 (Tauri) |
|---|---|---|
| 멀티윈도우 메모 | 크래시 ❌ | 안정 ✅ |
| 번들 크기 | — | 수 MB (Electron 대비 경량) |
| 데스크탑 + 모바일 | ✅ | ✅ (Tauri 2) |
| 상태 | archived (`deploy_day/`) | **현재 (`deploy-day-v2/`)** |

---

## 컨셉

할 일 관리에 소프트웨어 릴리즈 사이클을 그대로 가져왔다.

| 개발 용어 | 이 앱에서의 의미 |
|-----------|------------------|
| `commit` | 이번 주에 할 일 추가 |
| **deploy day** | 정해진 요일(기본 목요일) — 한 주 결산하고 버전 올리는 날 |
| `ship` | 완료한 일을 릴리즈 노트로 박제 |
| `rollback` | 못 끝낸 일은 다음 스프린트로 이월 |
| `streak` | 연속 배포 주차 — 빈손 배포면 0으로 리셋 |
| `SHIPPED` 🎓 | 끝까지 간 프로젝트 졸업 (명예의 전당행) |

## 기능 (v2)

- **`/sprint`** — 이번 주 할 일. 프로젝트별 분류(드래그 이동), 배포일에 `⏵⏵ ship` 활성화
- **`/backlog`** — 다음 버전 아이디어 메모, 스프린트로 pull
- **`/changelog`** — 인생 릴리즈 히스토리 + 졸업 프로젝트 명예의 전당
- **`/memo`** — 바탕화면 포스트잇 (별도 창, 항상 위 고정, 7색, 가장자리·메모끼리 자석 스냅 + 슬라이드 애니, →commit 으로 스프린트 전송)
- **`/config`** — 페르소나(Victor·Sunny·Sage 말투 전환)·다크/라이트·정책·백업
- **데스크탑 상주** — 트레이(X→트레이 숨김)·자동 시작·항상 위 고정
- 인터랙티브 튜토리얼(13단계 코치마크)·첫 실행 온보딩·이스터에그(Clawd)
- 배포일 D-day · streak · JSON 백업/복원

## 스택 (v2)

- **Tauri 2** + **React** + **TypeScript** + **Vite** + **Zustand** + 순수 CSS
- 로컬 저장: `@tauri-apps/plugin-store` (단일 JSON)
- 멀티윈도우: Tauri `WebviewWindow` (OS 네이티브, 메인=유일 writer + 이벤트 IPC)
- 트레이/자동시작/클립보드: Tauri tray-icon + `plugin-autostart` + `plugin-clipboard-manager`

## 실행 (v2)

```bash
cd deploy-day-v2
npm install
npm run tauri dev      # 개발
npm run tauri build    # 릴리즈 (Windows exe/MSIX)
```

> 사전 요구: Node, Rust(rustup), Visual Studio C++ 빌드 도구, WebView2(Win11 기본 내장).

## 로드맵

- [x] v1 (Flutter) — 로컬 기능 + 데스크탑 상주 + 포스트잇 *(멀티윈도우 안정성 한계로 종료)*
- [x] **v2 (Tauri)** — 기능 패리티 + 멀티윈도우 안정성 확보
- [ ] MS Store(MSIX) / Google Play(AAB) 출시
- [ ] Firebase Auth(구글 로그인) + Firestore — **멀티기기 동기화** (최종 목표)

---

> v1 소스는 `deploy_day/`에 보존(참고·전환 맥락용), 상세 진행 기록은 [`todo.md`](todo.md)·[`v2-plan.md`](v2-plan.md).
