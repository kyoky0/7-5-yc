import crypto from "node:crypto";
import type { DisclosureReviewResult } from "../disclosure/reviewDisclosure";

interface SealedLogEntry {
  raw: string;
  review: DisclosureReviewResult;
  createdAt: string;
}

/**
 * In-memory store for full internal discussion transcripts (raw secrets,
 * agent-to-agent reasoning, the pre-review draft). Deliberately has no
 * exported getter -- there is no code path that returns an entry's contents
 * outside the enclave process. A caller only receives the opaque `ref`.
 */
const store = new Map<string, SealedLogEntry>();

export function sealInternalLog(sessionId: string, raw: string, review: DisclosureReviewResult): string {
  const digest = crypto.createHash("sha256").update(raw).digest("hex").slice(0, 12);
  const ref = `sealed_log_${sessionId}_${digest}`;
  store.set(ref, { raw, review, createdAt: new Date().toISOString() });
  return ref;
}
