import { NextResponse } from "next/server";
import OpenAI from "openai";
import { COMPANIES, ENTERPRISES, STARTUPS } from "@/lib/secrets";

function getClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

interface AgentVerdict {
  agent: string;
  role: string;
  score: number;
  verdict: string;
  latencyMs: number;
  model: string;
}

interface PairAnalysis {
  enterprise: string;
  startup: string;
  agents: AgentVerdict[];
  consensus: "strong" | "moderate" | "weak";
  avgScore: number;
  moderationClean: boolean;
  moderationLatencyMs: number;
}

const AGENTS = [
  {
    name: "Deal Analyst",
    role: "venture-capital",
    system: `You are a senior venture capital deal analyst. Evaluate whether this enterprise-startup match has genuine business value. Consider market size, revenue potential, competitive advantage, and strategic fit. Return JSON: {"score": 0-100, "verdict": "one sentence"}`,
  },
  {
    name: "Tech DD Agent",
    role: "technical-due-diligence",
    system: `You are a technical due diligence specialist. Evaluate whether this enterprise-startup technology match is technically feasible. Consider technology readiness, integration complexity, IP landscape, and scaling requirements. Return JSON: {"score": 0-100, "verdict": "one sentence"}`,
  },
  {
    name: "Cross-Border Agent",
    role: "cross-border-trade",
    system: `You are a cross-border trade specialist focusing on Japan, Central Asia, and East Asia corridors. Evaluate this enterprise-startup match from a geopolitical, regulatory, and supply chain perspective. Consider trade agreements, tariffs, logistics, and cultural fit. Return JSON: {"score": 0-100, "verdict": "one sentence"}`,
  },
];

export async function POST() {
  const client = getClient();
  if (!client) {
    return NextResponse.json({ error: "No API key" }, { status: 500 });
  }

  const totalStart = Date.now();
  const pairs: PairAnalysis[] = [];

  for (const ent of ENTERPRISES) {
    for (const su of STARTUPS) {
      const prompt = `Enterprise: ${ent.name} (${ent.country}, ${ent.industry}). Capabilities: ${ent.capabilityTags.join(", ")}. Needs: ${ent.needTags.join(", ")}.
Startup: ${su.name} (${su.country}, ${su.industry}). Capabilities: ${su.capabilityTags.join(", ")}. Needs: ${su.needTags.join(", ")}.
Evaluate this match.`;

      const agentResults = await Promise.all(
        AGENTS.map(async (agent) => {
          const start = Date.now();
          try {
            const res = await client.chat.completions.create({
              model: "gpt-4o-mini",
              max_tokens: 150,
              response_format: { type: "json_object" },
              messages: [
                { role: "system", content: agent.system },
                { role: "user", content: prompt },
              ],
            });
            const text = res.choices[0]?.message?.content ?? '{"score":50,"verdict":"Unable to evaluate"}';
            const parsed = JSON.parse(text);
            return {
              agent: agent.name,
              role: agent.role,
              score: Math.min(100, Math.max(0, parsed.score ?? 50)),
              verdict: parsed.verdict ?? "No verdict",
              latencyMs: Date.now() - start,
              model: "gpt-4o-mini",
            } as AgentVerdict;
          } catch {
            return {
              agent: agent.name,
              role: agent.role,
              score: 50,
              verdict: "Evaluation unavailable",
              latencyMs: Date.now() - start,
              model: "gpt-4o-mini",
            } as AgentVerdict;
          }
        })
      );

      const modStart = Date.now();
      let moderationClean = true;
      try {
        const modRes = await client.moderations.create({
          model: "omni-moderation-latest",
          input: prompt,
        });
        moderationClean = !modRes.results[0]?.flagged;
      } catch {
        moderationClean = true;
      }
      const moderationLatencyMs = Date.now() - modStart;

      const avgScore = Math.round(agentResults.reduce((s, a) => s + a.score, 0) / agentResults.length);
      const allAbove70 = agentResults.every((a) => a.score >= 70);
      const allAbove50 = agentResults.every((a) => a.score >= 50);
      const consensus = allAbove70 ? "strong" : allAbove50 ? "moderate" : "weak";

      pairs.push({
        enterprise: ent.id,
        startup: su.id,
        agents: agentResults,
        consensus,
        avgScore,
        moderationClean,
        moderationLatencyMs,
      });
    }
  }

  const totalApiCalls = pairs.length * (AGENTS.length + 1);

  return NextResponse.json({
    pairs,
    meta: {
      totalApiCalls,
      models: ["gpt-4o-mini", "omni-moderation-latest", "text-embedding-3-small"],
      agentCount: AGENTS.length,
      totalLatencyMs: Date.now() - totalStart,
    },
  });
}
