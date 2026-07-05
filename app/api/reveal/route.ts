import { NextResponse } from "next/server";
import { reveal } from "@/lib/commitReveal";
import { getLedger } from "@/lib/state";
import { CompanyId } from "@/lib/types";

export async function POST(req: Request) {
  const body = await req.json();
  const companyId = body.companyId as CompanyId;
  if (!companyId) {
    return NextResponse.json({ error: "companyId is required" }, { status: 400 });
  }
  const result = reveal(companyId);
  const ledger = getLedger();
  const block = ledger.append({
    type: "reveal",
    actor: companyId,
    summary: `${companyId} revealed its raw secret dossier and proved it matches its pre-collaboration commitment`,
    payload: { companyId, match: result.match, committedHash: result.committedHash },
  });
  return NextResponse.json({ ...result, ledgerBlock: block });
}
