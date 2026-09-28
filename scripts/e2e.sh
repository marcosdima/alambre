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

clean_maestro_server() {
  if command -v adb >/dev/null 2>&1; then
    adb shell am force-stop dev.mobile.maestro dev.mobile.maestro.test >/dev/null 2>&1 || true
    sleep 0.5
  fi
}

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
