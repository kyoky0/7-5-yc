"use client";

const ROWS: { today: string; production: string; why: string }[] = [
  {
    today:
      "SimHash + random hyperplane LSH capability matching (local computation, only bit vectors shared)",
    production:
      "OPRF-based Private Set Intersection / PSI Cardinality",
    why: "Enables computing intersection existence/cardinality without revealing the secret sets to any central party, with cryptographically proven security",
  },
  {
    today:
      "Regex pattern detection + LLM abstraction dual verification, fail-closed blocking",
    production: "TEE (Trusted Execution Environment) + Remote Attestation",
    why: "Runs Privacy Wall code and memory in an isolated environment that nobody — including the platform operator — can inspect, with execution proofs verifiable by third parties",
  },
  {
    today:
      "Fixed per-company specificity budget (counter) for repeated query protection",
    production:
      "Formal Differential Privacy noise injection and privacy budget (epsilon) management",
    why: "Provides mathematically bounded information leakage guarantees against 'reconstruct secrets via incremental queries' attacks",
  },
  {
    today:
      "SHA-256 commit & reveal (post-disclosure match verification)",
    production:
      "zkML / ZKP — prove correctness without revealing secrets",
    why: "Production use requires proving legitimacy without any disclosure (Reveal is a simplified version that involves disclosure)",
  },
  {
    today:
      "Implemented: each company runs agent-service on their own PC (secret data + Agent + local LLM + Privacy Wall); only safe messages and category/count summaries reach Orchestrator over the network. Auto-fallback to local simulation when not configured/connected",
    production:
      "Dedicated services hosted on each company's infrastructure (VPC/on-prem) + mutual auth (mTLS) + TEE execution proofs",
    why: "Demo uses physical PC separation to ensure 'Orchestrator never sees secrets', but production needs encrypted communication, mutual authentication, and execution environment attestation",
  },
  {
    today: "In-process memory hash chain audit log (SHA-256 linked)",
    production:
      "Merkle Tree batching + periodic on-chain root hash anchoring",
    why: "Elevates audit log tamper resistance from single-server trust to public ledger third-party verifiability",
  },
  {
    today: "Fixed 4-company scenario, single-session collaboration",
    production:
      "Federated Learning-style always-connected multi-company agents, auto-matching relevant companies for each new challenge",
    why: "Enables continuous discovery of promising company combinations without manual selection — a Company Brain network",
  },
];

export function Roadmap() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-2 text-lg font-bold text-slate-800">
          Production Architecture Roadmap
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          This prototype is intentionally simplified for a 5-hour hackathon.
          Below is the mapping between today&apos;s simplified implementation
          and the production-grade technologies that would replace them.
        </p>
        <div className="space-y-3">
          {ROWS.map((r, i) => (
            <div
              key={i}
              className="rounded-lg border border-slate-200 bg-slate-50 p-3"
            >
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Today
                  </div>
                  <div className="text-sm text-slate-600">{r.today}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-blue-600">
                    Production
                  </div>
                  <div className="text-sm text-blue-700">{r.production}</div>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-500">Why: </span>
                {r.why}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
