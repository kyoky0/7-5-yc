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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-700">
            Audit Log (Hash Chain)
          </h3>
          <p className="text-xs text-slate-400">
            SHA-256 linked, tamper-evident
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-bold ${
            verified
              ? "bg-emerald-50 text-emerald-600"
              : "bg-red-50 text-red-600"
          }`}
        >
          {verified ? "Chain Verified" : "TAMPERED"}
        </span>
      </div>
      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
        {blocks
          .slice()
          .reverse()
          .map((b) => (
            <div
              key={b.index}
              className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-blue-600">
                {typeIcon[b.type] ?? "?"}
              </span>
              <span className="w-8 shrink-0 font-mono text-slate-400">
                #{b.index}
              </span>
              <span className="w-28 shrink-0 truncate font-medium text-slate-500">
                {b.actor}
              </span>
              <span className="flex-1 truncate text-slate-400">
                {b.summary}
              </span>
              <span className="shrink-0 font-mono text-xs text-slate-400">
                {b.hash.slice(0, 8)}...
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
