import { NextResponse } from "next/server";
import { getAllBudgets } from "@/lib/privacyWall";

export async function GET() {
  return NextResponse.json(getAllBudgets());
}
