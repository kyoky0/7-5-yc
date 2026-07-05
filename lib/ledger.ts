import { createHash } from "crypto";
import { LedgerBlock } from "./types";

export function sha256(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/**
 * A minimal hash-chained audit log (Merkle-style linkage: each block commits
 * to a hash of its own payload plus the previous block's hash). This is a
 * simplified stand-in for anchoring commitments on-chain in production —
 * see the Roadmap tab. It is tamper-evident: mutating any past block breaks
 * every hash after it.
 */
export class Ledger {
  private blocks: LedgerBlock[] = [];

  constructor() {
    const genesisPayload = JSON.stringify({ note: "Palisade audit log genesis" });
    const block: LedgerBlock = {
      index: 0,
      timestamp: Date.now(),
      type: "genesis",
      actor: "system",
      summary: "Ledger initialized",
      payloadHash: sha256(genesisPayload),
      prevHash: "0".repeat(64),
      hash: "",
    };
    block.hash = sha256(block.prevHash + block.payloadHash + block.index);
    this.blocks.push(block);
  }

  append(entry: Omit<LedgerBlock, "index" | "timestamp" | "hash" | "prevHash" | "payloadHash"> & { payload: unknown }): LedgerBlock {
    const prev = this.blocks[this.blocks.length - 1];
    const payloadHash = sha256(JSON.stringify(entry.payload));
    const index = this.blocks.length;
    const timestamp = Date.now();
    const hash = sha256(prev.hash + payloadHash + index);
    const block: LedgerBlock = {
      index,
      timestamp,
      type: entry.type,
      actor: entry.actor,
      summary: entry.summary,
      payloadHash,
      prevHash: prev.hash,
      hash,
    };
    this.blocks.push(block);
    return block;
  }

  all(): LedgerBlock[] {
    return this.blocks;
  }

  /** Verifies the entire chain is unbroken — proves the log wasn't tampered with after the fact. */
  verify(): boolean {
    for (let i = 1; i < this.blocks.length; i++) {
      const prev = this.blocks[i - 1];
      const cur = this.blocks[i];
      if (cur.prevHash !== prev.hash) return false;
      const expected = sha256(cur.prevHash + cur.payloadHash + cur.index);
      if (expected !== cur.hash) return false;
    }
    return true;
  }
}
