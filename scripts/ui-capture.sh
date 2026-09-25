#!/usr/bin/env bash
set -euo pipefail

# scripts/ui-capture.sh
# Deterministic emulator capture & hierarchy extraction for Antigravity agents.
# Eliminates the need for ad-hoc disposable Python scripts.

ARTIFACTS_DIR=".agents/artifacts"
SCREEN_FILE="${ARTIFACTS_DIR}/screen.png"
HIERARCHY_FILE="${ARTIFACTS_DIR}/hierarchy.xml"

mkdir -p "${ARTIFACTS_DIR}"

# 1. Verify ADB device is available
DEVICE=$(adb devices | awk 'NR>1 && $2=="device" {print $1; exit}')

if [ -z "${DEVICE}" ]; then
  echo "Error: No active Android emulator/device found via adb." >&2
  exit 1
fi

echo "Active device: ${DEVICE}"

# 2. Capture screenshot natively to PNG
adb -s "${DEVICE}" exec-out screencap -p > "${SCREEN_FILE}"
echo "Screenshot captured: ${SCREEN_FILE}"

# 3. Dump UI accessibility hierarchy XML (deterministic layout inspection)
if adb -s "${DEVICE}" shell uiautomator dump /sdcard/ui_dump.xml > /dev/null 2>&1; then
  adb -s "${DEVICE}" pull /sdcard/ui_dump.xml "${HIERARCHY_FILE}" > /dev/null 2>&1
  echo "UI hierarchy dumped: ${HIERARCHY_FILE}"
else
  echo "Warning: uiautomator dump was not available or timed out." >&2
fi

echo "Capture complete."
