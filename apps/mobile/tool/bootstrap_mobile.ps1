Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

if (-not (Get-Command flutter -ErrorAction SilentlyContinue)) {
  throw "Flutter CLI topilmadi. Avval Flutter SDK o'rnating va PATH ga qo'shing."
}

Write-Host "Flutter host wrapperlar generatsiya qilinmoqda..." -ForegroundColor Cyan

try {
  flutter create . --platforms=android,ios --project-name damastic_mobile --org uz.damastic
}
catch {
  Write-Warning "android+ios generatsiya muvaffaqiyatsiz tugadi. Android wrapper generatsiyasi sinab ko'riladi."
  flutter create . --platforms=android --project-name damastic_mobile --org uz.damastic
  Write-Warning "iOS wrapperini macOS + Xcode muhitida shu papkada qayta generatsiya qiling."
}

flutter pub get

Write-Host "Bootstrap tugadi." -ForegroundColor Green
Write-Host "Android run uchun: flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000/api --dart-define=SOCKET_BASE_URL=http://10.0.2.2:4000/realtime"
Write-Host "iOS run uchun: flutter run --dart-define=API_BASE_URL=http://localhost:4000/api --dart-define=SOCKET_BASE_URL=http://localhost:4000/realtime"
