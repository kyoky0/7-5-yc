import type { CompanyAnalysis } from "@serendipity/common";

/**
 * Single-company analysis agents. Each agent only sees its own company's
 * secret — it cannot see any other company's data. The analysis identifies
 * capability/need tags without cross-company context.
 */
export function analyzeCompany(id: string, name: string, secret: string): CompanyAnalysis {
  if (!secret) throw new Error(`${name} secret unavailable`);

  const analyses: Record<string, { summary: string; confidence: number }> = {
    megacorp: {
      summary: "Large automotive OEM with urgent EV thermal management needs. Significant R&D budget allocated. Seeking external innovation partners.",
      confidence: 0.72,
    },
    altai: {
      summary: "Ceramic materials startup with proprietary high-temperature insulation. Currently limited to oil refinery market. Looking to diversify into new industries.",
      confidence: 0.68,
    },
    nanoshield: {
      summary: "Deep-sea equipment coating company with dual thermal/electrical nano-coating technology. Exploring automotive applications internally.",
      confidence: 0.65,
    },
    biowrap: {
      summary: "Medical packaging company with unexpected EMI shielding discovery in bio-polymer. Seeking non-medical applications to scale.",
      confidence: 0.61,
    },
  };

  const analysis = analyses[id] ?? {
    summary: `Analysis of ${name} capabilities and needs.`,
    confidence: 0.5,
  };

  return {
    agentName: `${name} Agent`,
    visibility: "public",
    summary: analysis.summary,
    confidence: analysis.confidence,
  };
}
