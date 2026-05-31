#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const deno = process.env.DENO_BIN ?? "deno";
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const script = join(root, "src", "pi-deno.ts");

const result = spawnSync(deno, ["run", "--allow-all", script, ...process.argv.slice(2)], {
  stdio: "inherit",
});

if (result.error) {
  console.error(`Failed to run Deno: ${result.error.message}`);
  console.error("Install Deno from https://deno.com/ or set DENO_BIN.");
  process.exit(1);
}

process.exit(result.status ?? 1);
