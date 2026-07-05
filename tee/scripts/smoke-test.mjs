#!/usr/bin/env node
/**
 * Quick smoke test against a running parent API.
 *
 * Usage: node scripts/smoke-test.mjs [base-url]
 *   default base-url: http://localhost:3001
 */

const BASE = process.argv[2] ?? "http://localhost:3001";

async function test(name, fn) {
  try {
    await fn();
    console.log(`  PASS  ${name}`);
  } catch (err) {
    console.error(`  FAIL  ${name}: ${err.message}`);
    process.exitCode = 1;
  }
}

console.log(`\nSmoke testing ${BASE}/api/enclave\n`);

await test("POST /attest returns attested=true", async () => {
  const res = await fetch(`${BASE}/api/enclave/attest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const json = await res.json();
  if (!json.attested) throw new Error(`expected attested=true, got ${json.attested}`);
  if (json.teeType !== "aws-nitro-enclaves") throw new Error(`unexpected teeType: ${json.teeType}`);
  console.log(`    checks: ${json.checks.length} passed`);
});

await test("POST /match returns recommended meetings", async () => {
  const res = await fetch(`${BASE}/api/enclave/match`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId: "smoke-test-001" }),
  });
  const json = await res.json();
  if (!json.recommendedMeetings?.length) throw new Error("no recommended meetings");
  if (!json.sealedInternalLogRef) throw new Error("no sealed log ref");
  console.log(`    meetings: ${json.recommendedMeetings.length}`);
  console.log(`    disclosure: ${json.disclosureStatus}`);
  console.log(`    leakage risk: ${json.leakageRisk}`);
});

await test("GET /health returns ok", async () => {
  const res = await fetch(`${BASE}/api/enclave/health`);
  const json = await res.json();
  if (!json.ok) throw new Error("health check failed");
});

console.log("\nDone.\n");
