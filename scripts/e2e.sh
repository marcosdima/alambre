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

TARGET="${1:-apps/colguetti/e2e}"
"${MAESTRO_BIN}" test "${TARGET}"
