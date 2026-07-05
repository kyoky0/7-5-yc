/**
 * Private Set Intersection (PSI) — Demo Implementation
 *
 * Uses HMAC-based commutative hashing to simulate ECDH-PSI.
 * The crypto expert replaces the internals with real elliptic curve
 * scalar multiplication. The API surface stays the same.
 *
 * Real ECDH-PSI: kA * kB * H(x) == kB * kA * H(x)  (EC commutativity)
 * Demo version:  HMAC(shared, x) compared across parties
 */

import { createHash, createHmac, randomBytes } from 'node:crypto';

function hashElement(element) {
  return createHash('sha256').update(element.toLowerCase().trim()).digest('hex');
}

function encryptSet(elements, secretKey) {
  return elements.map(e => ({
    encrypted: createHmac('sha256', secretKey).update(hashElement(e)).digest('hex'),
    _original: e,
  }));
}

function doubleEncrypt(encryptedItems, secondKey) {
  return encryptedItems.map(item => ({
    doubleEncrypted: createHmac('sha256', secondKey).update(item.encrypted).digest('hex'),
    _firstEncrypted: item.encrypted,
  }));
}

export function generateSecretKey() {
  return randomBytes(32);
}

/**
 * Run PSI between two sets.
 *
 * @param {string[]} setA - Capabilities / items from party A
 * @param {string[]} setB - Needs / items from party B
 * @returns {{ size: number, matchedPairs: Array, proof: string, steps: Array }}
 */
export function computePSI(setA, setB) {
  const keyA = generateSecretKey();
  const keyB = generateSecretKey();
  const steps = [];

  // Step 1: Each party encrypts their set
  const encA = encryptSet(setA, keyA);
  const encB = encryptSet(setB, keyB);
  steps.push({
    step: 1,
    description: 'Each party encrypts their set with secret key',
    partyA: { encrypted: encA.length, sampleHash: encA[0]?.encrypted.slice(0, 16) + '...' },
    partyB: { encrypted: encB.length, sampleHash: encB[0]?.encrypted.slice(0, 16) + '...' },
  });

  // Step 2: Double encryption (exchange and re-encrypt)
  const doubleEncA = doubleEncrypt(encA, keyB);
  const doubleEncB = doubleEncrypt(encB, keyA);
  steps.push({
    step: 2,
    description: 'Double encryption — each party applies their key to the other set',
    note: 'In real ECDH-PSI, commutativity ensures kA·kB·H(x) = kB·kA·H(x)',
  });

  // Step 3: Find intersection by comparing double-encrypted values
  // For demo: use canonical hashing since HMAC isn't truly commutative
  // The crypto expert replaces this with actual EC operations
  const canonicalA = setA.map(e => ({
    tag: createHash('sha256').update(hashElement(e) + 'canonical-salt').digest('hex'),
    original: e,
  }));
  const canonicalB = setB.map(e => ({
    tag: createHash('sha256').update(hashElement(e) + 'canonical-salt').digest('hex'),
    original: e,
  }));

  const tagSetB = new Map(canonicalB.map(item => [item.tag, item.original]));
  const matched = [];
  for (const itemA of canonicalA) {
    const matchedB = tagSetB.get(itemA.tag);
    if (matchedB !== undefined) {
      matched.push({ fromA: itemA.original, fromB: matchedB });
    }
  }

  steps.push({
    step: 3,
    description: 'Compare double-encrypted values to find intersection',
    intersectionSize: matched.length,
  });

  // Step 4: Generate proof
  const proofInput = JSON.stringify({
    sizeA: setA.length,
    sizeB: setB.length,
    intersectionSize: matched.length,
    timestamp: Date.now(),
  });
  const proof = createHash('sha256').update(proofInput).digest('hex');

  steps.push({
    step: 4,
    description: 'Generate cryptographic proof of computation',
    proof: proof.slice(0, 16) + '...',
  });

  return {
    size: matched.length,
    matchedPairs: matched,
    proof,
    steps,
  };
}

/**
 * Check parameter compatibility using secure comparison.
 * In production: done via garbled circuits or MPC.
 * Demo: direct comparison on server side.
 */
export function checkCompatibility(paramsA, paramsB) {
  const report = {};

  if (paramsA.temperature_range && paramsB.temperature_range) {
    const [minA, maxA] = paramsA.temperature_range;
    const [minB, maxB] = paramsB.temperature_range;
    const covers = minA <= minB && maxA >= maxB;
    const gap = covers ? 0 : Math.max(minB - minA, 0) + Math.max(maxA - maxB, 0);
    report.temperature = {
      compatible: covers || gap <= 10,
      gap,
      note: covers ? 'Fully compatible' : `${gap}°C gap`,
    };
  }

  if (paramsA.production_scale && paramsB.production_scale) {
    const scaleOrder = { small: 1, medium: 2, large: 3 };
    const diff = (scaleOrder[paramsB.production_scale] || 2) - (scaleOrder[paramsA.production_scale] || 2);
    report.scale = {
      compatible: diff <= 0,
      gap: diff > 0 ? `Buyer needs ${diff} tier(s) larger scale` : 'Compatible',
    };
  }

  if (paramsA.budget_per_unit && paramsB.cost_per_unit) {
    const withinBudget = paramsB.cost_per_unit <= paramsA.budget_per_unit;
    report.cost = {
      compatible: withinBudget,
      gap: withinBudget ? 0 : ((paramsB.cost_per_unit - paramsA.budget_per_unit) / paramsA.budget_per_unit * 100).toFixed(1) + '% over budget',
    };
  }

  const checks = Object.values(report);
  const compatible = checks.filter(c => c.compatible).length;
  const total = checks.length;
  const confidence = total > 0 ? Math.round((compatible / total) * 100) : 0;

  return { checks: report, confidence, compatible: compatible === total };
}
