import { NextResponse } from "next/server";
import OpenAI from "openai";
import { COMPANIES, ENTERPRISES, STARTUPS } from "@/lib/secrets";

function getClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

interface DealSignal {
  from: string;
  to: string;
  signalType: "capability_match" | "supply_chain_fit" | "technology_transfer" | "joint_venture" | "licensing";
  confidence: number;
  description: string;
}

interface MarketTrend {
  trend: string;
  relevanceScore: number;
}

export async function GET() {
  const client = getClient();
  if (!client) {
    return NextResponse.json({ error: "No API key" }, { status: 500 });
  }

  const totalStart = Date.now();

  const companyProfiles = COMPANIES.map(
    (c) => `- ${c.name} (${c.id}, ${c.companyRole}, ${c.industry}, ${c.country}): capabilities=[${c.capabilityTags.join("; ")}], needs=[${c.needTags.join("; ")}]`
  ).join("\n");

  const enterpriseIds = ENTERPRISES.map((e) => e.id).join(", ");
  const startupIds = STARTUPS.map((s) => s.id).join(", ");

  const signalsStart = Date.now();
  let dealSignals: DealSignal[] = [];
  try {
    const signalsRes = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 800,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a deal flow analyst at a cross-industry B2B matching platform. Analyze company profiles and identify deal signals — potential business relationships, partnerships, or transactions between companies. Return JSON: {"deal_signals": [{"from": "company_id", "to": "company_id", "signal_type": "capability_match|supply_chain_fit|technology_transfer|joint_venture|licensing", "confidence": 0.0-1.0, "description": "one sentence"}]}. Generate 6-8 signals covering different pair combinations and signal types. Use company IDs (not names) for from/to fields.`,
        },
        {
          role: "user",
          content: `Companies in our platform:\n${companyProfiles}\n\nEnterprise IDs: ${enterpriseIds}\nStartup IDs: ${startupIds}\n\nIdentify deal signals between these companies.`,
        },
      ],
    });

    const text = signalsRes.choices[0]?.message?.content ?? '{"deal_signals":[]}';
    const parsed = JSON.parse(text);
    const validIds = new Set<string>(COMPANIES.map((c) => c.id));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dealSignals = (parsed.deal_signals ?? [])
      .filter((s: any) => validIds.has(s.from) && validIds.has(s.to))
      .map((s: any) => ({
        from: s.from as string,
        to: s.to as string,
        signalType: s.signal_type ?? s.signalType ?? "capability_match",
        confidence: Math.min(1, Math.max(0, Number(s.confidence) || 0.5)),
        description: s.description ?? "Signal detected",
      }));
  } catch {
    dealSignals = [];
  }
  const signalsLatencyMs = Date.now() - signalsStart;

  const trendsStart = Date.now();
  let marketTrends: MarketTrend[] = [];
  let recommendedActions: string[] = [];
  try {
    const trendsRes = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 600,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a market intelligence analyst. Based on company profiles from a cross-industry B2B platform, identify macro market trends and recommend strategic actions. Return JSON: {"market_trends": [{"trend": "string", "relevance_score": 0.0-1.0}], "recommended_actions": ["string"]}. Provide 4-5 trends and 3-4 actions.`,
        },
        {
          role: "user",
          content: `Platform companies:\n${companyProfiles}\n\nIndustries represented: ${[...new Set(COMPANIES.map((c) => c.industry))].join(", ")}\nCountries: ${[...new Set(COMPANIES.map((c) => c.country))].join(", ")}\n\nIdentify market trends and recommended actions for this B2B matching platform.`,
        },
      ],
    });

    const text = trendsRes.choices[0]?.message?.content ?? '{"market_trends":[],"recommended_actions":[]}';
    const parsed = JSON.parse(text);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    marketTrends = (parsed.market_trends ?? []).map((t: any) => ({
      trend: t.trend ?? "Unknown trend",
      relevanceScore: Math.min(1, Math.max(0, Number(t.relevance_score ?? t.relevanceScore) || 0.5)),
    }));
    recommendedActions = (parsed.recommended_actions ?? []).map(String);
  } catch {
    marketTrends = [];
    recommendedActions = [];
  }
  const trendsLatencyMs = Date.now() - trendsStart;

  return NextResponse.json({
    dealSignals,
    marketTrends,
    recommendedActions,
    meta: {
      model: "gpt-4o-mini",
      apiCalls: 2,
      signalsGenerated: dealSignals.length,
      trendsIdentified: marketTrends.length,
      signalsLatencyMs,
      trendsLatencyMs,
      totalLatencyMs: Date.now() - totalStart,
    },
  });
}
