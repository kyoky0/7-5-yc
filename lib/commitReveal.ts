import { CompanyId, RevealResult } from "./types";
import { COMPANIES } from "./secrets";
import { sha256 } from "./ledger";

/** Computed once at process start and written to the ledger's genesis commitments — before any collaboration happens. */
const commitments = new Map<CompanyId, string>();
for (const c of COMPANIES) {
  commitments.set(c.id, sha256(c.secretDossier));
}

export function getCommitment(id: CompanyId): string {
  const h = commitments.get(id);
  if (!h) throw new Error("unknown company");
  return h;
}

export function getAllCommitments(): { companyId: CompanyId; commitment: string }[] {
  return COMPANIES.map((c) => ({ companyId: c.id, commitment: commitments.get(c.id)! }));
}

/**
 * "Reveal": after the collaboration is over, open the raw secret and prove it hashes
 * to the commitment published at the start. This proves the abstracted insights the
 * agent shared really were derived from real, unaltered data — without ever showing
 * that data during the negotiation itself. A simplified stand-in for a zkML proof
 * of correct derivation (see Roadmap).
 */
export function reveal(id: CompanyId): RevealResult {
  const company = COMPANIES.find((c) => c.id === id);
  if (!company) throw new Error("unknown company");
  const committedHash = getCommitment(id);
  const recomputedHash = sha256(company.secretDossier);
  return {
    companyId: id,
    committedHash,
    recomputedHash,
    match: committedHash === recomputedHash,
    rawDossier: company.secretDossier,
  };
}
