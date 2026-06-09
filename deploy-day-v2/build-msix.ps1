# deploy-day → MS Store MSIX 빌드 (unsigned; 업로드하면 Partner Center 가 서명함).
# 사용:  cd deploy-day-v2 ;  powershell -ExecutionPolicy Bypass -File .\build-msix.ps1
# 선행:  winget install Microsoft.WinAppCLI  (winapp CLI)
# 버전 올릴 때: package.json·tauri.conf.json·Cargo.toml 의 version + Package.appxmanifest 의
#              Identity Version(반드시 4자리 x.x.x.0) 을 함께 올릴 것.
$ErrorActionPreference = "Stop"
$v2  = $PSScriptRoot
$exe = "deploy-day-v2.exe"               # cargo bin 이름(productName 과 별개)
$icons = Join-Path $v2 "src-tauri\icons" # Tauri 가 생성한 MSIX 타일 에셋

# 1) 릴리즈 빌드 (tsc+vite + cargo release + NSIS/MSI 번들)
Push-Location $v2
npm run tauri build
Pop-Location

# 2) 패키지 레이아웃 구성 (exe + 앱 아이콘 + manifest)
$layout = Join-Path $v2 "msix-build"
Remove-Item $layout -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force (Join-Path $layout "Assets") | Out-Null
Copy-Item (Join-Path $v2 "src-tauri\target\release\$exe") (Join-Path $layout $exe)
foreach ($n in "Square44x44Logo","Square71x71Logo","Square150x150Logo","StoreLogo") {
  Copy-Item (Join-Path $icons "$n.png") (Join-Path $layout "Assets\$n.png")
}
Copy-Item (Join-Path $v2 "Package.appxmanifest") (Join-Path $layout "Package.appxmanifest")

# 3) MSIX 생성 (cert 미지정 = unsigned → 스토어 제출용)
$ver = ([xml](Get-Content (Join-Path $v2 "Package.appxmanifest"))).Package.Identity.Version
$dist = Join-Path $v2 "dist-msix"
New-Item -ItemType Directory -Force $dist | Out-Null
$out = Join-Path $dist "deploy-day_${ver}_x64.msix"
winapp package "$layout" --manifest (Join-Path $layout "Package.appxmanifest") --output $out
Write-Host "`n[OK] MSIX: $out"
Write-Host "    -> Partner Center(deploy-day 앱)에 이 .msix 업로드 (서명은 스토어가 함)"
