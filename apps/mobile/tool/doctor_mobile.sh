#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "Damastic mobile doctor"

if command -v flutter >/dev/null 2>&1; then
  echo "Flutter CLI: OK"
  echo "Path: $(command -v flutter)"
  HAS_FLUTTER=1
else
  echo "Flutter CLI topilmadi." >&2
  HAS_FLUTTER=0
fi

ANDROID_EXISTS=0
IOS_EXISTS=0

if [ -d "$PROJECT_ROOT/android" ]; then
  ANDROID_EXISTS=1
fi

if [ -d "$PROJECT_ROOT/ios" ]; then
  IOS_EXISTS=1
fi

echo "android/ wrapper: $ANDROID_EXISTS"
echo "ios/ wrapper: $IOS_EXISTS"

if [ "$HAS_FLUTTER" -eq 0 ]; then
  echo
  echo "Keyingi qadam:"
  echo "1. Flutter SDK o'rnating va PATH ga qo'shing."
  echo "2. npm run mobile:bootstrap"
  exit 0
fi

if [ "$ANDROID_EXISTS" -eq 0 ] || [ "$IOS_EXISTS" -eq 0 ]; then
  echo
  echo "Wrapperlar to'liq emas."
  echo "Generatsiya uchun: npm run mobile:bootstrap"
  exit 0
fi

echo
echo "Muhit tayyor. Endi apps/mobile ichida flutter pub get va flutter run ishlatishingiz mumkin."
