"use client";

import { LedgerBlock } from "@/lib/types";

const typeIcon: Record<string, string> = {
  genesis: "G",
  commitment: "C",
  safe_message: "S",
  blocked: "B",
  reveal: "R",
  matching: "M",
  final: "F",
  disclosure: "D",
  nda: "N",
};

export function LedgerPanel({
  blocks,
  verified,
}: {
  blocks: LedgerBlock[];
  verified: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">
          Audit Log (Hash Chain)
        </h3>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-mono ${
            verified
              ? "bg-emerald-50 text-emerald-600"
              : "bg-red-50 text-red-600"
          }`}
        >
          {verified ? "chain verified" : "TAMPERED"}
        </span>
      </div>
      <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
        {blocks
          .slice()
          .reverse()
          .map((b) => (
            <div
              key={b.index}
              className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5 text-[11px]"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-blue-100 text-[9px] font-bold text-blue-600">
                {typeIcon[b.type] ?? "?"}
              </span>
              <span className="w-6 shrink-0 font-mono text-slate-400">
                #{b.index}
              </span>
              <span className="w-24 shrink-0 truncate text-slate-500">
                {b.actor}
              </span>
              <span className="flex-1 truncate text-slate-400">
                {b.summary}
              </span>
              <span className="shrink-0 font-mono text-slate-400">
                {b.hash.slice(0, 8)}...
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
