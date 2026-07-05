import { CompanyId, AttackResult } from "./types";
import { getCompany } from "./secrets";
import { draftAttackResponse } from "./agents";
import { runPrivacyWall, getBudget, decrementBudget, summarizeFlagged } from "./privacyWall";
import { getLedger } from "./state";
import { remoteAttack, remoteUrlFor } from "./remoteAgents";

/**
 * Simulates a red-team probe: someone asks a Private Agent directly for its
 * secret. Direct probes cost 2 units of specificity budget (vs. 1 for normal
 * collaboration exchanges) — repeated targeted questioning burns the budget
 * faster, which is the mitigation for "ask enough slightly different
 * questions to reconstruct the secret piece by piece."
 *
 * Tries the company's own remote machine first (if configured); falls back to
 * in-process simulation if unreachable, same as the main collaboration flow.
 */
export async function attemptExtraction(companyId: CompanyId, question: string): Promise<AttackResult> {
  const ledger = getLedger();

  if (remoteUrlFor(companyId)) {
    try {
      const remote = await remoteAttack(companyId, question);
      if (remote) {
        const block = ledger.append({
          type: remote.verdict === "blocked" ? "blocked" : "safe_message",
          actor: companyId,
          summary: `red-team probe on ${companyId} (remote): "${question.slice(0, 60)}" -> ${remote.verdict}`,
          payload: { question, verdict: remote.verdict, reason: remote.reason ?? null },
        });
        return {
          mode: "remote",
          verdict: remote.verdict,
          flaggedSummary: remote.flaggedSummary,
          safeMessage: remote.safeMessage,
          reason: remote.reason,
          ledgerBlock: block,
        };
      }
    } catch {
      // fall through to local simulation below
    }
  }

  const company = getCompany(companyId);
  if (!company) throw new Error("unknown company");

  const draft = await draftAttackResponse(company, question);
  const wall = await runPrivacyWall({
    companyId,
    secretTerms: company.secretTerms,
    draft,
    budgetRemaining: getBudget(companyId),
  });

  decrementBudget(companyId, 2);

  const block = ledger.append({
    type: wall.verdict === "blocked" ? "blocked" : "safe_message",
    actor: companyId,
    summary: `red-team probe on ${companyId} (local): "${question.slice(0, 60)}" -> ${wall.verdict}`,
    payload: { question, verdict: wall.verdict, reason: wall.reason ?? null },
  });

  return {
    mode: "local",
    verdict: wall.verdict,
    draft: wall.draft,
    flagged: wall.flagged,
    flaggedSummary: summarizeFlagged(wall.flagged),
    safeMessage: wall.safeMessage,
    reason: wall.reason,
    ledgerBlock: block,
  };
}
