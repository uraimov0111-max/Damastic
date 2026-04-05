Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

function Get-LocalPropertyValue {
  param(
    [string]$Path,
    [string]$Name
  )

  if (-not (Test-Path $Path)) {
    return $null
  }

  $prefix = "$Name="

  foreach ($line in Get-Content $Path) {
    if ($line.StartsWith($prefix)) {
      return $line.Substring($prefix.Length).Replace('\\', '\')
    }
  }

  return $null
}

Write-Host "Damastic mobile doctor" -ForegroundColor Cyan

$flutter = Get-Command flutter -ErrorAction SilentlyContinue
$androidExists = Test-Path (Join-Path $projectRoot "android")
$iosExists = Test-Path (Join-Path $projectRoot "ios")
$localPropertiesPath = Join-Path $projectRoot "android\local.properties"
$sdkPath = Get-LocalPropertyValue -Path $localPropertiesPath -Name "sdk.dir"

if (-not $sdkPath) {
  $sdkPath = if ($env:ANDROID_SDK_ROOT) { $env:ANDROID_SDK_ROOT } else { $env:ANDROID_HOME }
}

$blockingWarning = $false

if ($flutter) {
  Write-Host "Flutter CLI: OK" -ForegroundColor Green
  Write-Host "Path: $($flutter.Source)"
}
else {
  Write-Warning "Flutter CLI topilmadi."
}

Write-Host "android/ wrapper: $([bool]$androidExists)"
Write-Host "ios/ wrapper: $([bool]$iosExists)"

if ($sdkPath) {
  Write-Host "Android SDK: $sdkPath"

  if (Test-Path $sdkPath) {
    $sdkDrive = (Get-Item $sdkPath).PSDrive
    $freeGb = [math]::Round($sdkDrive.Free / 1GB, 2)
    Write-Host "SDK disk free space: $($sdkDrive.Name): $freeGb GB"

    if ($freeGb -lt 5) {
      Write-Warning "Android SDK joylashgan diskda bo'sh joy juda kam. NDK o'rnatilishi va APK build muvaffaqiyatsiz tugashi mumkin."
      $blockingWarning = $true
    }

    $ndkRoot = Join-Path $sdkPath "ndk"
    if (Test-Path $ndkRoot) {
      $partialNdks = Get-ChildItem $ndkRoot -Directory | Where-Object {
        @(
          Get-ChildItem $_.FullName -Force |
            Where-Object { $_.Name -ne ".installer" }
        ).Count -eq 0
      }

      foreach ($partialNdk in $partialNdks) {
        Write-Warning "NDK qisman o'rnatilgan: $($partialNdk.Name). Shu versiyani Android Studio SDK Manager orqali qayta o'rnating."
        $blockingWarning = $true
      }
    }
  }
  else {
    Write-Warning "Android SDK path topildi, lekin papka mavjud emas."
    $blockingWarning = $true
  }
}
else {
  Write-Warning "Android SDK path aniqlanmadi."
  $blockingWarning = $true
}

if (-not $flutter) {
  Write-Host ""
  Write-Host "Keyingi qadam:" -ForegroundColor Yellow
  Write-Host "1. Flutter SDK o'rnating va PATH ga qo'shing."
  Write-Host "2. npm run mobile:bootstrap"
  exit 0
}

if (-not $androidExists -or -not $iosExists) {
  Write-Host ""
  Write-Host "Wrapperlar to'liq emas." -ForegroundColor Yellow
  Write-Host "Generatsiya uchun: npm run mobile:bootstrap"
  exit 0
}

Write-Host ""
if ($blockingWarning) {
  Write-Host "Muhit qisman tayyor. Android builddan oldin yuqoridagi ogohlantirishlarni hal qiling." -ForegroundColor Yellow
  exit 0
}

Write-Host "Muhit tayyor. Endi apps/mobile ichida flutter pub get va flutter run ishlatishingiz mumkin." -ForegroundColor Green
