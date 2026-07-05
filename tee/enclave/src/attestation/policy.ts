import crypto from "node:crypto";

/**
 * The disclosure policy this enclave build enforces. Hashing it and
 * exposing the hash via /attest lets a caller confirm that the running
 * workload enforces the policy it claims to.
 */
export const DISCLOSURE_POLICY = {
  version: "serendipity-cross-industry-match-v1",
  rules: [
    "raw_company_secrets_never_leave_enclave",
    "internal_agent_negotiation_never_returned",
    "chain_of_thought_never_returned",
    "only_disclosure_reviewed_output_returned",
    "block_exact_revenue_figures",
    "block_exact_dates",
    "block_patent_numbers",
    "block_employee_names",
    "block_budget_amounts",
    "block_verbatim_company_secret_text",
    "progressive_disclosure_enforced",
    "serendipity_score_only_after_mutual_interest",
  ],
} as const;

export function computePolicyHash(): string {
  const hash = crypto.createHash("sha256").update(JSON.stringify(DISCLOSURE_POLICY)).digest("hex");
  return `policy_${hash.slice(0, 10)}`;
}
