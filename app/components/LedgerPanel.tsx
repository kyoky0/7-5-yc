"use client";

import { LedgerBlock } from "@/lib/types";

const typeIcon: Record<string, string> = {
  genesis: "🌱",
  commitment: "🔏",
  safe_message: "✅",
  blocked: "🚫",
  reveal: "🔓",
  matching: "🔗",
  final: "🏆",
};

export function LedgerPanel({ blocks, verified }: { blocks: LedgerBlock[]; verified: boolean }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">⛓ 監査ログ(ハッシュチェーン)</h3>
        <span className={`rounded px-2 py-0.5 text-[11px] font-mono ${verified ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
          {verified ? "chain verified ✓" : "TAMPERED"}
        </span>
      </div>
      <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
        {blocks
          .slice()
          .reverse()
          .map((b) => (
            <div key={b.index} className="flex items-center gap-2 rounded border border-slate-800/80 bg-slate-900/40 px-2 py-1.5 text-[11px]">
              <span>{typeIcon[b.type] ?? "•"}</span>
              <span className="w-6 shrink-0 font-mono text-slate-500">#{b.index}</span>
              <span className="w-24 shrink-0 truncate text-slate-400">{b.actor}</span>
              <span className="flex-1 truncate text-slate-500">{b.summary}</span>
              <span className="shrink-0 font-mono text-slate-600">{b.hash.slice(0, 8)}…</span>
            </div>
          ))}
      </div>
    </div>
  );
}
