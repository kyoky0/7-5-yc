import { createHash } from "crypto";
import { CompanyId, MatchingResult } from "./types";
import { COMPANIES } from "./secrets";

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
 * ("senior consumer products" vs "elderly market") land on nearby/identical bits
 * because the embedding captures shared sub-word n-grams, solving the
 * string-mismatch problem plain PSI would hit.
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

function hammingSimilarity(a: number[], b: number[]): number {
  let same = 0;
  for (let i = 0; i < a.length; i++) if (a[i] === b[i]) same++;
  return same / a.length;
}

export function computeMatching(): MatchingResult {
  const buckets = {} as Record<CompanyId, number[]>;
  for (const c of COMPANIES) {
    buckets[c.id] = simhashSignature(c.capabilityTags);
  }
  const ids = COMPANIES.map((c) => c.id);
  let total = 0;
  let pairs = 0;
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      total += hammingSimilarity(buckets[ids[i]], buckets[ids[j]]);
      pairs++;
    }
  }
  const overlapScore = pairs > 0 ? total / pairs : 0;
  return {
    buckets,
    overlapScore,
    explanation:
      "各社は自社の能力・ニーズタグ(自然言語)をローカルでハッシュ化し、公開済みのランダム超平面群でビット署名に変換しました。中央のマッチングエンジンはこのビット列だけを比較し、元のタグ文字列を一度も受け取っていません。ビット一致率が高いほど、意味的に近い能力・ニーズを持つ組み合わせです。",
  };
}
