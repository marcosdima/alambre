#!/usr/bin/env bash
set -euo pipefail

ARTIFACTS_DIR=".agents/artifacts"
SCREEN_FILE="${ARTIFACTS_DIR}/screen.png"
HIERARCHY_FILE="${ARTIFACTS_DIR}/hierarchy.xml"
MODE="${1:-}"

mkdir -p "${ARTIFACTS_DIR}"

DEVICE=$(adb devices | awk 'NR>1 && $2=="device" {print $1; exit}')
if [ -z "${DEVICE}" ]; then
  echo "Error: No active Android emulator/device found via adb." >&2
  exit 1
fi

if [ "${MODE}" = "--motion" ] || [ "${MODE}" = "--burst" ]; then
  FRAME_A="${ARTIFACTS_DIR}/frame_a.png"
  FRAME_B="${ARTIFACTS_DIR}/frame_b.png"
  
  echo "Capturing motion burst (frame A)..."
  adb -s "${DEVICE}" exec-out screencap -p > "${FRAME_A}"
  sleep 0.7
  echo "Capturing motion burst (frame B)..."
  adb -s "${DEVICE}" exec-out screencap -p > "${FRAME_B}"
  cp "${FRAME_B}" "${SCREEN_FILE}"
  
  DIFF_RESULT=$(python3 - << PYEOF
import sys
try:
    with open("${FRAME_A}", "rb") as fa, open("${FRAME_B}", "rb") as fb:
        da = fa.read()
        db = fb.read()
        if da == db:
            print("MOTION_RESULT: STATIC (Exact binary match, zero movement)")
        else:
            diff_bytes = sum(1 for a, b in zip(da, db) if a != b) + abs(len(da) - len(db))
            pct = (diff_bytes / max(len(da), len(db))) * 100
            print(f"MOTION_RESULT: ACTIVE_MOTION ({pct:.2f}% byte difference over 700ms)")
except Exception as e:
    print(f"MOTION_RESULT: UNKNOWN ({e})")
PYEOF
  )
  echo "${DIFF_RESULT}"
else
  adb -s "${DEVICE}" exec-out screencap -p > "${SCREEN_FILE}"
  echo "Screenshot captured: ${SCREEN_FILE}"
fi

# Dump UI hierarchy
if adb -s "${DEVICE}" shell uiautomator dump /sdcard/ui_dump.xml > /dev/null 2>&1; then
  adb -s "${DEVICE}" pull /sdcard/ui_dump.xml "${HIERARCHY_FILE}" > /dev/null 2>&1
  echo "UI hierarchy dumped: ${HIERARCHY_FILE}"
fi

echo "Capture complete."
