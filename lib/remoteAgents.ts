import { CompanyId, RemoteAgentResult } from "./types";

export function remoteUrlFor(companyId: CompanyId): string | undefined {
  const url = process.env[`AGENT_URL_${companyId.toUpperCase()}`];
  return url ? url.replace(/\/$/, "") : undefined;
}

async function postJson(url: string, body: unknown, timeoutMs = 20000): Promise<RemoteAgentResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`remote agent responded ${res.status}`);
    return (await res.json()) as RemoteAgentResult;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Calls out over the network to a company's OWN machine, which runs its own copy
 * of the app configured with COMPANY_ID + LOCAL_OLLAMA_URL. Only a RemoteAgentResult
 * (safe message + category/count summary, never the raw draft or raw flagged text)
 * comes back. Returns null if this company has no AGENT_URL configured (caller
 * should fall back to in-process simulation), and throws if the machine is
 * configured but unreachable (caller decides whether to fall back or surface it).
 */
export async function remoteDraft(
  companyId: CompanyId,
  round: 1 | 2,
  challenge: string,
  othersSafeMessages: { name: string; text: string }[],
): Promise<RemoteAgentResult | null> {
  const base = remoteUrlFor(companyId);
  if (!base) return null;
  return postJson(`${base}/api/agent/draft`, { companyId, round, challenge, othersSafeMessages });
}

export async function remoteAttack(companyId: CompanyId, question: string): Promise<RemoteAgentResult | null> {
  const base = remoteUrlFor(companyId);
  if (!base) return null;
  return postJson(`${base}/api/agent/attack`, { companyId, question });
}
