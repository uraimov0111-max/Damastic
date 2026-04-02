#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

if ! command -v flutter >/dev/null 2>&1; then
  echo "Flutter CLI topilmadi. Avval Flutter SDK o'rnating." >&2
  exit 1
fi

echo "Flutter host wrapperlar generatsiya qilinmoqda..."

if ! flutter create . --platforms=android,ios --project-name damastic_mobile --org uz.damastic; then
  echo "android+ios generatsiya muvaffaqiyatsiz tugadi. Android wrapper generatsiyasi sinab ko'riladi." >&2
  flutter create . --platforms=android --project-name damastic_mobile --org uz.damastic
  echo "iOS wrapperini macOS + Xcode muhitida shu papkada qayta generatsiya qiling." >&2
fi

flutter pub get

echo "Bootstrap tugadi."
echo "Android run uchun: flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000/api --dart-define=SOCKET_BASE_URL=http://10.0.2.2:4000/realtime"
echo "iOS run uchun: flutter run --dart-define=API_BASE_URL=http://localhost:4000/api --dart-define=SOCKET_BASE_URL=http://localhost:4000/realtime"
