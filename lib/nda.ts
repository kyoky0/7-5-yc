import { CompanyId, NDADocument } from "./types";
import { COMPANIES } from "./secrets";
import { sha256 } from "./ledger";

function resolveGoverningLaw(
  countryA: string,
  countryB: string,
): { law: string; arbitration: string } {
  if (countryA === countryB) {
    const lawMap: Record<string, string> = {
      Japan: "Japanese law",
      China: "PRC law",
      Kazakhstan: "AIFC law",
    };
    return {
      law: lawMap[countryA] ?? "Japanese law",
      arbitration: `${countryA} arbitration`,
    };
  }
  const pair = new Set([countryA, countryB]);
  if (pair.has("Japan") && pair.has("China")) {
    return {
      law: "Singapore International Arbitration Centre Rules",
      arbitration: "SIAC, Singapore",
    };
  }
  if (pair.has("Kazakhstan")) {
    return {
      law: "AIFC English Common Law",
      arbitration: "AIFC Court, Astana",
    };
  }
  return {
    law: "Singapore International Arbitration Centre Rules",
    arbitration: "SIAC, Singapore",
  };
}

export function generateNDA(enterpriseId: CompanyId, startupId: CompanyId): NDADocument {
  const enterprise = COMPANIES.find((c) => c.id === enterpriseId);
  const startup = COMPANIES.find((c) => c.id === startupId);
  if (!enterprise || !startup) throw new Error("Unknown company");

  const { law, arbitration } = resolveGoverningLaw(enterprise.country, startup.country);
  const today = new Date().toISOString().split("T")[0];
  const ndaId = sha256(`nda:${enterpriseId}:${startupId}:${today}`).slice(0, 12);

  const fullText = `
MUTUAL NON-DISCLOSURE AGREEMENT
NDA ID: ${ndaId}
Effective Date: ${today}

BETWEEN:
Party A: ${enterprise.name} ("${enterprise.country}-based ${enterprise.role}")
Party B: ${startup.name} ("${startup.country}-based ${startup.role}")

1. PURPOSE
This Agreement is entered into for the purpose of exploring a potential business collaboration regarding technology partnership opportunities discovered through the Palisade privacy-preserving matching platform.

2. DEFINITION OF CONFIDENTIAL INFORMATION
"Confidential Information" means all non-public technical, business, financial, and operational information disclosed by either Party, including but not limited to:
- Trade secrets, patents (filed or pending), and proprietary technology
- Financial data, pricing, cost structures, and revenue information
- Customer lists, supplier contracts, and partnership details
- Internal strategies, roadmaps, and codenames
- Research data, experimental results, and unpublished findings

3. OBLIGATIONS
Each Party agrees to:
(a) Hold Confidential Information in strict confidence
(b) Not disclose to any third party without prior written consent
(c) Use Confidential Information solely for evaluation of potential collaboration
(d) Restrict access to employees with a need-to-know basis

4. DATA SOVEREIGNTY
(a) No Personal Identifiable Information (PII) shall be transferred across national borders
(b) Party A shall comply with ${enterprise.country === "Japan" ? "APPI (Act on the Protection of Personal Information)" : "local data protection laws"}
(c) Party B shall comply with ${startup.country === "China" ? "PIPL (Personal Information Protection Law)" : startup.country === "Kazakhstan" ? "Law of the Republic of Kazakhstan on Personal Data" : "local data protection laws"}
(d) Only abstracted, non-identifiable insights may be shared across jurisdictions

5. TERM
This Agreement shall remain in effect for twenty-four (24) months from the Effective Date.

6. GOVERNING LAW
This Agreement shall be governed by ${law}.

7. DISPUTE RESOLUTION
Any disputes shall be resolved through binding arbitration at ${arbitration}.

8. AUDIT TRAIL
All information exchanges under this Agreement are recorded in an append-only hash-chain audit ledger maintained by the Palisade platform. Both Parties acknowledge that this ledger provides tamper-evident proof of all disclosures.

IN WITNESS WHEREOF, the Parties have executed this Agreement as of the Effective Date.

[Digital Signature: ${enterprise.name}] ____________________
[Digital Signature: ${startup.name}] ____________________

---
Hash: ${sha256(ndaId + enterpriseId + startupId)}
Recorded in Palisade Audit Ledger
`.trim();

  return {
    id: ndaId,
    effectiveDate: today,
    partyA: {
      description: `${enterprise.name} (${enterprise.role})`,
      jurisdiction: enterprise.country,
    },
    partyB: {
      description: `${startup.name} (${startup.role})`,
      jurisdiction: startup.country,
    },
    scope: "Technology partnership exploration",
    duration: "24 months",
    governingLaw: law,
    arbitration,
    fullText,
  };
}
