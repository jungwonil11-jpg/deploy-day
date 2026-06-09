# DESKTOP_RELEASE.md — deploy-day Windows / MS Store (MSIX) 출시 절차

> Tauri 앱을 MS Store(MSIX)로 올리는 절차. bibleSsul의 동명 문서 대응.
> **핵심 사실(2026-06 확인):** Tauri 2는 MSIX를 **기본 생성하지 않음** — `tauri build`는
> `setup.exe`(NSIS) + `.msi`(WiX)만 만든다. MS Store용 **MSIX는 Microsoft 공식 `winapp CLI`로 따로 패키징**한다.
> 출처: Microsoft Learn "Using winapp CLI with Tauri", Tauri v2 distribute/microsoft-store.

---

## 0. 현재 상태 / 산출물

- 빌드: `cd deploy-day-v2 && npm run tauri build` → `src-tauri/target/release/bundle/{nsis,msi}/`
- productName `deploy-day` · identifier `com.victor.deployday` · version(현재) `0.3.x`
- 정책 URL(호스팅): **GitHub Pages 켜면** `https://jungwonil11-jpg.github.io/deploy-day/privacy.html` · `/terms.html`
  (`docs/privacy.html`·`docs/terms.html` 이미 생성됨. repo Settings → Pages → Source `main /docs` 켜기)

## 1. 사전 작업 (한 번)

1. **WebView2**: Win11 내장. (구버전 Windows 대응이 필요하면 offline installer 옵션 — 지금은 Win11 타깃이라 생략 가능)
2. **winapp CLI 설치**: `winget install microsoft.winappcli --source winget`
3. **Partner Center에서 앱 이름 예약** → 두 값 확보 (bibleSsul 예: `VictorWorld.61314FB2ADE9D` / `CN=CF6591F8-...`):
   - **Identity Name** (예: `VictorWorld.deployday` 형식)
   - **Publisher** (`CN=...` GUID)
   - 이 두 값이 있어야 MSIX가 Store 등록과 매칭됨. **이거 받기 전엔 MSIX 빌드 의미 없음.**

## 2. MSIX 패키징 (winapp CLI)

```powershell
cd deploy-day-v2
winapp init
#  Package name   : deploy-day
#  Publisher name : (Partner Center Publisher 표시명)
#  Version        : 0.3.x.0   ← 반드시 4자리(x.x.x.0). Store는 4자리 요구
#  Entry point    : deploy-day.exe
#  Setup SDKs     : "Do not setup SDKs"  ← Tauri는 Rust windows 크레이트 사용
```
→ `Package.appxmanifest`(앱 identity 정의) + `Assets/`(스토어 아이콘) 생성됨.

`Package.appxmanifest` 편집 — Partner Center 값으로:
- `<Identity Name="..." Publisher="CN=..." Version="0.3.x.0" />`
- `<DisplayName>deploy-day</DisplayName>` (필요 시 한국어 스토어 표시명은 Partner Center listing에서 별도 지정)

`package.json`에 빌드 스크립트 추가(문서 기준):
```json
"pack:msix": "npm run tauri -- build && (if not exist dist mkdir dist) && copy /Y src-tauri\\target\\release\\deploy-day.exe dist\\ >nul && winapp pack .\\dist --cert .\\devcert.pfx"
```

로컬 테스트(자가서명):
```powershell
winapp cert generate --if-exists skip      # publisher가 manifest와 일치해야 함
npm run pack:msix                           # → deploy-day_0.3.x.0_x64.msix
winapp cert install .\devcert.pfx           # (관리자) 1회
Add-AppxPackage .\deploy-day_0.3.x.0_x64.msix
```

## 3. Store 제출

- **Store가 MSIX를 서명해줌 → 제출 전 코드서명 불필요.** 위에서 만든 MSIX(자가서명/미서명) 그대로 Partner Center 업로드.
- (선택) arm64도 지원하려면 아키텍처별 MSIX 따로.
- Partner Center 등록정보:
  - 이름: deploy-day (또는 한국어 표시명)
  - 카테고리: Productivity
  - **개인정보처리방침 URL**: `https://jungwonil11-jpg.github.io/deploy-day/privacy.html` (필수)
  - 연령등급: IARC 설문 → 전연령 (수집 0·네트워크 0·UGC 없음)
  - 스크린샷: 1920×1080 PNG 여러 장 (앱 실행본으로 촬영 — 미준비)
  - 가격: 무료 / 배포 지역

## 4. 버전 올릴 때

- `package.json`·`tauri.conf.json`·`Cargo.toml` version + `Package.appxmanifest`의 `Version`(x.x.x.0) **함께** 올림.
- 설치된 MSIX 갱신은 버전이 더 높아야 됨.

## 체크리스트

- [ ] winapp CLI 설치
- [ ] Partner Center 앱 이름 예약 → Identity Name·Publisher 확보
- [ ] GitHub Pages 켜기 (docs/ → 정책 URL 라이브 확인)
- [ ] `winapp init` + manifest에 Partner Center 값 기입
- [ ] `winapp pack` → MSIX 생성 + 로컬 설치 테스트
- [ ] 스크린샷 1920×1080 촬영
- [ ] Partner Center 제출 (정책 URL·연령등급·스샷)

> Android(Play)는 별도 트랙 — 현재 deploy-day는 Tauri Android 타깃 미초기화(`tauri android init` 안 됨).
> 데스크탑 출시 후 착수. 정책 URL은 위 GitHub Pages 그대로 재사용.
