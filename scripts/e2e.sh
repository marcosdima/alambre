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

has_device() {
  command -v adb >/dev/null 2>&1 && [ -n "$(adb devices | grep -v "List" | grep -v "^$" || true)" ]
}

prepare_device() {
  if has_device; then
    echo "==> [Maestro] Preparing Android test device (Turbo Mode)..."
    # Wake up device and unlock keyguard
    adb shell input keyevent 224 >/dev/null 2>&1 || true # KEYCODE_WAKEUP
    adb shell input keyevent 82 >/dev/null 2>&1 || true  # KEYCODE_MENU

    # Turbo Mode: Eliminate OS transition animations for instant UI responses (0ms)
    adb shell settings put global window_animation_scale 0 >/dev/null 2>&1 || true
    adb shell settings put global transition_animation_scale 0 >/dev/null 2>&1 || true
    adb shell settings put global animator_duration_scale 0 >/dev/null 2>&1 || true

    # Bypass Chrome First Run Experience so external URLs (Cafecito/GitHub) don't hang
    adb shell "echo 'chrome --disable-fre' > /data/local/tmp/chrome-command-line" >/dev/null 2>&1 || true

    # Pre-grant notification permission if Colguetti standalone package is installed
    adb shell pm grant com.alambre.colguetti android.permission.POST_NOTIFICATIONS >/dev/null 2>&1 || true
  fi
}

restore_device() {
  if has_device; then
    echo "==> [Maestro] Restoring Android animation scales..."
    adb shell settings put global window_animation_scale 1 >/dev/null 2>&1 || true
    adb shell settings put global transition_animation_scale 1 >/dev/null 2>&1 || true
    adb shell settings put global animator_duration_scale 1 >/dev/null 2>&1 || true
  fi
}

clean_maestro_server() {
  if command -v adb >/dev/null 2>&1; then
    adb shell am force-stop dev.mobile.maestro dev.mobile.maestro.test >/dev/null 2>&1 || true
    sleep 0.3
  fi
}

trap restore_device EXIT

show_help() {
  echo "Usage: ./scripts/e2e.sh [options | target]"
  echo ""
  echo "Targets & Shortcuts:"
  echo "  ./scripts/e2e.sh            Run all E2E flows in batch mode"
  echo "  ./scripts/e2e.sh smoke      Run smoke navigation flow"
  echo "  ./scripts/e2e.sh settings   Run settings flow"
  echo "  ./scripts/e2e.sh items      Run items & gestures flow"
  echo "  ./scripts/e2e.sh alarms     Run alarms flow"
  echo "  ./scripts/e2e.sh <path>     Run specific flow file or directory"
  echo ""
  echo "Options:"
  echo "  -t, --tag <tag>             Run flows matching tag (e.g. -t smoke)"
  echo "  -h, --help                  Show this help"
  exit 0
}

TARGET="apps/playground/e2e"
if [ ! -d "${TARGET}" ] && [ -d "apps/base-template/e2e" ]; then
  TARGET="apps/base-template/e2e"
fi
TAG=""

if [ $# -gt 0 ]; then
  case "$1" in
    -h|--help)
      show_help
      ;;
    -t|--tag)
      TAG="${2:-}"
      if [ -z "$TAG" ]; then
        echo "Error: --tag requires a tag name." >&2
        exit 1
      fi
      ;;
    *)
      if [ -f "apps/playground/e2e/${1}.yaml" ]; then
        TARGET="apps/playground/e2e/${1}.yaml"
      elif [ -f "apps/base-template/e2e/${1}.yaml" ]; then
        TARGET="apps/base-template/e2e/${1}.yaml"
      else
        TARGET="$1"
      fi
      ;;
  esac
fi

prepare_device
clean_maestro_server

echo "==> Running Maestro target: ${TARGET}${TAG:+ (tag: $TAG)}"

if [ -n "$TAG" ]; then
  "${MAESTRO_BIN}" test --include-tags="${TAG}" "${TARGET}"
elif [ -d "${TARGET}" ]; then
  # Batch mode: runs all flows continuously in a single session without cold restarts
  "${MAESTRO_BIN}" test "${TARGET}"
else
  "${MAESTRO_BIN}" test "${TARGET}"
fi
