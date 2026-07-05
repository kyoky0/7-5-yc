"use client";

import { MatchingResult } from "@/lib/types";
import { CompanyMeta } from "./types";

function hamming(a: number[], b: number[]): number {
  let same = 0;
  for (let i = 0; i < a.length; i++) if (a[i] === b[i]) same++;
  return same / a.length;
}

export function MatchingPanel({ matching, companies }: { matching: MatchingResult; companies: CompanyMeta[] }) {
  const ids = companies.map((c) => c.id);
  return (
    <div className="rounded-lg border border-sky-900/60 bg-slate-950/60 p-4">
      <h3 className="mb-3 text-sm font-semibold text-sky-300">🔗 Private Capability Matching (SimHash / LSH)</h3>
      <div className="mb-3 grid grid-cols-3 gap-3">
        {companies.map((c) => (
          <div key={c.id}>
            <div className="mb-1 text-[11px] font-semibold" style={{ color: c.color }}>
              {c.nameJa}
            </div>
            <div className="grid grid-cols-8 gap-0.5">
              {matching.buckets[c.id]?.map((bit, i) => (
                <div key={i} className={`h-2 w-2 rounded-[2px] ${bit ? "bg-sky-400" : "bg-slate-800"}`} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-1 text-[11px] text-slate-400">
        {ids.map((a, i) =>
          ids.slice(i + 1).map((b) => {
            const score = hamming(matching.buckets[a], matching.buckets[b]);
            const ca = companies.find((c) => c.id === a)!;
            const cb = companies.find((c) => c.id === b)!;
            return (
              <div key={a + b} className="flex items-center gap-2">
                <span className="w-32 shrink-0">
                  {ca.nameJa} ↔ {cb.nameJa}
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full bg-sky-500" style={{ width: `${Math.round(score * 100)}%` }} />
                </div>
                <span className="w-10 shrink-0 text-right font-mono">{Math.round(score * 100)}%</span>
              </div>
            );
          }),
        )}
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-slate-500">{matching.explanation}</p>
    </div>
  );
}
