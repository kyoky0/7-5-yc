"use client";

import { useState } from "react";
import { DisclosureLevel } from "@/lib/types";

interface MatchCardProps {
  enterpriseId: string;
  startupId: string;
  startupNameJa: string;
  startupColor: string;
  startupCountry: string;
  serendipityScore: number;
  level: DisclosureLevel;
  levelData: {
    0: { matchExists: boolean };
    1: { abstractCapability: string; abstractNeed: string; region: string } | null;
    2: { detailedCapability: string; scale: string; timeline: string } | null;
    3: { companyName: string; contact: string; fullDetails: string } | null;
  };
  onRequestInterest: (companyId: string, partnerId: string) => void;
  onSignNDA: (enterpriseId: string, startupId: string) => void;
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

const LEVEL_LABELS: Record<DisclosureLevel, string> = {
  0: "Match Detected",
  1: "Abstract Hints",
  2: "Detailed Info",
  3: "Full Reveal",
};

export function MatchCard({
  enterpriseId,
  startupId,
  startupNameJa,
  startupColor,
  startupCountry,
  serendipityScore,
  level,
  levelData,
  onRequestInterest,
  onSignNDA,
}: MatchCardProps) {
  const [interestSent, setInterestSent] = useState(false);

  function handleInterest() {
    setInterestSent(true);
    onRequestInterest(enterpriseId, startupId);
  }

  // Level 0: Anonymous match card
  if (level === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-400">
              ?
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-400">
                Match Detected
              </div>
              <div className="text-[11px] text-slate-400">
                A potential partner exists — details hidden
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400">Serendipity</span>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                {Math.round(serendipityScore * 100)}%
              </span>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((l) => (
                <div
                  key={l}
                  className={`h-1.5 w-6 rounded-full ${
                    l <= level ? "bg-blue-500" : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="mt-3">
          <button
            onClick={handleInterest}
            disabled={interestSent}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {interestSent ? "Interest Registered" : "Express Interest"}
          </button>
        </div>
      </div>
    );
  }

  // Level 1: Abstract capability hints
  if (level === 1) {
    const data = levelData[1];
    return (
      <div className="rounded-xl border border-blue-200 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ background: startupColor }}
            >
              {startupNameJa[0]}
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-700">
                Potential Partner
              </div>
              <div className="text-[11px] text-slate-500">
                {countryFlag(startupCountry)} {startupCountry} - Abstract hints
                available
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
              Serendipity {Math.round(serendipityScore * 100)}%
            </span>
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((l) => (
                <div
                  key={l}
                  className={`h-1.5 w-6 rounded-full ${
                    l <= level ? "bg-blue-500" : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
        {data && (
          <div className="mb-3 space-y-1 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm">
            <div className="text-slate-600">
              <span className="font-semibold text-blue-700">Capability:</span>{" "}
              {data.abstractCapability}
            </div>
            <div className="text-slate-600">
              <span className="font-semibold text-blue-700">Need:</span>{" "}
              {data.abstractNeed}
            </div>
            <div className="text-slate-600">
              <span className="font-semibold text-blue-700">Region:</span>{" "}
              {data.region}
            </div>
          </div>
        )}
        <button
          onClick={handleInterest}
          disabled={interestSent}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {interestSent ? "Interest Registered" : "Express Interest"}
        </button>
      </div>
    );
  }

  // Level 2: Detailed info + NDA button
  if (level === 2) {
    const data1 = levelData[1];
    const data2 = levelData[2];
    return (
      <div className="rounded-xl border border-blue-300 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ background: startupColor }}
            >
              {startupNameJa[0]}
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-700">
                Strong Match
              </div>
              <div className="text-[11px] text-slate-500">
                {countryFlag(startupCountry)} {startupCountry} - Detailed info
                unlocked
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
              Serendipity {Math.round(serendipityScore * 100)}%
            </span>
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((l) => (
                <div
                  key={l}
                  className={`h-1.5 w-6 rounded-full ${
                    l <= level ? "bg-blue-500" : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
        {data1 && (
          <div className="mb-2 space-y-1 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm">
            <div className="text-slate-600">
              <span className="font-semibold text-blue-700">Capability:</span>{" "}
              {data1.abstractCapability}
            </div>
            <div className="text-slate-600">
              <span className="font-semibold text-blue-700">Need:</span>{" "}
              {data1.abstractNeed}
            </div>
          </div>
        )}
        {data2 && (
          <div className="mb-3 space-y-1 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm">
            <div className="text-slate-600">
              <span className="font-semibold text-emerald-700">
                Detailed Capability:
              </span>{" "}
              {data2.detailedCapability}
            </div>
            <div className="text-slate-600">
              <span className="font-semibold text-emerald-700">Scale:</span>{" "}
              {data2.scale}
            </div>
            <div className="text-slate-600">
              <span className="font-semibold text-emerald-700">
                Timeline:
              </span>{" "}
              {data2.timeline}
            </div>
          </div>
        )}
        <button
          onClick={() => onSignNDA(enterpriseId, startupId)}
          className="w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-400"
        >
          Sign NDA to Unlock Full Details
        </button>
      </div>
    );
  }

  // Level 3: Full reveal
  const data3 = levelData[3];
  return (
    <div className="rounded-xl border-2 border-emerald-300 bg-white p-4 shadow-md">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ background: startupColor }}
          >
            {startupNameJa[0]}
          </div>
          <div>
            <div className="text-sm font-bold text-slate-800">
              {data3?.companyName ?? startupNameJa}
            </div>
            <div className="text-[11px] text-slate-500">
              {countryFlag(startupCountry)} {startupCountry} - NDA Signed, Full
              Access
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
            NDA Active
          </span>
          <div className="flex gap-1">
            {[0, 1, 2, 3].map((l) => (
              <div
                key={l}
                className={`h-1.5 w-6 rounded-full ${
                  l <= level ? "bg-emerald-500" : "bg-slate-200"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
      {data3 && (
        <div className="space-y-2 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm">
          <div className="text-slate-700">
            <span className="font-semibold text-emerald-700">Company:</span>{" "}
            {data3.companyName}
          </div>
          <div className="text-slate-700">
            <span className="font-semibold text-emerald-700">Contact:</span>{" "}
            {data3.contact}
          </div>
          <div className="text-slate-700">
            <span className="font-semibold text-emerald-700">
              Full Details:
            </span>{" "}
            {data3.fullDetails}
          </div>
        </div>
      )}
    </div>
  );
}
