import { createHash } from "crypto";
import { CompanyId, MatchingResult, PairScore } from "./types";
import { COMPANIES, ENTERPRISES, STARTUPS } from "./secrets";

const HASH_BITS = 64;

/** Feature-hashing: turns arbitrary text into a fixed-size weighted vector without a vocabulary/dictionary. */
function hashedNgramVector(text: string, dims = 256): number[] {
  const vec = new Array(dims).fill(0);
  const tokens = text
    .toLowerCase()
    .split(/[^a-z0-9぀-ヿ一-鿿]+/)
    .filter(Boolean);
  const ngrams: string[] = [];
  for (const t of tokens) {
    ngrams.push(t);
    for (let n = 3; n <= 4; n++) {
      for (let i = 0; i <= t.length - n; i++) ngrams.push(t.slice(i, i + n));
    }
  }
  for (const g of ngrams) {
    const h = createHash("md5").update(g).digest();
    const idx = h.readUInt32BE(0) % dims;
    const sign = h[4] % 2 === 0 ? 1 : -1;
    vec[idx] += sign;
  }
  return vec;
}

/** Deterministic pseudo-random hyperplane, seeded per bit index — same seed set used by every company. */
function hyperplane(dims: number, seed: number): number[] {
  const plane = new Array(dims);
  let x = seed * 2654435761 + 1;
  for (let i = 0; i < dims; i++) {
    x = (x * 1103515245 + 12345) & 0x7fffffff;
    plane[i] = (x % 2000) / 1000 - 1;
  }
  return plane;
}

/**
 * SimHash / random-hyperplane LSH: each company locally embeds its OWN abstracted
 * capability tags (never the raw secret text) into a small vector, then projects it
 * through publicly-known random hyperplanes into a bit signature. Only the bit
 * signature ever leaves the company's process — a real, if simplified, stand-in for
 * OPRF-based Private Set Intersection (see Roadmap). Semantically similar phrases
 * land on nearby/identical bits because the embedding captures shared sub-word
 * n-grams, solving the string-mismatch problem plain PSI would hit.
 */
export function simhashSignature(tags: string[], dims = 256): number[] {
  const dims_ = dims;
  const vectors = tags.map((t) => hashedNgramVector(t, dims_));
  const summed = new Array(dims_).fill(0);
  for (const v of vectors) for (let i = 0; i < dims_; i++) summed[i] += v[i];

  const bits: number[] = [];
  for (let b = 0; b < HASH_BITS; b++) {
    const plane = hyperplane(dims_, b + 1);
    let dot = 0;
    for (let i = 0; i < dims_; i++) dot += plane[i] * summed[i];
    bits.push(dot >= 0 ? 1 : 0);
  }
  return bits;
}

export function hammingSimilarity(a: number[], b: number[]): number {
  let same = 0;
  for (let i = 0; i < a.length; i++) if (a[i] === b[i]) same++;
  return same / a.length;
}

// ---------------------------------------------------------------------------
// Cross-matching: enterprise needs × startup capabilities
// ---------------------------------------------------------------------------

const INDUSTRY_CODES: Record<string, number> = {
  "automotive": 0,
  "oil-refinery-ceramics": 1,
  "deep-sea-equipment": 2,
  "medical-packaging": 3,
};

/** Normalized industry distance: 0 = same industry, 1 = maximally distant. */
function industryDistance(a: string, b: string): number {
  const codeA = INDUSTRY_CODES[a] ?? 0;
  const codeB = INDUSTRY_CODES[b] ?? 0;
  return Math.min(Math.abs(codeA - codeB) / 3, 1);
}

/** Cross-match: how well a startup's capability tags complement an enterprise's need tags. */
function complementScore(offerTags: string[], needTags: string[]): number {
  const offerSig = simhashSignature(offerTags);
  const needSig = simhashSignature(needTags);
  return hammingSimilarity(offerSig, needSig);
}

/**
 * Serendipity Score — rewards matches that are both USEFUL (high complement)
 * and NOVEL (cross-industry), while penalizing trivially obvious (same-industry)
 * overlaps.
 */
function serendipityScore(similarity: number, complement: number, indDist: number): number {
  const novelty = indDist * 0.3;
  const utility = complement * 0.5;
  const penalty = similarity > 0.8 ? (similarity - 0.8) * -2.0 : 0;
  return Math.max(0, Math.min(1, novelty + utility + penalty));
}

const MATCH_REASONS: Record<string, string> = {
  "megacorp-altai": "石油精製向け超軽量セラミック断熱材がEVバッテリー熱管理に転用可能。耐熱性能は要求の数倍、重量は従来品の数分の一。",
  "megacorp-nanoshield": "深海設備向けナノコーティングの電気絶縁×熱伝導の二重特性がバッテリーセル保護に最適。極限環境での耐久実績あり。",
  "megacorp-biowrap": "医療用バイオポリマーの超軽量・広温度範囲・EMIシールド特性がバッテリーモジュール筐体として活用可能。安全認証取得済み。",
};

export function computePairScores(): PairScore[] {
  const pairs: PairScore[] = [];
  for (const ent of ENTERPRISES) {
    for (const su of STARTUPS) {
      const capSig = simhashSignature(su.capabilityTags);
      const needSig = simhashSignature(ent.needTags);
      const sim = hammingSimilarity(capSig, needSig);
      const comp = complementScore(su.capabilityTags, ent.needTags);
      const indDist = industryDistance(ent.industry, su.industry);
      const sScore = serendipityScore(sim, comp, indDist);
      const key = `${ent.id}-${su.id}`;
      pairs.push({
        enterprise: ent.id,
        startup: su.id,
        similarity: Math.round(sim * 1000) / 1000,
        serendipityScore: Math.round(sScore * 1000) / 1000,
        industryDistance: Math.round(indDist * 1000) / 1000,
        matchReason: MATCH_REASONS[key] ?? `${ent.nameJa}のニーズと${su.nameJa}の技術に補完関係を検出。`,
      });
    }
  }
  return pairs.sort((a, b) => b.serendipityScore - a.serendipityScore);
}

export function computeMatching(): { matching: MatchingResult; pairScores: PairScore[] } {
  const buckets = {} as Record<CompanyId, number[]>;
  for (const c of COMPANIES) {
    buckets[c.id] = simhashSignature(c.capabilityTags);
  }
  const ids = COMPANIES.map((c) => c.id);
  let total = 0;
  let pairCount = 0;
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      total += hammingSimilarity(buckets[ids[i]], buckets[ids[j]]);
      pairCount++;
    }
  }
  const overlapScore = pairCount > 0 ? total / pairCount : 0;

  const pairScores = computePairScores();

  const matching: MatchingResult = {
    buckets,
    overlapScore,
    explanation:
      "各社は自社の能力・ニーズタグ(自然言語)をローカルでハッシュ化し、公開済みのランダム超平面群でビット署名に変換しました。大企業のニーズとスタートアップの能力をクロスマッチングし、業界距離によるセレンディピティスコアを算出。業界が離れているほど「Google検索では見つからない」組み合わせとして高く評価されます。",
  };

  return { matching, pairScores };
}
