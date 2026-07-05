import { NextRequest, NextResponse } from "next/server";
import { CompanyId } from "@/lib/types";
import {
  getAllDisclosures,
  expressInterest,
  getDisclosure,
  initializeDisclosures,
} from "@/lib/disclosure";

export async function GET() {
  initializeDisclosures();
  return NextResponse.json(getAllDisclosures());
}

export async function POST(req: NextRequest) {
  initializeDisclosures();
  const body = await req.json();
  const { action, companyId, partnerId } = body as {
    action: string;
    companyId: CompanyId;
    partnerId: CompanyId;
  };

  if (action === "interest") {
    const state = expressInterest(companyId, partnerId);
    return NextResponse.json(state);
  }

  if (action === "get") {
    const state = getDisclosure(companyId, partnerId);
    return NextResponse.json(state);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
