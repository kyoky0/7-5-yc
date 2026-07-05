import { NextResponse } from "next/server";
import { COMPANIES } from "@/lib/secrets";

export async function GET() {
  const sanitized = COMPANIES.map((c) => ({
    id: c.id,
    name: c.name,
    nameJa: c.nameJa,
    role: c.role,
    companyRole: c.companyRole,
    industry: c.industry,
    country: c.country,
    color: c.color,
    capabilityTags: c.capabilityTags,
    needTags: c.needTags,
  }));
  return NextResponse.json(sanitized);
}
