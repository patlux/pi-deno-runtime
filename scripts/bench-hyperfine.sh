#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
DENO_BIN=${DENO_BIN:-deno}
PI_DENO="$DENO_BIN run --allow-all $ROOT/src/pi-deno.ts"

if ! command -v hyperfine >/dev/null 2>&1; then
  echo "hyperfine is required" >&2
  exit 1
fi

export DENO_NO_UPDATE_CHECK=1
export PI_SKIP_VERSION_CHECK=1

hyperfine --warmup 3 --runs "${RUNS:-20}" \
  -n deno "$PI_DENO --version" \
  -n deno-list-models "$PI_DENO --list-models"
