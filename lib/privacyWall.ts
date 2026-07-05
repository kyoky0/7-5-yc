import { CompanyId, FlaggedSpan, FlaggedSummary, WallResult } from "./types";
import { callLLM } from "./llm";

const CURRENCY_RE = /(¥|\$)?\s?\d{1,3}(,\d{3})*(\.\d+)?\s?(円|万円|億円|USD|kg|kg)/g;
const PERCENT_RE = /\d{1,3}(\.\d+)?\s?%/g;
const LONG_NUMBER_RE = /\d{4,}(,\d{3})*/g;
const PATENT_RE = /第\s?[\d,]+号/g;
/** Japanese magnitude notation (12万, 4.2億, etc.) — a plain digit-count regex misses these entirely. */
const JP_MAGNITUDE_RE = /\d+(\.\d+)?\s?(千|万|億)/g;

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
        ? "[想定価格帯では採算が見込める水準]"
        : f.category === "percentage"
          ? "[相当な割合]"
          : f.category === "proper_noun"
            ? "[固有の技術・組織名は非公開]"
            : "[具体的な数値は非公開]";
    out = out.split(f.text).join(replacement);
  }
  return out;
}

const ABSTRACTION_SYSTEM = `あなたはPrivacy Wallの抽象化エンジンです。企業の担当者が書いた下書きメッセージを、他社に共有しても安全な形に書き換えます。
ルール:
- 具体的な金額、原価、パーセンテージ、契約先名、特許番号、企業名、個人名は絶対に書かない。
- 代わりに「採算が見込める」「一定割合の顧客に強いニーズがある」のような抽象化された洞察・制約・実現可能性の判断だけを残す。
- 元のメッセージの協働に必要な意味(実現可能かどうか、何が必要か、リスクは何か)は保持する。
- 出力は書き換え後の文章のみ。前置きや説明は不要。`;

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
      reason: "情報予算(specificity budget)を使い切ったため、これ以上の詳細化要求は拒否されました(段階的な秘密再構成を防止)。",
    };
  }

  const flagged = detectSpans(draft, secretTerms);
  if (flagged.length === 0) {
    return { verdict: "pass", draft, safeMessage: draft, flagged: [] };
  }

  const fallback = templateRedact(draft, flagged);
  const { text: rewritten } = await callLLM({
    system: ABSTRACTION_SYSTEM,
    user: `下書き:\n${draft}\n\n検出された機密要素(これらを含む表現は必ず抽象化すること): ${flagged.map((f) => f.text).join(", ")}`,
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
        reason: "抽象化後も機密情報の痕跡を検出したため、fail-closedポリシーによりメッセージ全体をブロックしました。",
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
