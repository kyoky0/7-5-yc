import { NextResponse } from "next/server";
import { getCompany } from "@/lib/secrets";
import { draftInitialContribution, draftFollowUp } from "@/lib/agents";
import { runPrivacyWall, getBudget, decrementBudget, summarizeFlagged } from "@/lib/privacyWall";
import { recordLocalAudit } from "@/lib/localAudit";
import { RemoteAgentResult, CompanyId } from "@/lib/types";

/**
 * This route is what turns a laptop into "Company X's own machine": it only ever
 * answers for the single company configured via COMPANY_ID on THIS machine, using
 * a local model (LOCAL_OLLAMA_URL, typically http://localhost:11434 on the same
 * laptop). The raw draft and raw flagged secret text never leave this function —
 * only the RemoteAgentResult (verdict + safe message + category/count summary)
 * is returned to whichever orchestrator called us.
 */
export async function POST(req: Request) {
  const hostCompanyId = process.env.COMPANY_ID as CompanyId | undefined;
  if (!hostCompanyId) {
    return NextResponse.json({ error: "This instance has no COMPANY_ID configured — it is not running as an agent-service." }, { status: 501 });
  }

  const body = await req.json();
  const companyId = body.companyId as CompanyId;
  const round = body.round === 2 ? 2 : 1;
  const challenge = String(body.challenge ?? "");
  const othersSafeMessages = Array.isArray(body.othersSafeMessages) ? body.othersSafeMessages : [];

  if (companyId !== hostCompanyId) {
    return NextResponse.json({ error: `This machine only serves ${hostCompanyId}, not ${companyId}.` }, { status: 403 });
  }

  const company = getCompany(companyId);
  if (!company) {
    return NextResponse.json({ error: "unknown company" }, { status: 400 });
  }

  const draft = round === 1 ? await draftInitialContribution(company, challenge) : await draftFollowUp(company, challenge, othersSafeMessages);

  const wall = await runPrivacyWall({
    companyId,
    secretTerms: company.secretTerms,
    draft,
    budgetRemaining: getBudget(companyId),
  });
  if (wall.flagged.length > 0) decrementBudget(companyId, 1);

  recordLocalAudit({
    kind: "draft",
    draft,
    flagged: wall.flagged,
    verdict: wall.verdict,
    safeMessage: wall.safeMessage,
    reason: wall.reason,
  });

  const result: RemoteAgentResult = {
    verdict: wall.verdict,
    safeMessage: wall.safeMessage,
    flaggedSummary: summarizeFlagged(wall.flagged),
    reason: wall.reason,
  };
  return NextResponse.json(result);
}
