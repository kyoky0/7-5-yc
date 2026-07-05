import { COMPANIES } from "./secrets";
import { runPrivacyWall, getBudget, decrementBudget, summarizeFlagged } from "./privacyWall";
import { draftInitialContribution, draftFollowUp, critique, synthesizeFinalProposal } from "./agents";
import { computeMatching } from "./matching";
import { getLedger } from "./state";
import { remoteDraft, remoteUrlFor } from "./remoteAgents";
import { Company, CompanyId, FlaggedSummary, PairScore, RunResult, TimelineEvent, WallVerdict } from "./types";
import { Ledger } from "./ledger";
import { initializeDisclosures, setMatchExists } from "./disclosure";

const CHALLENGE = "Discover matches between enterprise technology needs and hidden capabilities of cross-industry startups — without disclosing any confidential information. Propose serendipitous combinations that would never be found through Google search.";

let counter = 0;
function eid() {
  return `ev-${Date.now()}-${counter++}`;
}

interface RoundOutcome {
  verdict: WallVerdict;
  safeMessage: string | null;
  reason?: string;
  mode: "local" | "remote";
}

/**
 * Tries the company's OWN machine first (if AGENT_URL_<ID> is configured) — in that
 * case the draft, the abstraction, and the raw flagged secret text all happen over
 * there, and only a category/count summary + the safe message travel back over the
 * network. Falls back to in-process simulation (today's single-laptop mode) if no
 * remote is configured, or if the remote machine is unreachable — so a Wi-Fi drop
 * mid-demo degrades gracefully instead of breaking the show.
 */
async function runCompanyRound(
  company: Company,
  round: 1 | 2,
  othersSafeMessages: { name: string; text: string }[],
  events: TimelineEvent[],
  ledger: Ledger,
): Promise<RoundOutcome> {
  const remoteConfigured = !!remoteUrlFor(company.id);

  if (remoteConfigured) {
    try {
      const remote = await remoteDraft(company.id, round, CHALLENGE, othersSafeMessages);
      if (remote) {
        events.push({
          id: eid(),
          type: "draft",
          actor: company.id,
          mode: "remote",
          title: `${company.name}: Draft created and inspected on this company's own machine (not transmitted)`,
          detail: "Raw draft text never traversed the network.",
        });
        emitWallEvents(company.id, remote.verdict, remote.flaggedSummary, undefined, remote.safeMessage, remote.reason, "remote", events, ledger, round);
        return { verdict: remote.verdict, safeMessage: remote.safeMessage, reason: remote.reason, mode: "remote" };
      }
    } catch {
      events.push({
        id: eid(),
        type: "log",
        actor: company.id,
        title: `Warning: Could not connect to ${company.name}'s remote machine — falling back to local TEE simulation`,
      });
    }
  }

  // Local in-process simulation (single-laptop demo mode).
  const draft = round === 1 ? await draftInitialContribution(company, CHALLENGE) : await draftFollowUp(company, CHALLENGE, othersSafeMessages);
  events.push({
    id: eid(),
    type: "draft",
    actor: company.id,
    mode: "local",
    title: round === 1 ? `${company.name}: Creating internal draft` : `${company.name}: Revising based on other companies' safe messages`,
    draft,
  });

  const wall = await runPrivacyWall({ companyId: company.id, secretTerms: company.secretTerms, draft, budgetRemaining: getBudget(company.id) });
  if (wall.flagged.length > 0) decrementBudget(company.id, 1);

  emitWallEvents(company.id, wall.verdict, summarizeFlagged(wall.flagged), wall.flagged, wall.safeMessage, wall.reason, "local", events, ledger, round);
  return { verdict: wall.verdict, safeMessage: wall.safeMessage, reason: wall.reason, mode: "local" };
}

function emitWallEvents(
  companyId: CompanyId,
  verdict: WallVerdict,
  flaggedSummary: FlaggedSummary[],
  flagged: TimelineEvent["flagged"],
  safeMessage: string | null,
  reason: string | undefined,
  mode: "local" | "remote",
  events: TimelineEvent[],
  ledger: Ledger,
  round: 1 | 2,
) {
  const totalFlagged = flagged ? flagged.length : flaggedSummary.reduce((s, f) => s + f.count, 0);
  if (totalFlagged > 0) {
    events.push({
      id: eid(),
      type: "wall_flag",
      actor: companyId,
      mode,
      title: `Privacy Wall: ${totalFlagged} sensitive element(s) detected`,
      detail: flaggedSummary.map((f) => `${f.category} x${f.count}`).join(" / "),
      flagged,
      flaggedSummary,
    });
  }

  if (verdict === "blocked") {
    events.push({ id: eid(), type: "wall_block", actor: companyId, mode, title: "Privacy Wall: Message BLOCKED", detail: reason });
    const block = ledger.append({ type: "blocked", actor: companyId, summary: `blocked draft from ${companyId} (${mode})`, payload: { reason } });
    events.push({ id: eid(), type: "log", actor: "system", title: "Recorded to audit log", ledgerBlock: block });
    return;
  }

  events.push({
    id: eid(),
    type: verdict === "redacted" ? "wall_redact" : "safe_message",
    actor: companyId,
    mode,
    title: verdict === "redacted" ? "Privacy Wall: Abstracted to safe form" : "Privacy Wall: No sensitive content — passed through",
    safeMessage: safeMessage ?? undefined,
  });

  const block = ledger.append({
    type: "safe_message",
    actor: companyId,
    summary: `${companyId} shared a safe message (round ${round}, ${mode})`,
    payload: { safeMessage },
  });
  events.push({ id: eid(), type: "log", actor: "system", title: "Recorded to audit log (hash chain)", ledgerBlock: block });
}

/**
 * Runs the full collaboration scenario end-to-end, server-side, and returns an
 * ordered list of events for the client to replay with pacing. The orchestrator
 * itself only ever touches Company metadata (name/id/tags) directly — per-company
 * secret drafting either happens on that company's own remote machine, or (fallback)
 * in-process via lib/agents.ts, but this function never reads `.secretDossier` itself.
 */
export async function runScenario(): Promise<RunResult> {
  const ledger = getLedger();
  const events: TimelineEvent[] = [];
  const safeByCompany: Record<string, string> = {};

  events.push({ id: eid(), type: "log", actor: "system", title: "Collaboration challenge received", detail: CHALLENGE });

  // Round 1: each company drafts independently
  for (const company of COMPANIES) {
    const outcome = await runCompanyRound(company, 1, [], events, ledger);
    if (outcome.verdict !== "blocked") safeByCompany[company.id] = outcome.safeMessage ?? "";
  }

  // Cross-matching: enterprise needs × startup capabilities
  const { matching, pairScores } = computeMatching();
  events.push({ id: eid(), type: "matching", actor: "system", title: "Capability Matching: Complementary relationships detected without seeing secrets", detail: matching.explanation });

  // Initialize progressive disclosure and escalate matched pairs to Level 1
  initializeDisclosures();
  for (const pair of pairScores) {
    const entCompany = COMPANIES.find((c) => c.id === pair.enterprise);
    const suCompany = COMPANIES.find((c) => c.id === pair.startup);
    if (entCompany && suCompany) {
      setMatchExists(
        pair.enterprise,
        pair.startup,
        pair.matchReason,
        `${entCompany.industry} needs complementary technology`,
        suCompany.country,
      );
    }
  }

  // Serendipity events for top matches
  for (const pair of pairScores) {
    const entCompany = COMPANIES.find((c) => c.id === pair.enterprise);
    const suCompany = COMPANIES.find((c) => c.id === pair.startup);
    if (entCompany && suCompany) {
      events.push({
        id: eid(),
        type: "serendipity",
        actor: "system",
        title: `Serendipity Detected: ${entCompany.name} x ${suCompany.name}`,
        detail: pair.matchReason,
        serendipityScore: pair.serendipityScore,
      });
    }
  }

  // Round 2: each company refines based on others' safe messages
  for (const company of COMPANIES) {
    const others = COMPANIES.filter((c) => c.id !== company.id).map((c) => ({ name: c.name, text: safeByCompany[c.id] ?? "" }));
    const outcome = await runCompanyRound(company, 2, others, events, ledger);
    if (outcome.verdict !== "blocked") safeByCompany[company.id] = outcome.safeMessage ?? safeByCompany[company.id];
  }

  // Critique and final synthesis
  const safeMessagesList = COMPANIES.map((c) => ({ name: c.name, text: safeByCompany[c.id] ?? "" }));
  const critiqueText = await critique(CHALLENGE, safeMessagesList);
  events.push({ id: eid(), type: "critique", actor: "critique", title: "Critique Agent: Gap Analysis", detail: critiqueText });

  const finalProposal = await synthesizeFinalProposal(CHALLENGE, safeMessagesList, critiqueText);
  events.push({ id: eid(), type: "final", actor: "orchestrator", title: "Final Cross-Industry Matching Proposal", detail: finalProposal });

  const finalBlock = ledger.append({ type: "final", actor: "orchestrator", summary: "final cross-industry matching proposal synthesized from safe messages only", payload: { finalProposal } });
  events.push({ id: eid(), type: "log", actor: "system", title: "Final proposal recorded to audit log", ledgerBlock: finalBlock });

  return { events, ledger: ledger.all(), finalProposal, matching, pairScores };
}

export { CHALLENGE };
