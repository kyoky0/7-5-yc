"use client";

import { CompanyMeta } from "./types";

export function Vault({ companies, budgets }: { companies: CompanyMeta[]; budgets: Record<string, number> }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {companies.map((c) => (
        <div key={c.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
          <div className="mb-1 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
            <span className="text-sm font-bold text-slate-100">{c.nameJa}</span>
          </div>
          <div className="mb-2 text-[11px] text-slate-500">{c.role}</div>
          <div className="mb-3 rounded border border-slate-800 bg-black/30 p-2 text-[11px] text-slate-600">
            🔒 Secret Vault — {"█".repeat(24)}
            <br />
            <span className="text-slate-700">access: private-agent-only</span>
          </div>
          <div className="mb-1 flex flex-wrap gap-1">
            {c.capabilityTags.map((t) => (
              <span key={t} className="rounded bg-slate-800/80 px-1.5 py-0.5 text-[10px] text-slate-400">
                {t}
              </span>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
            <span>specificity budget</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-indigo-500 transition-all"
                style={{ width: `${((budgets[c.id] ?? 5) / 5) * 100}%` }}
              />
            </div>
            <span className="font-mono">{budgets[c.id] ?? 5}/5</span>
          </div>
        </div>
      ))}
    </div>
  );
}
