#!/usr/bin/env node
/**
 * Local development runner: starts the enclave in TCP mode and the parent
 * API server together, no Nitro hardware required.
 *
 * Usage: node scripts/dev-local.mjs
 */

import { spawn } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const env = {
  ...process.env,
  ENCLAVE_TRANSPORT: "tcp",
  ENCLAVE_PORT: "5005",
};

console.log("[dev] starting enclave (tcp-dev mode on :5005)");
const enclave = spawn("npx", ["tsx", "enclave/src/index.ts"], {
  cwd: root,
  env,
  stdio: "inherit",
});

await new Promise((r) => setTimeout(r, 1500));

console.log("[dev] starting parent API on :3001");
const parent = spawn("npx", ["tsx", "parent/src/index.ts"], {
  cwd: root,
  env: { ...env, PORT: "3001" },
  stdio: "inherit",
});

process.on("SIGINT", () => {
  enclave.kill();
  parent.kill();
  process.exit(0);
});
