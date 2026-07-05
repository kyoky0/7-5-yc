export type CompanyId = "nutripack" | "silvertech" | "quicklogix";

export interface Company {
  id: CompanyId;
  name: string;
  nameJa: string;
  role: string;
  color: string;
  /** Raw secret dossier text. NEVER sent to other agents, orchestrator, or client except via Reveal. */
  secretDossier: string;
  /** Exact strings that must never leak verbatim (canary tokens for the detector demo). */
  secretTerms: string[];
  /** Abstracted capability/need tags used ONLY for hashed matching (never raw text shared). */
  capabilityTags: string[];
}

export type WallVerdict = "pass" | "redacted" | "blocked";

export type FlagCategory = "currency" | "percentage" | "proper_noun" | "long_number" | "secret_term";

export interface FlaggedSpan {
  text: string;
  category: FlagCategory;
}

/** Category + count only, with no raw span text — this is what's allowed to cross the network from a
 *  remote company machine to the central orchestrator (see lib/remoteAgents.ts). */
export interface FlaggedSummary {
  category: FlagCategory;
  count: number;
}

export interface WallResult {
  verdict: WallVerdict;
  draft: string;
  safeMessage: string | null;
  flagged: FlaggedSpan[];
  reason?: string;
}

/** Shape returned by a remote per-company agent service — never includes the raw draft or raw flagged text. */
export interface RemoteAgentResult {
  verdict: WallVerdict;
  safeMessage: string | null;
  flaggedSummary: FlaggedSummary[];
  reason?: string;
}

export interface LedgerBlock {
  index: number;
  timestamp: number;
  type: "genesis" | "commitment" | "safe_message" | "blocked" | "reveal" | "matching" | "final";
  actor: string;
  summary: string;
  payloadHash: string;
  prevHash: string;
  hash: string;
}

export type TimelineEventType =
  | "draft"
  | "wall_flag"
  | "wall_redact"
  | "wall_block"
  | "safe_message"
  | "critique"
  | "matching"
  | "final"
  | "log";

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  actor: string;
  title: string;
  detail?: string;
  draft?: string;
  flagged?: FlaggedSpan[];
  flaggedSummary?: FlaggedSummary[];
  safeMessage?: string;
  ledgerBlock?: LedgerBlock;
  /** "remote": ran on the company's own machine, only the safe message crossed the network.
   *  "local": ran in-process on the orchestrator machine (single-laptop demo fallback). */
  mode?: "local" | "remote";
}

export interface RunResult {
  events: TimelineEvent[];
  ledger: LedgerBlock[];
  finalProposal: string;
  matching: MatchingResult;
}

export interface MatchingResult {
  buckets: Record<CompanyId, number[]>;
  overlapScore: number;
  explanation: string;
}

export interface AttackResult {
  mode: "local" | "remote";
  verdict: WallVerdict;
  draft?: string;
  flagged?: FlaggedSpan[];
  flaggedSummary?: FlaggedSummary[];
  safeMessage: string | null;
  reason?: string;
  ledgerBlock: LedgerBlock;
}

export interface RevealResult {
  companyId: CompanyId;
  committedHash: string;
  recomputedHash: string;
  match: boolean;
  rawDossier: string;
}
