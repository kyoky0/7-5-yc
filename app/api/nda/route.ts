import { NextRequest, NextResponse } from "next/server";
import { CompanyId } from "@/lib/types";
import { signNDA, initializeDisclosures } from "@/lib/disclosure";
import { generateNDA } from "@/lib/nda";
import { getLedger } from "@/lib/state";

export async function POST(req: NextRequest) {
  initializeDisclosures();
  const { enterpriseId, startupId } = (await req.json()) as {
    enterpriseId: CompanyId;
    startupId: CompanyId;
  };

  const nda = generateNDA(enterpriseId, startupId);
  const disclosure = signNDA(enterpriseId, startupId);

  const ledger = getLedger();
  ledger.append({
    type: "nda",
    actor: "system",
    summary: `NDA ${nda.id} generated between ${enterpriseId} and ${startupId}`,
    payload: { ndaId: nda.id, parties: [enterpriseId, startupId] },
  });

  return NextResponse.json({ nda, disclosure });
}
