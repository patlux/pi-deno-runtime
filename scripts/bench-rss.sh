#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
export DENO_NO_UPDATE_CHECK=1
export PI_SKIP_VERSION_CHECK=1
DENO_BIN=${DENO_BIN:-deno}

if [[ $(uname -s) == Darwin ]]; then
  /usr/bin/time -l "$DENO_BIN" run --allow-all "$ROOT/src/pi-deno.ts" --list-models
else
  /usr/bin/time -v "$DENO_BIN" run --allow-all "$ROOT/src/pi-deno.ts" --list-models
fi
