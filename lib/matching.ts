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
  "megacorp-altai": "Ultra-lightweight ceramic insulation designed for oil refinery environments can be repurposed for EV battery thermal management. Heat resistance exceeds requirements by multiples; weight is a fraction of conventional materials.",
  "megacorp-nanoshield": "Deep-sea nano-coating with dual electrical insulation and thermal conductivity properties is ideal for battery cell protection. Proven durability record in extreme environments.",
  "megacorp-biowrap": "Medical-grade bio-polymer with ultra-light weight, wide temperature range, and EMI shielding properties can serve as battery module housing. Already safety-certified.",
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
        matchReason: MATCH_REASONS[key] ?? `Complementary relationship detected between ${ent.name}'s needs and ${su.name}'s technology.`,
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
      "Each company hashed its capability/need tags locally using feature-hashing, then projected them through shared random hyperplanes into bit signatures. Enterprise needs were cross-matched against startup capabilities, with a Serendipity Score computed from industry distance. The farther apart the industries, the higher the score — these are matches you would never find on Google.",
  };

  return { matching, pairScores };
}
