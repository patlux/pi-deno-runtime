#!/usr/bin/env -S deno run --allow-all

const DEFAULT_PI_VERSION = "0.76.0";
const PACKAGE_NAME = "@earendil-works/pi-coding-agent";
const PATCH_MARKER = "pi-deno-runtime: skip undici under Deno";

async function main(): Promise<void> {
  const args = Deno.args;
  const version = readOption(args, "--pi-version") ?? Deno.env.get("PI_DENO_PI_VERSION") ??
    DEFAULT_PI_VERSION;
  const forwardedArgs = removeOption(args, "--pi-version");

  setDefaultEnv("DENO_NO_UPDATE_CHECK", "1");
  setDefaultEnv("PI_SKIP_VERSION_CHECK", "1");

  const root = await ensurePatchedPi(version);
  const configPath = `${root}/deno.json`;
  const importMapPath = `${root}/deno-import-map.json`;
  const cliPath = `${root}/node_modules/@earendil-works/pi-coding-agent/dist/cli.js`;

  const command = new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "--allow-all",
      "--config",
      configPath,
      "--node-modules-dir=manual",
      "--import-map",
      importMapPath,
      cliPath,
      ...forwardedArgs,
    ],
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });

  const status = await command.spawn().status;
  Deno.exit(status.code);
}

function readOption(args: readonly string[], name: string): string | undefined {
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === name) {
      return args[index + 1];
    }
    const prefix = `${name}=`;
    if (value.startsWith(prefix)) {
      return value.slice(prefix.length);
    }
  }
  return undefined;
}

function removeOption(args: readonly string[], name: string): string[] {
  const result: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === name) {
      index += 1;
      continue;
    }
    if (value.startsWith(`${name}=`)) {
      continue;
    }
    result.push(value);
  }
  return result;
}

async function ensurePatchedPi(version: string): Promise<string> {
  const root = `${cacheRoot()}/pi-coding-agent/${version}`;
  const cliPath = `${root}/node_modules/@earendil-works/pi-coding-agent/dist/cli.js`;
  const dispatcherPath =
    `${root}/node_modules/@earendil-works/pi-coding-agent/dist/core/http-dispatcher.js`;

  if (await exists(cliPath) && await isPatched(dispatcherPath)) {
    await writeDenoConfig(root);
    await writeImportMap(root);
    return root;
  }

  await Deno.remove(root, { recursive: true }).catch(ignoreNotFound);
  await Deno.mkdir(root, { recursive: true });
  await writeDenoConfig(root);

  const cache = new Deno.Command(Deno.execPath(), {
    args: [
      "cache",
      "--config",
      `${root}/deno.json`,
      "--node-modules-dir=auto",
      `npm:${PACKAGE_NAME}@${version}`,
    ],
    cwd: root,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });

  const status = await cache.spawn().status;
  if (!status.success) {
    throw new Error(`Failed to cache ${PACKAGE_NAME}@${version}`);
  }

  await patchHttpDispatcher(dispatcherPath);
  await writeImportMap(root);
  return root;
}

async function writeDenoConfig(root: string): Promise<void> {
  await Deno.writeTextFile(`${root}/deno.json`, "{}\n");
}

function cacheRoot(): string {
  const override = Deno.env.get("PI_DENO_CACHE_DIR");
  if (override && override.length > 0) {
    return override;
  }
  const xdgCache = Deno.env.get("XDG_CACHE_HOME");
  if (xdgCache && xdgCache.length > 0) {
    return `${xdgCache}/pi-deno-runtime`;
  }
  const home = Deno.env.get("HOME");
  if (home && home.length > 0) {
    return `${home}/.cache/pi-deno-runtime`;
  }
  return `${Deno.cwd()}/.pi-deno-runtime-cache`;
}

async function patchHttpDispatcher(path: string): Promise<void> {
  const original = await Deno.readTextFile(path);
  if (original.includes(PATCH_MARKER)) {
    return;
  }

  let patched = original.replace(
    'import * as undici from "undici";\n',
    'import { createRequire } from "node:module";\n',
  );

  const needle = `    undici.setGlobalDispatcher(new undici.EnvHttpProxyAgent({
        allowH2: false,
        bodyTimeout: normalizedTimeoutMs,
        headersTimeout: normalizedTimeoutMs,
    }));
    // Keep fetch and the dispatcher on the same undici implementation. Node 26.0's
    // bundled fetch can otherwise consume compressed responses through npm undici's
    // dispatcher without decompressing them, causing response.json() failures.
    undici.install?.();`;

  const replacement = `    // ${PATCH_MARKER}.
    if (typeof globalThis.Deno !== "undefined") {
        return;
    }
    const require = createRequire(import.meta.url);
    const undici = require("undici");
    undici.setGlobalDispatcher(new undici.EnvHttpProxyAgent({
        allowH2: false,
        bodyTimeout: normalizedTimeoutMs,
        headersTimeout: normalizedTimeoutMs,
    }));
    // Keep fetch and the dispatcher on the same undici implementation. Node 26.0's
    // bundled fetch can otherwise consume compressed responses through npm undici's
    // dispatcher without decompressing them, causing response.json() failures.
    undici.install?.();`;

  if (!patched.includes(needle)) {
    throw new Error(`Unsupported ${PACKAGE_NAME} layout: could not patch ${path}`);
  }

  patched = patched.replace(needle, replacement);
  await Deno.writeTextFile(path, patched);
}

async function writeImportMap(root: string): Promise<void> {
  await Deno.writeTextFile(
    `${root}/deno-import-map.json`,
    `${JSON.stringify({ imports: nodeBuiltinImports() }, null, 2)}\n`,
  );
}

function nodeBuiltinImports(): Record<string, string> {
  return {
    "assert": "node:assert",
    "assert/strict": "node:assert/strict",
    "async_hooks": "node:async_hooks",
    "buffer": "node:buffer",
    "child_process": "node:child_process",
    "cluster": "node:cluster",
    "console": "node:console",
    "constants": "node:constants",
    "crypto": "node:crypto",
    "dgram": "node:dgram",
    "diagnostics_channel": "node:diagnostics_channel",
    "dns": "node:dns",
    "dns/promises": "node:dns/promises",
    "domain": "node:domain",
    "events": "node:events",
    "fs": "node:fs",
    "fs/promises": "node:fs/promises",
    "http": "node:http",
    "http2": "node:http2",
    "https": "node:https",
    "inspector": "node:inspector",
    "inspector/promises": "node:inspector/promises",
    "module": "node:module",
    "net": "node:net",
    "os": "node:os",
    "path": "node:path",
    "path/posix": "node:path/posix",
    "path/win32": "node:path/win32",
    "perf_hooks": "node:perf_hooks",
    "process": "node:process",
    "punycode": "node:punycode",
    "querystring": "node:querystring",
    "readline": "node:readline",
    "readline/promises": "node:readline/promises",
    "stream": "node:stream",
    "stream/consumers": "node:stream/consumers",
    "stream/promises": "node:stream/promises",
    "stream/web": "node:stream/web",
    "string_decoder": "node:string_decoder",
    "timers": "node:timers",
    "timers/promises": "node:timers/promises",
    "tls": "node:tls",
    "tty": "node:tty",
    "url": "node:url",
    "util": "node:util",
    "util/types": "node:util/types",
    "v8": "node:v8",
    "vm": "node:vm",
    "wasi": "node:wasi",
    "worker_threads": "node:worker_threads",
    "zlib": "node:zlib",
  };
}

function setDefaultEnv(key: string, value: string): void {
  if (!Deno.env.get(key)) {
    Deno.env.set(key, value);
  }
}

async function exists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    }
    throw error;
  }
}

async function isPatched(path: string): Promise<boolean> {
  try {
    return (await Deno.readTextFile(path)).includes(PATCH_MARKER);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return false;
    }
    throw error;
  }
}

function ignoreNotFound(error: unknown): void {
  if (error instanceof Deno.errors.NotFound) {
    return;
  }
  throw error;
}

await main();
