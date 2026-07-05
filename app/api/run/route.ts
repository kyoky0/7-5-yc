import { NextResponse } from "next/server";
import { runScenario } from "@/lib/orchestrator";

export async function POST() {
  const result = await runScenario();
  return NextResponse.json(result);
}
