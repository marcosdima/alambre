#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-}"
if [ -z "$TARGET" ]; then
  echo "Usage: $0 <text-or-accessibility-label>" >&2
  exit 1
fi

DEVICE=$(adb devices | awk 'NR>1 && $2=="device" {print $1; exit}')
if [ -z "${DEVICE}" ]; then
  echo "Error: No active Android emulator/device found via adb." >&2
  exit 1
fi

ARTIFACTS_DIR=".agents/artifacts"
HIERARCHY_FILE="${ARTIFACTS_DIR}/hierarchy.xml"
mkdir -p "${ARTIFACTS_DIR}"

# Dump latest UI hierarchy
adb -s "${DEVICE}" shell uiautomator dump /sdcard/ui_dump.xml > /dev/null 2>&1
adb -s "${DEVICE}" pull /sdcard/ui_dump.xml "${HIERARCHY_FILE}" > /dev/null 2>&1

# Find coordinates using Python
COORDS=$(python3 - << PYEOF
import xml.etree.ElementTree as ET
import re
import sys

target = """${TARGET}""".strip().lower()
tree = ET.parse("${HIERARCHY_FILE}")
root = tree.getroot()

found_bounds = None
for node in root.iter('node'):
    text = (node.attrib.get('text') or '').lower()
    desc = (node.attrib.get('content-desc') or '').lower()
    res = (node.attrib.get('resource-id') or '').lower()
    
    if target in text or target in desc or target in res:
        bounds_str = node.attrib.get('bounds')
        if bounds_str:
            found_bounds = bounds_str
            # Prefer exact match if possible
            if target == text or target == desc:
                break

if not found_bounds:
    sys.exit(1)

m = re.findall(r'\[(\d+),(\d+)\]', found_bounds)
if len(m) >= 2:
    x1, y1 = int(m[0][0]), int(m[0][1])
    x2, y2 = int(m[1][0]), int(m[1][1])
    cx = (x1 + x2) // 2
    cy = (y1 + y2) // 2
    print(f"{cx} {cy}")
else:
    sys.exit(1)
PYEOF
) || true

if [ -z "${COORDS}" ]; then
  echo "Error: Element matching '${TARGET}' not found in current UI hierarchy." >&2
  exit 1
fi

echo "Tapping '${TARGET}' at coordinates: ${COORDS}"
adb -s "${DEVICE}" shell input tap ${COORDS}
