"use client";

import { useState } from "react";
import { RevealResult } from "@/lib/types";
import { CompanyMeta } from "./types";

export function RevealPanel({
  companies,
  onDone,
}: {
  companies: CompanyMeta[];
  onDone: () => void;
}) {
  const [results, setResults] = useState<Record<string, RevealResult>>({});
  const [loading, setLoading] = useState<string | null>(null);

  async function reveal(id: string) {
    setLoading(id);
    try {
      const res = await fetch("/api/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: id }),
      });
      const data: RevealResult = await res.json();
      setResults((r) => ({ ...r, [id]: data }));
      onDone();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-white p-4 shadow-sm">
      <h3 className="mb-1 text-sm font-semibold text-amber-700">
        Commit &amp; Reveal — Post-Hoc Proof
      </h3>
      <p className="mb-3 text-[11px] leading-relaxed text-slate-500">
        Before collaboration began, each company committed a SHA-256 hash of
        its secret dossier (audit log #1-3). Reveal raw data here to verify the
        hash matches, proving that shared abstractions were derived from
        genuine data — without ever exposing secrets during collaboration.
      </p>
      <div className="space-y-2">
        {companies.map((c) => {
          const r = results[c.id];
          return (
            <div
              key={c.id}
              className="rounded-lg border border-slate-200 bg-slate-50 p-3"
            >
              <div className="mb-1 flex items-center justify-between">
                <span
                  className="text-xs font-semibold"
                  style={{ color: c.color }}
                >
                  {c.nameJa}
                </span>
                <button
                  onClick={() => reveal(c.id)}
                  disabled={loading === c.id}
                  className="rounded-lg bg-amber-500 px-2 py-1 text-[11px] font-semibold text-white hover:bg-amber-400 disabled:opacity-50"
                >
                  {loading === c.id
                    ? "Verifying..."
                    : r
                      ? "Re-verify"
                      : "Reveal & Verify"}
                </button>
              </div>
              {r && (
                <div className="space-y-1 text-[11px]">
                  <div
                    className={`font-mono ${r.match ? "text-emerald-600" : "text-red-600"}`}
                  >
                    committed: {r.committedHash.slice(0, 16)}... / recomputed:{" "}
                    {r.recomputedHash.slice(0, 16)}...{" "}
                    {r.match ? "MATCH" : "MISMATCH"}
                  </div>
                  <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-2 text-slate-500">
                    {r.rawDossier}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
