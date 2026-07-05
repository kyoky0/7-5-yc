import { FlaggedSpan, WallVerdict } from "./types";

export interface LocalAuditEntry {
  id: string;
  timestamp: number;
  kind: "draft" | "attack";
  draft: string;
  flagged: FlaggedSpan[];
  verdict: WallVerdict;
  safeMessage: string | null;
  reason?: string;
}

/**
 * Full-detail log kept ONLY on this machine's own process memory — this is what an
 * agent-service instance shows on ITS OWN screen (e.g. a company's own laptop during
 * the live demo). The raw flagged text here never crosses the network: only the
 * category+count summary in RemoteAgentResult is sent back to the orchestrator.
 */
declare global {
  // eslint-disable-next-line no-var
  var __palisadeLocalAudit: LocalAuditEntry[] | undefined;
}

function store(): LocalAuditEntry[] {
  if (!globalThis.__palisadeLocalAudit) globalThis.__palisadeLocalAudit = [];
  return globalThis.__palisadeLocalAudit;
}

let counter = 0;
export function recordLocalAudit(entry: Omit<LocalAuditEntry, "id" | "timestamp">): LocalAuditEntry {
  const full: LocalAuditEntry = { ...entry, id: `local-${Date.now()}-${counter++}`, timestamp: Date.now() };
  store().push(full);
  return full;
}

export function getLocalAudit(): LocalAuditEntry[] {
  return store();
}
