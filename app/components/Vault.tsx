"use client";

import { CompanyMeta } from "./types";

function roleBadge(companyRole: string) {
  if (companyRole === "enterprise") {
    return (
      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
        Enterprise
      </span>
    );
  }
  return (
    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {companies.map((c) => (
        <div
          key={c.id}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="mb-1 flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: c.color }}
            />
            <span className="text-sm font-bold text-slate-800">
              {c.nameJa}
            </span>
            {roleBadge(c.companyRole)}
          </div>
          <div className="mb-1 text-[11px] text-slate-500">{c.role}</div>
          <div className="mb-2 flex items-center gap-1 text-[11px] text-slate-500">
            <span>{countryFlag(c.country)}</span>
            <span>{c.country}</span>
            <span className="mx-1 text-slate-300">|</span>
            <span>{c.industry}</span>
          </div>
          <div className="mb-2 rounded-lg border border-slate-200 bg-slate-50 p-2 text-[11px] text-slate-400">
            <span className="font-semibold text-slate-500">
              Secret Vault
            </span>{" "}
            — {"█".repeat(20)}
            <br />
            <span className="text-slate-400">access: private-agent-only</span>
          </div>
          <div className="mb-1 flex flex-wrap gap-1">
            {c.capabilityTags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-600"
              >
                {t}
              </span>
            ))}
          </div>
          {c.companyRole === "enterprise" && c.needTags.length > 0 && (
            <div className="mb-1 flex flex-wrap gap-1">
              {c.needTags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-600"
                >
                  need: {t}
                </span>
              ))}
            </div>
          )}
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
            <span>specificity budget</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{
                  width: `${((budgets[c.id] ?? 5) / 5) * 100}%`,
                }}
              />
            </div>
            <span className="font-mono">{budgets[c.id] ?? 5}/5</span>
          </div>
        </div>
      ))}
    </div>
  );
}
