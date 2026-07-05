import { NextResponse } from "next/server";
import { getLocalAudit } from "@/lib/localAudit";
import { getCompany } from "@/lib/secrets";

/**
 * Intended to be opened only from a browser running on THIS SAME machine
 * (see /agent-local). The central orchestrator never calls this endpoint —
 * it only ever receives the category+count summary via /api/agent/draft
 * and /api/agent/attack.
 */
export async function GET() {
  const companyId = process.env.COMPANY_ID;
  const company = companyId ? getCompany(companyId) : undefined;
  return NextResponse.json({
    companyId: companyId ?? null,
    companyName: company?.nameJa ?? null,
    entries: getLocalAudit(),
  });
}
