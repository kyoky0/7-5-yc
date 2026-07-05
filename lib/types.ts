export type CompanyId = "megacorp" | "altai" | "nanoshield" | "biowrap";
export type CompanyRole = "enterprise" | "startup";

export interface Company {
  id: CompanyId;
  name: string;
  nameJa: string;
  role: string;
  companyRole: CompanyRole;
  industry: string;
  country: string;
  color: string;
  secretDossier: string;
  secretTerms: string[];
  capabilityTags: string[];
  needTags: string[];
}

export type WallVerdict = "pass" | "redacted" | "blocked";

export type FlagCategory = "currency" | "percentage" | "proper_noun" | "long_number" | "secret_term";

export interface FlaggedSpan {
  text: string;
  category: FlagCategory;
}

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

export interface RemoteAgentResult {
  verdict: WallVerdict;
  safeMessage: string | null;
  flaggedSummary: FlaggedSummary[];
  reason?: string;
}

export interface LedgerBlock {
  index: number;
  timestamp: number;
  type: "genesis" | "commitment" | "safe_message" | "blocked" | "reveal" | "matching" | "final" | "disclosure" | "nda";
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
  | "serendipity"
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
  mode?: "local" | "remote";
  serendipityScore?: number;
}

export interface RunResult {
  events: TimelineEvent[];
  ledger: LedgerBlock[];
  finalProposal: string;
  matching: MatchingResult;
  pairScores: PairScore[];
}

export interface MatchingResult {
  buckets: Record<CompanyId, number[]>;
  overlapScore: number;
  explanation: string;
}

export interface PairScore {
  enterprise: CompanyId;
  startup: CompanyId;
  similarity: number;
  serendipityScore: number;
  industryDistance: number;
  matchReason: string;
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

export type DisclosureLevel = 0 | 1 | 2 | 3;

export interface DisclosureState {
  enterpriseId: CompanyId;
  startupId: CompanyId;
  level: DisclosureLevel;
  enterpriseOptedIn: boolean;
  startupOptedIn: boolean;
  ndaSigned: boolean;
  levelData: {
    0: { matchExists: boolean };
    1: { abstractCapability: string; abstractNeed: string; region: string } | null;
    2: { detailedCapability: string; scale: string; timeline: string } | null;
    3: { companyName: string; contact: string; fullDetails: string } | null;
  };
}

export interface NDADocument {
  id: string;
  effectiveDate: string;
  partyA: { description: string; jurisdiction: string };
  partyB: { description: string; jurisdiction: string };
  scope: string;
  duration: string;
  governingLaw: string;
  arbitration: string;
  fullText: string;
}
