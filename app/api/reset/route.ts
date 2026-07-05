import { NextResponse } from "next/server";
import { resetBudgets } from "@/lib/privacyWall";

export async function POST() {
  resetBudgets();
  return NextResponse.json({ ok: true });
}
