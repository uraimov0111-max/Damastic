# Mobile Readiness

## Hozirgi holat

`apps/mobile` ichida Damastic uchun Flutter/Dart ilova kodi bor:

- login
- asosiy ekran
- navbat oynasi
- QR oynasi
- profil oynasi
- backend API client
- Socket.io realtime client
- app state va model qatlamlari

## Nima tayyor

- `lib/` ichida iOS va Android uchun umumiy Flutter ilova kodi tayyor.
- Backend kontraktlari bilan ishlaydigan servislar yozilgan.
- Google Maps widget ulash uchun kod qo'shilgan.
- Queue, payment va realtime oqimlari uchun foundation mavjud.

## Nima hali environmentga bog'liq

- `android/` va `ios/` native project wrapper fayllari repo ichida generatsiya qilinmagan.
- Bu muhitda Flutter SDK o'rnatilmagan, shu sabab `flutter create`, `flutter pub get` va `flutter run` bu yerda ishlatilmadi.
- iOS build faqat macOS + Xcode muhitida yakuniy verifikatsiya qilinadi.
- Google Maps uchun Android va iOS native API key konfiguratsiyasi hali berilmagan.

## Nega native wrapperlar commit qilinmadi

`android/` va `ios/` papkalardagi fayllar Flutter SDK versiyasiga bog'liq generatsiya qilingan host wrapperlardir. Bu muhitda Flutter yo'q bo'lgani uchun ularni ishonchli generatsiya qilib tekshirishning iloji bo'lmadi.

Shuning uchun repo ichiga qo'shilgan eng to'g'ri yechim:

- to'liq `lib/` mobil kod bazasi
- platformalarni avtomatik yaratadigan bootstrap scriptlar
- iOS/Android setup hujjati

## To'liq iOS va Android project wrapperlarini yaratish

Windows PowerShell:

```powershell
Set-Location apps/mobile
powershell -ExecutionPolicy Bypass -File .\tool\bootstrap_mobile.ps1
```

macOS/Linux:

```bash
cd apps/mobile
chmod +x ./tool/bootstrap_mobile.sh
./tool/bootstrap_mobile.sh
```

## Build tekshiruvi

Android:

```bash
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000/api --dart-define=SOCKET_BASE_URL=http://10.0.2.2:4000/realtime
```

iOS:

```bash
flutter pub get
flutter run --dart-define=API_BASE_URL=http://localhost:4000/api --dart-define=SOCKET_BASE_URL=http://localhost:4000/realtime
```

Real qurilmada `localhost` o'rniga backend serverning LAN IP manzilini bering.
