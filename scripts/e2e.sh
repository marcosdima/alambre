#!/usr/bin/env bash
set -euo pipefail

MAESTRO_BIN="${HOME}/.maestro/bin/maestro"
if [ ! -x "${MAESTRO_BIN}" ]; then
  if command -v maestro >/dev/null 2>&1; then
    MAESTRO_BIN="$(command -v maestro)"
  else
    echo "Error: Maestro not found at ${MAESTRO_BIN} or in PATH." >&2
    exit 1
  fi
fi

prepare_device() {
  if command -v adb >/dev/null 2>&1; then
    local devices
    devices="$(adb devices | grep -v "List" | grep -v "^$" || true)"
    if [ -n "${devices}" ]; then
      echo "==> Preparing Android test device..."
      # Wake up device and unlock keyguard
      adb shell input keyevent 224 >/dev/null 2>&1 || true # KEYCODE_WAKEUP
      adb shell input keyevent 82 >/dev/null 2>&1 || true  # KEYCODE_MENU

      # Bypass Chrome First Run Experience so external URLs (Cafecito/GitHub) don't hang
      adb shell "echo 'chrome --disable-fre' > /data/local/tmp/chrome-command-line" >/dev/null 2>&1 || true

      # Grant notification permission if Colguetti standalone package is installed
      adb shell pm grant com.alambre.colguetti android.permission.POST_NOTIFICATIONS >/dev/null 2>&1 || true
    fi
  fi
}

clean_maestro_server() {
  if command -v adb >/dev/null 2>&1; then
    adb shell am force-stop dev.mobile.maestro dev.mobile.maestro.test >/dev/null 2>&1 || true
    sleep 0.5
  fi
}

prepare_device

TARGET="${1:-apps/colguetti/e2e}"
if [ -d "${TARGET}" ]; then
  for flow in "${TARGET}"/*.yaml; do
    echo "=== Running Flow: ${flow} ==="
    clean_maestro_server
    "${MAESTRO_BIN}" test "${flow}"
  done
else
  clean_maestro_server
  "${MAESTRO_BIN}" test "${TARGET}"
fi
