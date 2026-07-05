"use client";

import { MatchingResult, PairScore } from "@/lib/types";
import { CompanyMeta } from "./types";

function hamming(a: number[], b: number[]): number {
  let same = 0;
  for (let i = 0; i < a.length; i++) if (a[i] === b[i]) same++;
  return same / a.length;
}

export function MatchingPanel({
  matching,
  companies,
  pairScores,
}: {
  matching: MatchingResult;
  companies: CompanyMeta[];
  pairScores?: PairScore[];
}) {
  const ids = companies.map((c) => c.id);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-blue-700">
        Private Capability Matching (SimHash / LSH)
      </h3>
      <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {companies.map((c) => (
          <div key={c.id}>
            <div
              className="mb-1 text-[11px] font-semibold"
              style={{ color: c.color }}
            >
              {c.nameJa}
            </div>
            <div className="grid grid-cols-8 gap-0.5">
              {matching.buckets[c.id]?.map((bit, i) => (
                <div
                  key={i}
                  className={`h-2 w-2 rounded-[2px] ${
                    bit ? "bg-blue-500" : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-1.5 text-[11px] text-slate-500">
        {ids.map((a, i) =>
          ids.slice(i + 1).map((b) => {
            const score = hamming(matching.buckets[a], matching.buckets[b]);
            const ca = companies.find((c) => c.id === a)!;
            const cb = companies.find((c) => c.id === b)!;
            const ps = pairScores?.find(
              (p) =>
                (p.enterprise === a && p.startup === b) ||
                (p.enterprise === b && p.startup === a)
            );
            return (
              <div key={a + b} className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="w-36 shrink-0 text-slate-600">
                    {ca.nameJa} <span className="text-slate-300">&#x2194;</span>{" "}
                    {cb.nameJa}
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{
                        width: `${Math.round(score * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right font-mono text-slate-600">
                    {Math.round(score * 100)}%
                  </span>
                </div>
                {ps && (
                  <div className="ml-36 flex items-center gap-2 pl-2">
                    <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600">
                      Serendipity {Math.round(ps.serendipityScore * 100)}%
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {ps.matchReason}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
        {matching.explanation}
      </p>
    </div>
  );
}
