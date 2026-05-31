# Compatibility notes

`pi-deno-runtime` is a compatibility launcher, not official Pi Deno support.

## Patch: Node builtins

Some Pi dependencies import Node builtins using bare specifiers, for example:

```js
import { fileURLToPath } from "url";
```

Deno expects explicit `node:*` specifiers for Node builtins. The launcher writes an import map that
maps common bare Node builtin names to `node:*`.

## Patch: undici

Pi configures Node HTTP behavior with npm `undici`:

```js
undici.setGlobalDispatcher(new undici.EnvHttpProxyAgent(...));
undici.install?.();
```

Under Deno this can crash while loading npm `undici`:

```text
TypeError: webidl.util.markAsUncloneable is not a function
```

The launcher patches Pi's `dist/core/http-dispatcher.js` so `undici` is loaded lazily and skipped
when `globalThis.Deno` exists.

## Possible regressions

This mainly affects HTTP/provider edge cases:

- `HTTP_PROXY`, `HTTPS_PROXY`, and `NO_PROXY` handling may differ.
- Proxy authentication may differ.
- Pi's HTTP idle timeout setting may not affect Deno `fetch`.
- Long-running SSE streams may have different timeout behavior.
- HTTP/2 negotiation may differ because Pi normally sets `allowH2: false` through Undici.
- Custom CA / TLS behavior may differ from Node.
- Provider SDKs that depend on Node-specific APIs may fail.
- Extensions with Node-only assumptions may fail.

Use the normal Node Pi runtime as a fallback if you hit one of these cases.
