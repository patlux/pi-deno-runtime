# pi-deno-runtime

Run [Pi](https://github.com/earendil-works/pi-mono) under Deno.

This is an experimental Deno runtime launcher for `@earendil-works/pi-coding-agent`. It downloads Pi
from npm, applies a small Deno compatibility patch, caches the patched package locally, and runs the
Pi CLI with Deno.

## Install

Requires Deno 2.6+.

```bash
deno install -g -A -n pi-deno \
  https://raw.githubusercontent.com/patlux/pi-deno-runtime/main/src/pi-deno.ts
```

Then run:

```bash
pi-deno --version
pi-deno --help
```

The first run downloads and patches `@earendil-works/pi-coding-agent`.

## npm install

If you prefer npm as the installer:

```bash
npm install -g pi-deno-runtime
pi-deno --version
```

The npm package still requires `deno` to be installed and available on `PATH`.

## Pi version

Default Pi version:

```text
0.76.0
```

Override per run:

```bash
pi-deno --pi-version 0.76.0 --version
```

Or via env:

```bash
PI_DENO_PI_VERSION=0.76.0 pi-deno --version
```

## Cache

Patched Pi packages are cached in:

```text
$XDG_CACHE_HOME/pi-deno-runtime
```

or:

```text
~/.cache/pi-deno-runtime
```

Override:

```bash
PI_DENO_CACHE_DIR=/tmp/pi-deno-cache pi-deno --version
```

## What gets patched?

Pi does not officially support Deno. This launcher patches Pi's HTTP dispatcher so npm `undici` is
only loaded outside Deno.

Why: Deno already has native `fetch`, while npm `undici` currently fails under this Pi/Deno setup
with:

```text
TypeError: webidl.util.markAsUncloneable is not a function
```

The launcher also runs Pi with an import map that maps bare Node builtins like `url`, `fs`, and
`path` to `node:*` specifiers.

## Caveats

This is experimental.

Known risk areas:

- HTTP proxy behavior may differ from Node/Undici.
- Pi's HTTP idle timeout setting may not affect Deno `fetch` the same way.
- Provider/SDK edge cases may behave differently.
- Extensions that rely on Node-only APIs may fail.
- `pi install` / `pi update` need more testing.

Smoke-tested locally:

- `--version`
- `--help`
- `list`
- `--list-models`
- TUI startup
- real OpenAI-compatible provider call
- built-in tool call
- MCP tool search
- sessions / `--continue`

## Benchmarks

Local benchmark summary on macOS ARM:

- Bun canary was fastest for tiny startup.
- Deno won the heavier `--list-models` workload.
- Deno used less RAM than Bun in the tested Pi workloads.

See [`docs/benchmarks.md`](docs/benchmarks.md).

## Development

```bash
deno task check
deno task fmt
scripts/smoke.sh
```

## License

MIT
