/**
 * Shared JSON contracts between Parent EC2 API, the Nitro Enclave runner,
 * and the frontend. These types are the boundary contract: anything not
 * listed here must never cross from inside the enclave to the outside.
 */

export type CheckStatus = "passed" | "failed";

export interface AttestationCheck {
  name: string;
  status: CheckStatus;
  detail?: string;
}

export interface AttestRequest {
  nonce?: string;
}

export interface AttestResponse {
  attested: boolean;
  teeType: "aws-nitro-enclaves";
  enclaveReady: boolean;
  workloadMeasurement: string;
  policyHash: string;
  checks: AttestationCheck[];
}

export interface MatchRequest {
  sessionId: string;
  encryptedSecrets?: {
    megacorp?: string;
    altai?: string;
    nanoshield?: string;
    biowrap?: string;
  };
  attestationToken?: string;
}

export type Visibility = "public";

export interface CompanyAnalysis {
  agentName: string;
  visibility: Visibility;
  summary: string;
  confidence: number;
}

export interface MatchRoomFinding {
  agentName: string;
  visibility: Visibility;
  summary: string;
  confidence: number;
  serendipityScore: number;
}

export type LeakageRisk = "Low" | "Medium" | "High";
export type DisclosureStatus = "Passed" | "Blocked";

export interface MatchResponse {
  companyAnalyses: CompanyAnalysis[];
  matchRoom: MatchRoomFinding;
  recommendedMeetings: RecommendedMeeting[];
  disclosureSafeOutput: string;
  leakageRisk: LeakageRisk;
  disclosureStatus: DisclosureStatus;
  sealedInternalLogRef: string;
  teeType: "aws-nitro-enclaves";
  workloadMeasurement: string;
}

export interface RecommendedMeeting {
  enterprise: string;
  startup: string;
  reason: string;
  serendipityScore: number;
  disclosureLevel: "L0" | "L1" | "L2" | "L3";
}

export interface ConsensusVerdict {
  agent: string;
  score: number;
  rationale: string;
}

export type RpcRequest =
  | { id: string; type: "attest"; payload: AttestRequest }
  | { id: string; type: "match"; payload: MatchRequest };

export type RpcResponse =
  | { id: string; ok: true; result: AttestResponse | MatchResponse }
  | { id: string; ok: false; error: string };
