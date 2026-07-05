import type { ConsensusVerdict } from "@serendipity/common";
import type { MatchPair } from "./matchRoom";

export interface ConsensusResult {
  consensus: "strong" | "moderate" | "weak";
  verdicts: ConsensusVerdict[];
}

/**
 * Multi-Agent Consensus: three specialized AI agents independently evaluate
 * each match pair. In production these would be separate LLM calls with
 * different system prompts; for the hackathon they are deterministic.
 */
export function runConsensus(matchPairs: MatchPair[]): ConsensusResult[] {
  return matchPairs.map((pair) => {
    const dealAnalyst: ConsensusVerdict = {
      agent: "Deal Analyst",
      score: Math.round(pair.serendipityScore * 95),
      rationale: `${pair.enterprise} × ${pair.startup}: strong strategic fit with clear revenue path. Cross-industry partnerships in adjacent markets show 3-5x higher success rates than same-industry deals.`,
    };

    const techDD: ConsensusVerdict = {
      agent: "Tech DD Agent",
      score: Math.round(pair.serendipityScore * 88),
      rationale: `Technology readiness level is sufficient for pilot. Integration complexity is moderate — materials science crossover requires 6-12 month adaptation period.`,
    };

    const crossBorder: ConsensusVerdict = {
      agent: "Cross-Border Agent",
      score: Math.round(pair.serendipityScore * 82),
      rationale: `No significant regulatory barriers. Supply chain logistics feasible. IP landscape is clear — no conflicting patents in the target application domain.`,
    };

    const verdicts = [dealAnalyst, techDD, crossBorder];
    const allAbove70 = verdicts.every((v) => v.score >= 70);
    const allAbove50 = verdicts.every((v) => v.score >= 50);
    const consensus = allAbove70 ? "strong" : allAbove50 ? "moderate" : "weak";

    return { consensus, verdicts };
  });
}
