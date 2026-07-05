import type { MatchResponse } from "@serendipity/common";
import { analyzeCompany } from "./companyAgents";
import { runMatchRoom } from "./matchRoom";
import { runConsensus } from "./consensusAgent";
import { reviewDisclosure } from "../disclosure/reviewDisclosure";
import { sealInternalLog } from "../sealedLog/sealedLog";
import { loadMeasurement } from "../attestation/measurement";
import type { CompanySecrets } from "../secrets/companySecrets";

/**
 * Runs the full Serendipity Cross-Industry Match pipeline inside the enclave:
 *
 * 1. Single-company analysis (each agent sees only its own company's secrets)
 * 2. Match room negotiation (all agents interact inside the enclave)
 * 3. Multi-agent consensus (Deal Analyst + Tech DD + Cross-Border)
 * 4. Privacy Wall review (Regex + LLM dual pass, fail-closed)
 * 5. Serendipity scoring (novelty + utility - similarity penalty)
 * 6. Sealed internal log (raw secrets never leave the enclave)
 * 7. Progressive disclosure output (L0 → L1 → L2 → L3)
 */
export function runMatchPipeline(sessionId: string, secrets: CompanySecrets): MatchResponse {
  const companyAnalyses = [
    analyzeCompany("megacorp", "MegaCorp Motors", secrets.megacorp),
    analyzeCompany("altai", "AltaiMaterials", secrets.altai),
    analyzeCompany("nanoshield", "NanoShield", secrets.nanoshield),
    analyzeCompany("biowrap", "BioWrap", secrets.biowrap),
  ];

  const room = runMatchRoom(secrets);
  const consensus = runConsensus(room.matchPairs);

  const draftReview = reviewDisclosure(room.internalRawTranscript);
  const finalReview = reviewDisclosure(draftReview.safeOutput);

  const sealedInternalLogRef = sealInternalLog(
    sessionId,
    [room.internalRawTranscript, `[Consensus] ${JSON.stringify(consensus)}`].join("\n"),
    draftReview
  );

  const measurement = loadMeasurement();

  return {
    companyAnalyses,
    matchRoom: room.finding,
    recommendedMeetings: room.recommendedMeetings,
    disclosureSafeOutput: finalReview.safeOutput,
    leakageRisk: finalReview.leakageRisk,
    disclosureStatus: finalReview.approved ? "Passed" : "Blocked",
    sealedInternalLogRef,
    teeType: "aws-nitro-enclaves",
    workloadMeasurement: measurement.workloadMeasurement,
  };
}
