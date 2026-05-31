#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
CACHE_DIR=${PI_DENO_CACHE_DIR:-"$ROOT/.tmp/smoke-cache"}

rm -rf "$CACHE_DIR"
mkdir -p "$CACHE_DIR"

export PI_DENO_CACHE_DIR="$CACHE_DIR"
export DENO_NO_UPDATE_CHECK=1
export PI_SKIP_VERSION_CHECK=1

DENO_BIN=${DENO_BIN:-deno}

run_pi() {
  "$DENO_BIN" run --allow-all "$ROOT/src/pi-deno.ts" "$@"
}

run_pi --version
PI_OFFLINE=1 run_pi --no-extensions --no-skills --no-context-files --help >/dev/null
PI_OFFLINE=1 run_pi list >/dev/null
PI_OFFLINE=1 run_pi --list-models >/dev/null

echo "smoke OK"
