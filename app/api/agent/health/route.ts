import { NextResponse } from "next/server";

export async function GET() {
  const companyId = process.env.COMPANY_ID ?? null;
  return NextResponse.json({
    ok: !!companyId,
    companyId,
    localOllamaConfigured: !!process.env.LOCAL_OLLAMA_URL,
  });
}
