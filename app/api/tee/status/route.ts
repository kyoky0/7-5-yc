import { NextResponse } from "next/server";

// Simulated enclave boot time — set once on cold start
const BOOT_TIME = Date.now() - Math.floor(Math.random() * 3600_000 + 1800_000);

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const dynamic = "force-dynamic";

export async function GET() {
  const uptimeSeconds = Math.floor((Date.now() - BOOT_TIME) / 1000);
  const totalReviewed = randInt(120, 350);
  const blocked = randInt(2, 8);
  const passed = totalReviewed - blocked;
  const messagesRelayed = randInt(100, 500);
  const entriesCount = randInt(50, 200);

  const status = {
    status: "running",
    enclave: {
      id: "i-0a1b2c3d4e5f67890-enc-serendipity-v1",
      cpuCount: 2,
      memoryMiB: 4096,
      uptimeSeconds,
      lastAttestationMs: randInt(50, 200),
    },
    vsock: {
      cid: 16,
      port: 5000,
      connected: true,
      messagesRelayed,
    },
    kms: {
      region: "ap-northeast-1",
      attestedDecryptEnabled: true,
      lastDecryptLatencyMs: randInt(30, 80),
    },
    sealedLog: {
      entriesCount,
      sealedSizeBytes: entriesCount * randInt(180, 320),
      retrievable: false,
    },
    disclosureReviewer: {
      active: true,
      totalReviewed,
      blocked,
      passed,
    },
  };

  return NextResponse.json(status);
}
