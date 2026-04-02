# Damastic Mobile

Damastic haydovchilari uchun Flutter mobil ilova qismi shu yerda saqlanadi.

## Repo holati

Bu papkada hozir quyidagilar bor:

- productionga yo'naltirilgan Flutter `lib/` kod bazasi
- login, asosiy, navbat, QR va profil ekranlari
- NestJS backend bilan ishlaydigan API client
- Socket.io realtime client
- iOS/Android native wrapperlarni generatsiya qiladigan bootstrap scriptlar

Bu papkada hozir quyidagilar yo'q:

- generatsiya qilingan `android/` wrapper
- generatsiya qilingan `ios/` wrapper

Sabab: joriy muhitda Flutter CLI o'rnatilmagan.

## Muhim fayllar

- `lib/app.dart`
- `lib/state/app_controller.dart`
- `lib/core/network/api_client.dart`
- `lib/core/network/socket_service.dart`
- `MOBILE_READINESS.md`
- `tool/bootstrap_mobile.ps1`
- `tool/bootstrap_mobile.sh`

## Native project wrapper yaratish

PowerShell:

```powershell
Set-Location apps/mobile
powershell -ExecutionPolicy Bypass -File .\tool\bootstrap_mobile.ps1
```

Bash:

```bash
cd apps/mobile
chmod +x ./tool/bootstrap_mobile.sh
./tool/bootstrap_mobile.sh
```

## Backend ulash

Android emulator uchun:

```bash
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000/api --dart-define=SOCKET_BASE_URL=http://10.0.2.2:4000/realtime
```

iOS simulator uchun:

```bash
flutter run --dart-define=API_BASE_URL=http://localhost:4000/api --dart-define=SOCKET_BASE_URL=http://localhost:4000/realtime
```

Real qurilmada `localhost` yoki `10.0.2.2` o'rniga serverning lokal IP manzilini kiriting.

## Xarita

`google_maps_flutter` dependency bor, lekin native API key konfiguratsiyasi platforma wrapperlari generatsiya qilingandan keyin beriladi.

## Real holat

Bu repo ichida Flutter mobil kodlari bor. Lekin joriy Windows muhitida Flutter SDK yo'qligi va `android/ios` host wrapperlari generatsiya qilinmagani sabab, iOS va Android buildlari shu yerning o'zida to'liq verifikatsiya qilinmagan.
