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
- `android/` va `ios/` host wrapperlari generatsiya qilindi.
- Backend kontraktlari bilan ishlaydigan servislar yozilgan.
- Google Maps widget ulash uchun kod qo'shilgan.
- Queue, payment va realtime oqimlari uchun foundation mavjud.
- Root Express demo backend Flutter REST oqimi uchun moslashtirilgan.
- `flutter analyze` va `flutter test` muvaffaqiyatli o'tdi.

## Nima hali environmentga bog'liq

- Android debug APK build uchun Gradle NDK paketini o'rnatishi kerak.
- Android SDK `C:` diskda joylashgan va u yerda bo'sh joy qolmagani sabab NDK install yiqilmoqda.
- iOS build faqat macOS + Xcode muhitida yakuniy verifikatsiya qilinadi.
- Google Maps uchun Android va iOS native API key konfiguratsiyasi hali berilmagan.

## Joriy xulosa

Mobil kod bazasi Flutter 3.41 bilan statik tekshiruvdan o'tdi va host wrapperlar yaratildi. Android builddagi joriy blocker repository ichida emas, balki lokal Android SDK storage holatida.

## To'liq iOS va Android project wrapperlarini yaratish

Repo root'dan:

```powershell
npm run mobile:doctor
npm run mobile:bootstrap
```

Yoki `apps/mobile` ichidan:

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

Izoh:

- `http://localhost:4000/api` dagi root demo backend login, route, queue, profile va payment REST oqimlarini lokal sinash uchun yetarli
- realtime socket oqimlarini to'liq tekshirish uchun `apps/backend` dagi NestJS backend kerak bo'ladi
- Android APK build uchun Android SDK joylashgan diskda kamida bir necha GB bo'sh joy bo'lishi kerak
