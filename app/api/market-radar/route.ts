import { NextResponse } from "next/server";
import OpenAI from "openai";
import { COMPANIES } from "@/lib/secrets";

function getClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

interface AdjacentMarket {
  market: string;
  rationale: string;
  entryDifficulty: "low" | "medium" | "high";
  estimatedTAM: string;
}

interface CompanyRadar {
  companyId: string;
  companyName: string;
  currentIndustry: string;
  adjacentMarkets: AdjacentMarket[];
  latencyMs: number;
}

export async function GET() {
  const client = getClient();
  if (!client) {
    return NextResponse.json({ error: "No API key" }, { status: 500 });
  }

  const totalStart = Date.now();

  const allCapabilities = COMPANIES.map(
    (c) => `${c.name} (${c.industry}, ${c.country}): capabilities=[${c.capabilityTags.join("; ")}], needs=[${c.needTags.join("; ")}]`
  ).join("\n");

  const radarResults: CompanyRadar[] = await Promise.all(
    COMPANIES.map(async (company) => {
      const start = Date.now();
      try {
        const res = await client.chat.completions.create({
          model: "gpt-4o-mini",
          max_tokens: 500,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `You are a competitive intelligence analyst specializing in cross-industry market expansion. Given a company's capabilities and the broader market landscape, identify adjacent markets this company could enter. Return JSON: {"adjacentMarkets": [{"market": "string", "rationale": "one sentence", "entryDifficulty": "low|medium|high", "estimatedTAM": "string like $2B"}]}. Return exactly 3 adjacent markets.`,
            },
            {
              role: "user",
              content: `Market landscape:\n${allCapabilities}\n\nAnalyze adjacent market opportunities for: ${company.name} (${company.industry}, ${company.country}). Capabilities: ${company.capabilityTags.join(", ")}. Current needs: ${company.needTags.join(", ")}.`,
            },
          ],
        });

        const text = res.choices[0]?.message?.content ?? '{"adjacentMarkets":[]}';
        const parsed = JSON.parse(text);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const markets: AdjacentMarket[] = (parsed.adjacentMarkets ?? []).slice(0, 3).map((m: any) => ({
          market: m.market ?? "Unknown",
          rationale: m.rationale ?? "No rationale provided",
          entryDifficulty: ["low", "medium", "high"].includes(m.entryDifficulty) ? m.entryDifficulty : "medium",
          estimatedTAM: m.estimatedTAM ?? "N/A",
        }));

        return {
          companyId: company.id,
          companyName: company.name,
          currentIndustry: company.industry,
          adjacentMarkets: markets,
          latencyMs: Date.now() - start,
        };
      } catch {
        return {
          companyId: company.id,
          companyName: company.name,
          currentIndustry: company.industry,
          adjacentMarkets: [],
          latencyMs: Date.now() - start,
        };
      }
    })
  );

  const totalTokensEstimate = radarResults.length * 500;

  return NextResponse.json({
    radar: radarResults,
    meta: {
      model: "gpt-4o-mini",
      companiesAnalyzed: COMPANIES.length,
      marketsIdentified: radarResults.reduce((sum, r) => sum + r.adjacentMarkets.length, 0),
      totalLatencyMs: Date.now() - totalStart,
      estimatedTokens: totalTokensEstimate,
    },
  });
}
