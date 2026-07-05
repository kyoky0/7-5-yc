"use client";

import { CompanyMeta } from "./types";

function roleBadge(companyRole: string) {
  if (companyRole === "enterprise") {
    return (
      <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
        Enterprise
      </span>
    );
  }
  return (
    <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
      Startup
    </span>
  );
}

function countryFlag(country: string): string {
  const flags: Record<string, string> = {
    Japan: "\u{1F1EF}\u{1F1F5}",
    USA: "\u{1F1FA}\u{1F1F8}",
    UK: "\u{1F1EC}\u{1F1E7}",
    Germany: "\u{1F1E9}\u{1F1EA}",
    France: "\u{1F1EB}\u{1F1F7}",
    China: "\u{1F1E8}\u{1F1F3}",
    Korea: "\u{1F1F0}\u{1F1F7}",
    India: "\u{1F1EE}\u{1F1F3}",
    Israel: "\u{1F1EE}\u{1F1F1}",
    Singapore: "\u{1F1F8}\u{1F1EC}",
    Switzerland: "\u{1F1E8}\u{1F1ED}",
    Kazakhstan: "\u{1F1F0}\u{1F1FF}",
  };
  return flags[country] ?? "\u{1F30D}";
}

export function Vault({
  companies,
  budgets,
}: {
  companies: CompanyMeta[];
  budgets: Record<string, number>;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {companies.map((c) => (
        <div
          key={c.id}
          className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold text-white shadow-sm"
                style={{ background: c.color }}
              >
                {c.nameJa[0]}
              </div>
              <div>
                <div className="text-lg font-bold text-slate-800">
                  {c.nameJa}
                </div>
                <div className="text-sm text-slate-500">{c.role}</div>
              </div>
            </div>
            {roleBadge(c.companyRole)}
          </div>

          <div className="mb-3 flex items-center gap-2 text-sm text-slate-600">
            <span className="text-lg">{countryFlag(c.country)}</span>
            <span className="font-medium">{c.country}</span>
            <span className="text-slate-300">|</span>
            <span>{c.industry}</span>
          </div>

          <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
              Secret Vault
            </div>
            <div className="font-mono text-sm text-slate-400">
              {"█".repeat(24)}
            </div>
            <div className="mt-1 text-xs text-slate-400">
              access: private-agent-only
            </div>
          </div>

          <div className="mb-3 flex flex-wrap gap-1.5">
            {c.capabilityTags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
              >
                {t}
              </span>
            ))}
          </div>

          {c.companyRole === "enterprise" && c.needTags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {c.needTags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700"
                >
                  need: {t}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span className="font-medium">Specificity Budget</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{
                  width: `${((budgets[c.id] ?? 5) / 5) * 100}%`,
                }}
              />
            </div>
            <span className="font-mono font-bold">{budgets[c.id] ?? 5}/5</span>
          </div>
        </div>
      ))}
    </div>
  );
}
