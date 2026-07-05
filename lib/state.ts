import { Ledger } from "./ledger";
import { getAllCommitments } from "./commitReveal";

/**
 * Process-wide singleton: the audit ledger and specificity budgets live for the
 * lifetime of the dev server, so repeated demo runs visibly APPEND to the same
 * hash chain rather than resetting it — the log only ever grows.
 */
declare global {
  // eslint-disable-next-line no-var
  var __palisadeLedger: Ledger | undefined;
}

export function getLedger(): Ledger {
  if (!globalThis.__palisadeLedger) {
    const ledger = new Ledger();
    for (const { companyId, commitment } of getAllCommitments()) {
      ledger.append({
        type: "commitment",
        actor: companyId,
        summary: `${companyId} committed a SHA-256 hash of its secret dossier before any collaboration began`,
        payload: { companyId, commitment },
      });
    }
    globalThis.__palisadeLedger = ledger;
  }
  return globalThis.__palisadeLedger;
}
