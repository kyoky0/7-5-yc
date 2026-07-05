import { NextResponse } from "next/server";
import { getCompany } from "@/lib/secrets";
import { draftAttackResponse } from "@/lib/agents";
import { runPrivacyWall, getBudget, decrementBudget, summarizeFlagged } from "@/lib/privacyWall";
import { recordLocalAudit } from "@/lib/localAudit";
import { RemoteAgentResult, CompanyId } from "@/lib/types";

export async function POST(req: Request) {
  const hostCompanyId = process.env.COMPANY_ID as CompanyId | undefined;
  if (!hostCompanyId) {
    return NextResponse.json({ error: "This instance has no COMPANY_ID configured — it is not running as an agent-service." }, { status: 501 });
  }

  const body = await req.json();
  const companyId = body.companyId as CompanyId;
  const question = String(body.question ?? "").slice(0, 500);

  if (companyId !== hostCompanyId) {
    return NextResponse.json({ error: `This machine only serves ${hostCompanyId}, not ${companyId}.` }, { status: 403 });
  }

  const company = getCompany(companyId);
  if (!company) {
    return NextResponse.json({ error: "unknown company" }, { status: 400 });
  }

  const draft = await draftAttackResponse(company, question);
  const wall = await runPrivacyWall({
    companyId,
    secretTerms: company.secretTerms,
    draft,
    budgetRemaining: getBudget(companyId),
  });
  decrementBudget(companyId, 2);

  recordLocalAudit({
    kind: "attack",
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
