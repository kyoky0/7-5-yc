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
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-1 text-lg font-bold text-blue-700">
        SimHash / LSH Capability Matching
      </h3>
      <p className="mb-4 text-sm text-slate-500">
        Feature-hashing + hyperplane projection による秘密非開示マッチング（TEE内で計算）
      </p>

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {companies.map((c) => (
          <div key={c.id}>
            <div className="mb-2 text-sm font-bold" style={{ color: c.color }}>
              {c.nameJa}
            </div>
            <div className="grid grid-cols-8 gap-1">
              {matching.buckets[c.id]?.map((bit, i) => (
                <div
                  key={i}
                  className={`h-3 w-3 rounded ${
                    bit ? "bg-blue-500" : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2 text-sm text-slate-500">
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
              <div key={a + b} className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="w-40 shrink-0 font-medium text-slate-600">
                    {ca.nameJa} ↔ {cb.nameJa}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${Math.round(score * 100)}%` }}
                    />
                  </div>
                  <span className="w-12 shrink-0 text-right font-mono font-bold text-slate-600">
                    {Math.round(score * 100)}%
                  </span>
                </div>
                {ps && (
                  <div className="ml-40 flex items-center gap-3 pl-3">
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                      Serendipity {Math.round(ps.serendipityScore * 100)}%
                    </span>
                    <span className="text-xs text-slate-400">
                      {ps.matchReason}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <p className="mt-4 text-sm leading-relaxed text-slate-400">
        {matching.explanation}
      </p>
    </div>
  );
}
