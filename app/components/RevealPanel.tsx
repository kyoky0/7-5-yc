"use client";

import { useState } from "react";
import { RevealResult } from "@/lib/types";
import { CompanyMeta } from "./types";

export function RevealPanel({ companies, onDone }: { companies: CompanyMeta[]; onDone: () => void }) {
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
    <div className="rounded-lg border border-amber-900/50 bg-slate-950/60 p-4">
      <h3 className="mb-1 text-sm font-semibold text-amber-300">🔓 Commit & Reveal — 事後証明</h3>
      <p className="mb-3 text-[11px] leading-relaxed text-slate-500">
        協働開始前に各社の秘密資料のSHA-256ハッシュをコミット済み(監査ログ #1-3)。今ここで生データを開示し、ハッシュが一致することを確認すれば、
        「共有された抽象化された洞察が本物のデータに基づいていた」ことを、途中で秘密を見せずに事後証明できます。
      </p>
      <div className="space-y-2">
        {companies.map((c) => {
          const r = results[c.id];
          return (
            <div key={c.id} className="rounded border border-slate-800 bg-slate-900/40 p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: c.color }}>
                  {c.nameJa}
                </span>
                <button
                  onClick={() => reveal(c.id)}
                  disabled={loading === c.id}
                  className="rounded bg-amber-700/70 px-2 py-1 text-[11px] font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
                >
                  {loading === c.id ? "検証中…" : r ? "再検証" : "Reveal & Verify"}
                </button>
              </div>
              {r && (
                <div className="space-y-1 text-[11px]">
                  <div className={`font-mono ${r.match ? "text-emerald-400" : "text-red-400"}`}>
                    committed: {r.committedHash.slice(0, 16)}… / recomputed: {r.recomputedHash.slice(0, 16)}… {r.match ? "✓ MATCH" : "✗ MISMATCH"}
                  </div>
                  <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded bg-black/40 p-2 text-slate-400">{r.rawDossier}</pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
