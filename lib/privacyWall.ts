import { CompanyId, FlaggedSpan, FlaggedSummary, WallResult } from "./types";
import { callLLM } from "./llm";

const CURRENCY_RE = /(¥|\$)?\s?\d{1,3}(,\d{3})*(\.\d+)?\s?(USD|JPY|EUR|kg)/g;
const PERCENT_RE = /\d{1,3}(\.\d+)?\s?%/g;
const LONG_NUMBER_RE = /\d{4,}(,\d{3})*/g;
const PATENT_RE = /[A-Z]{2}-\d{4}-\d+/g;
const JP_MAGNITUDE_RE = /\d+(\.\d+)?\s?(thousand|million|billion|B|M|K)/g;

/** Rule-based detection: deterministic, auditable — not left to LLM judgment alone. */
export function detectSpans(text: string, secretTerms: string[]): FlaggedSpan[] {
  const flagged: FlaggedSpan[] = [];
  const seen = new Set<string>();

  for (const term of secretTerms) {
    if (text.includes(term) && !seen.has(term)) {
      flagged.push({ text: term, category: "secret_term" });
      seen.add(term);
    }
  }

  for (const re of [CURRENCY_RE, PERCENT_RE, PATENT_RE, JP_MAGNITUDE_RE, LONG_NUMBER_RE]) {
    const matches = text.match(re) ?? [];
    for (const m of matches) {
      const trimmed = m.trim();
      if (!seen.has(trimmed)) {
        const category =
          re === CURRENCY_RE
            ? "currency"
            : re === PERCENT_RE
              ? "percentage"
              : re === PATENT_RE
                ? "proper_noun"
                : re === JP_MAGNITUDE_RE
                  ? "long_number"
                  : "long_number";
        flagged.push({ text: trimmed, category });
        seen.add(trimmed);
      }
    }
  }

  return flagged;
}

function templateRedact(draft: string, flagged: FlaggedSpan[]): string {
  let out = draft;
  for (const f of flagged) {
    const replacement =
      f.category === "currency"
        ? "[cost-effective range for target application]"
        : f.category === "percentage"
          ? "[significant proportion]"
          : f.category === "proper_noun"
            ? "[proprietary technology/entity name redacted]"
            : "[specific figure redacted]";
    out = out.split(f.text).join(replacement);
  }
  return out;
}

const ABSTRACTION_SYSTEM = `You are the Privacy Wall abstraction engine. Rewrite draft messages from company representatives into a form safe to share with other companies.
Rules:
- Never include specific amounts, costs, percentages, client names, patent numbers, company names, or personal names.
- Instead, retain only abstracted insights, constraints, and feasibility judgments such as "cost-effective" or "strong demand from a significant share of customers."
- Preserve the collaboration-relevant meaning of the original message (whether something is feasible, what is needed, what the risks are).
- Output only the rewritten text. No preamble or explanation.`;

export interface WallOptions {
  companyId: CompanyId;
  secretTerms: string[];
  draft: string;
  /** Remaining "specificity budget" for this company — anti-reconstruction guard. */
  budgetRemaining: number;
}

/**
 * Draft -> detect -> (if flagged) LLM-abstract -> re-detect -> (if still leaking) fail closed.
 * This two-pass design means the Wall never trusts a single LLM call to self-certify safety.
 */
export async function runPrivacyWall(opts: WallOptions): Promise<WallResult> {
  const { draft, secretTerms, budgetRemaining } = opts;

  if (budgetRemaining <= 0) {
    return {
      verdict: "blocked",
      draft,
      safeMessage: null,
      flagged: [],
      reason: "Specificity budget exhausted — further detail requests are blocked to prevent gradual secret reconstruction.",
    };
  }

  const flagged = detectSpans(draft, secretTerms);
  if (flagged.length === 0) {
    return { verdict: "pass", draft, safeMessage: draft, flagged: [] };
  }

  const fallback = templateRedact(draft, flagged);
  const { text: rewritten } = await callLLM({
    system: ABSTRACTION_SYSTEM,
    user: `Draft:\n${draft}\n\nDetected sensitive elements (these MUST be abstracted): ${flagged.map((f) => f.text).join(", ")}`,
    fallback,
    maxTokens: 400,
  });

  const stillLeaking = detectSpans(rewritten, secretTerms);
  if (stillLeaking.length > 0) {
    const secondPass = templateRedact(rewritten, stillLeaking);
    const finalCheck = detectSpans(secondPass, secretTerms);
    if (finalCheck.length > 0) {
      return {
        verdict: "blocked",
        draft,
        safeMessage: null,
        flagged,
        reason: "Traces of confidential information detected after abstraction — entire message blocked under fail-closed policy.",
      };
    }
    return { verdict: "redacted", draft, safeMessage: secondPass, flagged };
  }

  return { verdict: "redacted", draft, safeMessage: rewritten, flagged };
}

/** Category + count only — the shape a remote per-company agent service is allowed to report back
 *  to the central orchestrator. The raw flagged text (the actual secret value) never leaves this function. */
export function summarizeFlagged(flagged: FlaggedSpan[]): FlaggedSummary[] {
  const counts = new Map<FlaggedSpan["category"], number>();
  for (const f of flagged) counts.set(f.category, (counts.get(f.category) ?? 0) + 1);
  return [...counts.entries()].map(([category, count]) => ({ category, count }));
}

/** Per-company remaining specificity budget, decremented on every flagged exchange. Resets per server process. */
const budgets = new Map<CompanyId, number>();
export function getBudget(id: CompanyId): number {
  if (!budgets.has(id)) budgets.set(id, 5);
  return budgets.get(id)!;
}
export function decrementBudget(id: CompanyId, amount = 1) {
  budgets.set(id, Math.max(0, getBudget(id) - amount));
}
export function resetBudgets() {
  budgets.clear();
}
export function getAllBudgets(): Record<CompanyId, number> {
  const ids: CompanyId[] = ["megacorp", "altai", "nanoshield", "biowrap"];
  const out = {} as Record<CompanyId, number>;
  for (const id of ids) out[id] = getBudget(id);
  return out;
}
