#!/usr/bin/env bash
set -euo pipefail

QUERY="${1:-}"
if [ -z "${QUERY}" ]; then
  echo "Usage: ./scripts/ui-find.sh <text-to-find>"
  exit 1
fi

HIERARCHY_FILE=".agents/artifacts/hierarchy.xml"
if [ ! -f "${HIERARCHY_FILE}" ]; then
  echo "Error: ${HIERARCHY_FILE} not found. Run ./scripts/ui-capture.sh first." >&2
  exit 1
fi

python3 - << PYEOF
import re
import sys
import xml.etree.ElementTree as ET

query = """${QUERY}""".strip().lower()
tree = ET.parse("${HIERARCHY_FILE}")
root = tree.getroot()

matches = []
for node in root.iter("node"):
    desc = node.attrib.get("content-desc", "")
    text = node.attrib.get("text", "")
    bounds_str = node.attrib.get("bounds", "")
    
    if query in desc.lower() or query in text.lower():
        m = re.match(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", bounds_str)
        if m:
            x1, y1, x2, y2 = map(int, m.groups())
            cx = (x1 + x2) // 2
            cy = (y1 + y2) // 2
            matches.append((text or desc, desc, cx, cy, x1, y1, x2, y2))

if not matches:
    print(f"No elements found matching: {query}")
    sys.exit(0)

print(f"Matches for '{query}':")
for label, desc, cx, cy, x1, y1, x2, y2 in matches:
    extra = f" (desc: '{desc}')" if desc and desc != label else ""
    print(f"  - '{label}'{extra} -> center: ({cx}, {cy}) bounds: [{x1},{y1}][{x2},{y2}]")
PYEOF
