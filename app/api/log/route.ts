import { NextResponse } from "next/server";
import { getLedger } from "@/lib/state";

export async function GET() {
  const ledger = getLedger();
  return NextResponse.json({ blocks: ledger.all(), verified: ledger.verify() });
}
