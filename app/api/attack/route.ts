import { NextResponse } from "next/server";
import { attemptExtraction } from "@/lib/attack";
import { CompanyId } from "@/lib/types";

export async function POST(req: Request) {
  const body = await req.json();
  const companyId = body.companyId as CompanyId;
  const question = String(body.question ?? "").slice(0, 500);
  if (!companyId || !question) {
    return NextResponse.json({ error: "companyId and question are required" }, { status: 400 });
  }
  const result = await attemptExtraction(companyId, question);
  return NextResponse.json(result);
}
