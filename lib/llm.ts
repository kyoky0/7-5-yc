import OpenAI from "openai";

let cloudClient: OpenAI | null = null;
function getCloudClient(): OpenAI | null {
  if (cloudClient) return cloudClient;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  cloudClient = new OpenAI({ apiKey });
  return cloudClient;
}

let localClient: OpenAI | null = null;
let localClientUrl: string | null = null;
/** Ollama's OpenAI-compatible endpoint, expected to run on the SAME machine as the caller (see agent-service routes). */
function getLocalClient(): OpenAI | null {
  const baseURL = process.env.LOCAL_OLLAMA_URL;
  if (!baseURL) return null;
  if (localClient && localClientUrl === baseURL) return localClient;
  localClient = new OpenAI({ apiKey: "ollama", baseURL: `${baseURL.replace(/\/$/, "")}/v1` });
  localClientUrl = baseURL;
  return localClient;
}

export function llmAvailable(): boolean {
  return !!process.env.OPENAI_API_KEY || !!process.env.LOCAL_OLLAMA_URL;
}

/**
 * Calls a local Ollama model (if LOCAL_OLLAMA_URL is set — used by the per-company
 * agent-service routes so drafting + wall abstraction happen on that company's own
 * machine) or a cloud OpenAI model (if OPENAI_API_KEY is set — used by the central
 * orchestrator's shared critique/synthesis steps and as a single-machine fallback).
 * If neither is configured, or the call fails for any reason, falls back to the
 * provided deterministic template so the live demo never breaks.
 */
export async function callLLM(opts: {
  system: string;
  user: string;
  fallback: string;
  maxTokens?: number;
}): Promise<{ text: string; source: "llm-local" | "llm-cloud" | "template" }> {
  const local = getLocalClient();
  const client = local ?? getCloudClient();
  if (!client) {
    return { text: opts.fallback, source: "template" };
  }
  try {
    const res = await client.chat.completions.create({
      model: local ? (process.env.LOCAL_OLLAMA_MODEL ?? "llama3.2") : "gpt-4o-mini",
      max_tokens: opts.maxTokens ?? 600,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
    });
    const text = res.choices[0]?.message?.content?.trim() ?? "";
    if (!text) return { text: opts.fallback, source: "template" };
    return { text, source: local ? "llm-local" : "llm-cloud" };
  } catch {
    return { text: opts.fallback, source: "template" };
  }
}
