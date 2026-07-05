import type { LeakageRisk } from "@serendipity/common";
import { findPatternMatches } from "./blockedPatterns";
import { DEMO_SECRETS } from "../secrets/companySecrets";

const SAFE_FALLBACK =
  "Cross-industry analysis reveals unexpected synergies between participating companies. " +
  "Specific technical capabilities from unrelated industries map to shared challenges. " +
  "A joint exploration could unlock new markets without exposing proprietary details.";

const MIN_VERBATIM_MATCH_LENGTH = 40;

function findVerbatimSecretHits(text: string): string[] {
  const hits: string[] = [];
  for (const secret of Object.values(DEMO_SECRETS)) {
    for (const sentence of secret.split(/(?<=[.])\s+/)) {
      if (sentence.length >= MIN_VERBATIM_MATCH_LENGTH && text.includes(sentence)) {
        hits.push(sentence);
      }
    }
  }
  return hits;
}

export interface DisclosureReviewResult {
  approved: boolean;
  safeOutput: string;
  leakageRisk: LeakageRisk;
  blockedTerms: string[];
}

/**
 * Privacy Wall: converts candidate output into something safe to disclose
 * outside the enclave. Rule-based for auditability: every check is a plain
 * regex or substring match, not a model call.
 */
export function reviewDisclosure(raw: string): DisclosureReviewResult {
  const patternMatches = findPatternMatches(raw);
  const verbatimHits = findVerbatimSecretHits(raw);
  const blockedTerms = [...patternMatches.map((m) => m.term), ...verbatimHits];

  if (blockedTerms.length === 0) {
    return {
      approved: true,
      safeOutput: raw.trim(),
      leakageRisk: "Low",
      blockedTerms: [],
    };
  }

  const leakageRisk: LeakageRisk = blockedTerms.length >= 4 ? "High" : "Medium";

  return {
    approved: false,
    safeOutput: SAFE_FALLBACK,
    leakageRisk,
    blockedTerms,
  };
}
