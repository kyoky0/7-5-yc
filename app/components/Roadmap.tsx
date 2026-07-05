"use client";

const ROWS: { label: string; current: string; next: string; status: "active" | "planned" }[] = [
  {
    label: "Privacy Wall",
    current: "TEE (Trusted Execution Environment) + Regex/LLM dual verification, fail-closed blocking",
    next: "Remote Attestation + Hardware Security Module (HSM) for key management",
    status: "active",
  },
  {
    label: "Capability Matching",
    current: "SimHash/LSH feature-hashing with hyperplane projection, Hamming similarity in TEE enclave",
    next: "OPRF-based Private Set Intersection (PSI) with cryptographic proofs",
    status: "active",
  },
  {
    label: "Serendipity Score",
    current: "novelty(industryDistance) + utility(complement) - penalty(similarity), computed in TEE",
    next: "Federated Learning-style continuous agent network for live serendipity discovery",
    status: "active",
  },
  {
    label: "Anti-Reconstruction",
    current: "Per-company specificity budget with decrement-on-flag policy",
    next: "Formal Differential Privacy with epsilon budget management",
    status: "planned",
  },
  {
    label: "Integrity Proof",
    current: "SHA-256 hash chain audit log with commit & reveal verification",
    next: "zkML / Zero-Knowledge Proofs for match correctness without disclosure",
    status: "planned",
  },
  {
    label: "Agent Isolation",
    current: "Each company agent runs in isolated TEE enclave; safe messages only cross enclave boundary",
    next: "Dedicated on-prem services with mTLS + TEE execution proofs",
    status: "active",
  },
  {
    label: "Audit Trail",
    current: "In-process Merkle-linked hash chain with tamper detection",
    next: "Periodic on-chain root hash anchoring for third-party verifiability",
    status: "planned",
  },
];

export function Roadmap() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="mb-5 text-sm text-slate-500">
          TEE (Trusted Execution Environment) をコアに据えたプライバシー保護アーキテクチャ。
          現在のプロトタイプと、プロダクションに向けた拡張ロードマップ。
        </p>
        <div className="space-y-3">
          {ROWS.map((r, i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="mb-2 flex items-center gap-3">
                <span className="text-sm font-bold text-slate-700">{r.label}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    r.status === "active"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {r.status === "active" ? "Active" : "Planned"}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="mb-1 text-xs font-bold uppercase tracking-wider text-emerald-600">
                    Current Implementation
                  </div>
                  <div className="text-sm text-slate-600">{r.current}</div>
                </div>
                <div>
                  <div className="mb-1 text-xs font-bold uppercase tracking-wider text-blue-600">
                    Production Target
                  </div>
                  <div className="text-sm text-blue-700">{r.next}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
