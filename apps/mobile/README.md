# Damastic Mobile

Damastic haydovchilari uchun Flutter mobil ilova qismi shu yerda saqlanadi.

## Repo holati

Bu papkada hozir quyidagilar bor:

- productionga yo'naltirilgan Flutter `lib/` kod bazasi
- login, asosiy, navbat, QR va profil ekranlari
- NestJS backend bilan ishlaydigan API client
- Socket.io realtime client
- generatsiya qilingan `android/` wrapper
- generatsiya qilingan `ios/` wrapper
- iOS/Android native wrapperlarni generatsiya qiladigan bootstrap scriptlar
- mobil muhitni tekshiradigan doctor scriptlar

## Joriy verifikatsiya holati

- `flutter --version` va `flutter doctor -v` muvaffaqiyatli ishladi
- `npm run mobile:bootstrap` orqali `android/` va `ios/` wrapperlar yaratildi
- `flutter analyze` va `flutter test` muvaffaqiyatli o'tdi
- Android debug APK build NDK o'rnatilishi bosqichida environment sabab to'xtadi

Joriy bloklovchi sabab:

- Android SDK `C:` diskda joylashgan
- bu diskda bo'sh joy amalda qolmagan
- shu sabab Gradle kerakli NDK paketini to'liq o'rnata olmadi

## Muhim fayllar

- `lib/app.dart`
- `lib/state/app_controller.dart`
- `lib/core/network/api_client.dart`
- `lib/core/network/socket_service.dart`
- `MOBILE_READINESS.md`
- `tool/bootstrap_mobile.ps1`
- `tool/bootstrap_mobile.sh`

## Tezkor local oqim

Repo root'dan:

```powershell
npm run dev
npm run mobile:doctor
```

`npm run dev` ishga tushganda root Express demo API `http://localhost:4000/api` da Flutter uchun kerakli REST endpointlarni ham beradi.

Muhim cheklov:

- shu local demo backend REST oqimlar uchun yetarli
- realtime socket tekshiruvi hanuz `apps/backend` ichidagi NestJS backend bilan to'liq verifikatsiya qilinadi

## Native project wrapper yaratish

Repo root'dan:

```powershell
npm run mobile:bootstrap
```

Yoki to'g'ridan-to'g'ri `apps/mobile` ichidan:

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

Root demo backend bilan lokal ishlash uchun shu URLlar yetarli.

## Xarita

`google_maps_flutter` dependency bor, lekin native API key konfiguratsiyasi platforma wrapperlari generatsiya qilingandan keyin beriladi.

## Real holat

Bu repo ichida Flutter mobil kodlari bor, root demo backend mobil REST oqimlari bilan mos ishlaydi va host wrapperlar yaratildi. Hozirgi asosiy blocker kod emas: Android SDK joylashgan `C:` diskda bo'sh joy yo'qligi sabab NDK install bosqichi yiqilmoqda. iOS build esa baribir faqat macOS + Xcode muhitida yakuniy verifikatsiya qilinadi.
