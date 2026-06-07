# deploy-day TODO

> 인생 배포 todo 앱. 한 주 = 스프린트, 목요일(설정 가능) = 배포일.
>
> **🔀 2026-06-07 방향 전환: v2를 Tauri로 재작성하기로 결정.**
> v1(Flutter)의 데스크탑 멀티윈도우(floating 메모) 엔진 크래시가 구조적 결함이라
> Tauri로 갈아탐. 토이라 출시 일정 압박 없음 → 제대로 만드는 게 목표.
> **v2 상세 플랜: `v2-plan.md`** (스택·아키텍처·단계·면접 서사).
> 아래 v1 기록은 보존 — 참고·롤백·면접 서사("실패→전환")용.
>
> **최종 목표: 멀티기기 동기화** (학원·회사·집 PC + 폰 = 4대). v2 Phase D.

---

## 🚨 최우선 — 출시 블로커

- [x] **메모 복원 크래시** — 해결 (2026-06-07). 원인: makeStickyStyle의
      `SetWindowPos(SWP_FRAMECHANGED)`가 서브창 warm-up 프레임 콜스택 안에서
      실행돼 재진입 WM_PAINT로 엔진 raster가 깨짐. 시작 시 여러 메모 동시 복원이
      트리거. 수정: ①서브창 `_setupWindow`를 postFrame 후 150ms 더 지연(이벤트
      루프 다음 턴) ②메인 복원 스폰을 600ms 간격 순차화. 메모 4장 복원 검증 완료.

---

## 현재 상태 (2026-06-07)

- 플랫폼: Flutter — Windows / Android / Web
- 저장: **로컬만** (`shared_preferences`, 기기 1대). 동기화·로그인·네트워크 전부 없음
- 백업: export/import (JSON 클립보드 수동)
- 스택: Riverpod, 폰트 번들링(네트워크 0)

---

## Phase 1 — 로컬 기능 완성 ✅ (거의 끝)

- [x] Claude Code CLI 디자인 (터미널 블랙 + 오렌지)
- [x] 스프린트/백로그/체인지로그/메모 탭, 배포(ship)·streak·졸업
- [x] 데스크탑 상주 (트레이·자동시작·항상위)
- [x] 바탕화면 포스트잇 메모 (멀티윈도우)
- [x] 첫 실행 이름 온보딩
- [x] 배포 요일 설정 (드롭다운, 목요일 기본)
- [x] 프로젝트 색 팔레트 (터미널 톤)
- [x] /config 탭: 페르소나(Victor/Sunny/Sage)·about·정책문서
- [x] 커밋 수정 / 드래그 순서변경(완료·미완료 분리)
- [x] 프로젝트 이름 수정 / 드래그 순서변경
- [x] 라이트/다크 모드 (메모 창 포함)
- [x] 인터랙티브 튜토리얼 (코치마크 + 상태변화 감지)
- [x] 메모 색상 변경(7색, 테마별 기본) / 메모→커밋 연결 / pin 토글
- [x] 메모 자석 스냅 — 화면 가장자리 + 메모끼리 (40px) + 슬라이드 애니
- [x] 앱 아이콘 (픽셀 TODO)

### Phase 1 남은 버그
- [ ] **시작 시 메모 복원 크래시** — 열린 메모(`open:true`)를 복원할 때
      `SetWindowPos`(makeStickyStyle)에서 flaky crash로 앱 통째 종료.
      현재는 prefs에서 open 끄는 걸로 우회만 함. 멀티윈도우 warm-up 프레임
      레이스가 근본 원인. **출시 전 반드시 잡아야 함** (사용자 PC에서 터지면 치명적).
- [ ] 메모 색상/→commit 실기기 클릭 검증 (analyze·debug는 통과, 라이브 검증만 미완)

---

## ▶ 지금 트랙 — MS Store 출시 (로컬 Windows) ⬜

> Firebase·동기화 없이 로컬 버전 그대로 출시. 이게 현재 1순위.
> **출시 경험 있음**: bibleSsul(C:\dev\bible) 이미 MS Store 제출 → 승인 대기 중.
> 파트너센터 계정·MSIX 설정·정책 URL·심사 흐름 전부 재활용 가능.

- [ ] Phase 1 남은 버그 2개 먼저 정리 (특히 메모 복원 크래시 = 출시 블로커)
- [ ] MSIX 빌드 — bibleSsul `pubspec.yaml`의 msix 설정 참고해서 그대로 적용
      (identity name·publisher·아이콘·capabilities). MS Store 경유라 서명은 스토어가 함
- [ ] 파트너센터에 새 앱 등록 (계정은 이미 있음)
- [ ] 스토어 등록정보: 스크린샷, 설명, 카테고리, 연령등급(IARC)
- [ ] 개인정보처리방침 URL — "수집 0·네트워크 0"이라 심사 유리.
      bibleSsul과 동일 호스팅 방식 재사용
- [ ] 제출 → 심사

---

## Phase 2 — 멀티기기 동기화 (= 최종 목표, 나중에) ⬜

> 핵심: 로그인이 있어야 "이게 누구 데이터"인지 식별 가능 → Firebase 필요.

### 결정해야 할 것
- [ ] **로그인 방식**: 구글 로그인(진짜 멀티기기) vs 익명 로그인(제한적)
      → 멀티기기 목표면 **구글 로그인** 사실상 필수
- [ ] **동기화 모델**: 로컬 우선(오프라인 우선) + 클라우드 백업/머지
      → 지금 로컬 구조 유지하고 Firestore를 "위에 얹는" 방식 권장
- [ ] 충돌 처리: 기기 A·B 동시 수정 시 정책 (최신 우선? 머지?)

### 작업 항목
- [ ] FlutterFire CLI 설정 (`flutterfire configure`)
- [ ] Firebase 프로젝트 생성 (Spark 무료 플랜)
- [ ] Firebase Auth — 구글 로그인 (android/web/windows 각각)
- [ ] Firestore 스키마: `users/{uid}/state` 에 AppState JSON
- [ ] 로컬(shared_prefs) ↔ Firestore 양방향 동기화 레이어
- [ ] 로그인 UI (/config 에 "로그인하고 동기화" — 안 하면 지금처럼 로컬)
- [ ] Firestore 보안 규칙 (본인 데이터만 R/W)
- [ ] 보안 규칙·오프라인 캐시 테스트

### Phase 2의 부작용 (주의)
- [ ] 개인정보처리방침 갱신 — 구글 계정 정보 수집 → "수집 0" 깨짐.
      정책·스토어 심사 문구 다시 써야 함
- [ ] 정책 호스팅 URL 필요 (Play Store 요건) — GitHub Pages 후보

---

## Phase 3 — 출시 ⬜

- [ ] Android: AAB 빌드 + Play Console($25 1회) + 비공개테스트(12명×14일) 요건
- [ ] Windows: MS Store(MSIX, $19) — SAC 통과 위해 서명 필요
      (현재 미서명 → SAC 켜진 신품 PC에서 차단됨)
- [ ] Web: Firebase Hosting
- [ ] 개인정보처리방침/이용약관 호스팅 URL

---

## 메모 / 결정 기록

- 동기화 안 붙은 지금도 출시 가능 (로컬 버전 먼저 내고 Phase 2 후속 업데이트 가능)
- 단, **최종 목표가 멀티기기 동기화**이므로 Firebase는 "나중에 할 것"이지
  "안 할 것"이 아님. 로그인 없이는 동기화 불가 = 로그인은 동기화의 전제.
- export/import는 동기화 전까지의 임시 이전 수단.
