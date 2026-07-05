"use client";

import { useEffect, useRef, useState } from "react";
import {
  DisclosureState,
  LedgerBlock,
  MatchingResult,
  NDADocument,
  PairScore,
  RunResult,
  TimelineEvent,
} from "@/lib/types";
import { CompanyMeta } from "./components/types";
import { Vault } from "./components/Vault";
import { EventCard } from "./components/EventCard";
import { LedgerPanel } from "./components/LedgerPanel";
import { MatchingPanel } from "./components/MatchingPanel";
import { AttackBox } from "./components/AttackBox";
import { RevealPanel } from "./components/RevealPanel";
import { Roadmap } from "./components/Roadmap";

const DELAY_BY_TYPE: Record<TimelineEvent["type"], number> = {
  draft: 1200,
  wall_flag: 800,
  wall_redact: 1100,
  wall_block: 1100,
  safe_message: 900,
  matching: 1600,
  serendipity: 1800,
  critique: 1400,
  final: 2000,
  log: 300,
};

type ViewTab = "demo" | "matches" | "roadmap";

export default function Home() {
  const [view, setView] = useState<ViewTab>("demo");
  const [companies, setCompanies] = useState<CompanyMeta[]>([]);
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [ledger, setLedger] = useState<LedgerBlock[]>([]);
  const [verified, setVerified] = useState(true);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [matching, setMatching] = useState<MatchingResult | null>(null);
  const [pairScores, setPairScores] = useState<PairScore[]>([]);
  const [finalProposal, setFinalProposal] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [disclosures, setDisclosures] = useState<DisclosureState[]>([]);
  const [ndaDocs, setNdaDocs] = useState<Record<string, NDADocument>>({});
  const [showNDA, setShowNDA] = useState<string | null>(null);
  const queueRef = useRef<TimelineEvent[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function refreshSide() {
    const [b, l] = await Promise.all([
      fetch("/api/budgets").then((r) => r.json()),
      fetch("/api/log").then((r) => r.json()),
    ]);
    setBudgets(b);
    setLedger(l.blocks);
    setVerified(l.verified);
  }

  async function refreshDisclosures() {
    const d = await fetch("/api/disclosure").then((r) => r.json());
    setDisclosures(d);
  }

  useEffect(() => {
    fetch("/api/companies")
      .then((r) => r.json())
      .then(setCompanies);
    refreshSide();
    refreshDisclosures();
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [events]);

  function playNext() {
    const next = queueRef.current.shift();
    if (!next) {
      setRunning(false);
      refreshSide();
      refreshDisclosures();
      return;
    }
    setEvents((prev) => [...prev, next]);
    setTimeout(playNext, DELAY_BY_TYPE[next.type] ?? 800);
  }

  async function runScenario() {
    setRunning(true);
    setEvents([]);
    setMatching(null);
    setPairScores([]);
    setFinalProposal(null);
    const res = await fetch("/api/run", { method: "POST" });
    const data: RunResult = await res.json();
    setMatching(data.matching);
    setPairScores(data.pairScores ?? []);
    setFinalProposal(data.finalProposal);
    queueRef.current = [...data.events];
    playNext();
  }

  async function handleInterest(companyId: string, partnerId: string) {
    await fetch("/api/disclosure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "interest", companyId, partnerId }),
    });
    refreshDisclosures();
  }

  async function handleSignNDA(enterpriseId: string, startupId: string) {
    const res = await fetch("/api/nda", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enterpriseId, startupId }),
    });
    const data = await res.json();
    const key = `${enterpriseId}:${startupId}`;
    setNdaDocs((prev) => ({ ...prev, [key]: data.nda }));
    refreshDisclosures();
    refreshSide();
  }

  const tabs: { key: ViewTab; label: string }[] = [
    { key: "demo", label: "Discovery" },
    { key: "matches", label: "Matches" },
    { key: "roadmap", label: "Roadmap" },
  ];

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 p-6">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-blue-600">
              Palisade
            </h1>
            <p className="text-lg font-medium text-slate-700">
              Serendipity Engine
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Google検索では絶対に見つからないマッチを、秘密を守りながら発見する
            </p>
            <p className="text-xs italic text-slate-400">
              &ldquo;We&rsquo;re Tinder for corporate R&amp;D — AI agents find your perfect partner across industries without either side revealing their secrets.&rdquo;
            </p>
          </div>
          <div className="flex gap-1 rounded-lg border border-slate-200 bg-white p-1 text-sm shadow-sm">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setView(t.key)}
                className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                  view === t.key
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {view === "roadmap" ? (
        <Roadmap />
      ) : view === "matches" ? (
        /* Progressive Disclosure Match Cards */
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800">
            Progressive Disclosure — マッチング結果
          </h2>
          {pairScores.length === 0 && disclosures.filter((d) => d.level > 0).length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-slate-500">
                まず Discovery タブで &ldquo;Start Discovery&rdquo; を実行してください
              </p>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(pairScores.length > 0 ? pairScores : []).map((pair) => {
              const startup = companies.find((c) => c.id === pair.startup);
              const disc = disclosures.find(
                (d) => d.enterpriseId === pair.enterprise && d.startupId === pair.startup
              );
              const level = disc?.level ?? 0;
              const ndaKey = `${pair.enterprise}:${pair.startup}`;
              const nda = ndaDocs[ndaKey];

              return (
                <div
                  key={`${pair.enterprise}-${pair.startup}`}
                  className={`rounded-xl border p-5 shadow-sm transition-all ${
                    level >= 3
                      ? "border-green-300 bg-green-50"
                      : level >= 2
                        ? "border-blue-300 bg-blue-50"
                        : level >= 1
                          ? "border-slate-200 bg-white"
                          : "border-slate-200 bg-slate-50"
                  }`}
                >
                  {/* Level indicator */}
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[0, 1, 2, 3].map((l) => (
                          <div
                            key={l}
                            className={`h-2 w-6 rounded-full ${
                              l <= level ? "bg-blue-500" : "bg-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-medium text-slate-500">
                        Level {level}
                      </span>
                    </div>
                    <div className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
                      Serendipity: {Math.round(pair.serendipityScore * 100)}%
                    </div>
                  </div>

                  {/* Level 0: Anonymous */}
                  {level === 0 && (
                    <>
                      <div className="mb-2 text-sm font-medium text-slate-600">
                        Match Found
                      </div>
                      <p className="text-xs text-slate-400">
                        A company with complementary technology exists. Industry
                        distance: {Math.round(pair.industryDistance * 100)}%
                      </p>
                    </>
                  )}

                  {/* Level 1: Abstract hints */}
                  {level >= 1 && (
                    <>
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-lg">
                          {startup?.country === "Kazakhstan"
                            ? "🇰🇿"
                            : startup?.country === "China"
                              ? "🇨🇳"
                              : "🇯🇵"}
                        </span>
                        <span className="text-sm font-semibold text-slate-700">
                          {level >= 3 ? startup?.nameJa : `${startup?.country} Startup`}
                        </span>
                      </div>
                      <p className="mb-2 text-xs text-slate-600">
                        {disc?.levelData[1]?.abstractCapability ?? pair.matchReason}
                      </p>
                    </>
                  )}

                  {/* Level 2: More details + NDA */}
                  {level >= 2 && disc?.levelData[2] && (
                    <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50/50 p-3">
                      <p className="text-xs font-medium text-blue-800">
                        {disc.levelData[2].detailedCapability}
                      </p>
                      <p className="text-xs text-blue-600">
                        Scale: {disc.levelData[2].scale}
                      </p>
                    </div>
                  )}

                  {/* Level 3: Full reveal */}
                  {level >= 3 && disc?.levelData[3] && (
                    <div className="mb-3 rounded-lg border border-green-300 bg-green-50 p-3">
                      <p className="text-sm font-bold text-green-800">
                        {disc.levelData[3].companyName}
                      </p>
                      <p className="text-xs text-green-700">
                        {disc.levelData[3].contact}
                      </p>
                      <p className="text-xs text-green-600">
                        {disc.levelData[3].fullDetails}
                      </p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="mt-3 flex gap-2">
                    {level === 1 && (
                      <>
                        <button
                          onClick={() => handleInterest(pair.enterprise, pair.startup)}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
                        >
                          Interested (Enterprise)
                        </button>
                        <button
                          onClick={() => handleInterest(pair.startup, pair.enterprise)}
                          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-500"
                        >
                          Interested (Startup)
                        </button>
                      </>
                    )}
                    {level === 2 && !disc?.ndaSigned && (
                      <button
                        onClick={() => handleSignNDA(pair.enterprise, pair.startup)}
                        className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-500"
                      >
                        Generate &amp; Sign NDA
                      </button>
                    )}
                    {nda && (
                      <button
                        onClick={() => setShowNDA(showNDA === ndaKey ? null : ndaKey)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                      >
                        {showNDA === ndaKey ? "Hide NDA" : "View NDA"}
                      </button>
                    )}
                  </div>

                  {/* NDA document */}
                  {showNDA === ndaKey && nda && (
                    <div className="mt-3 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">
                          NDA #{nda.id}
                        </span>
                        <span className="text-xs text-slate-500">
                          {nda.governingLaw}
                        </span>
                      </div>
                      <pre className="whitespace-pre-wrap text-[10px] leading-relaxed text-slate-600">
                        {nda.fullText}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Demo View */
        <>
          <Vault companies={companies} budgets={budgets} />

          <div className="flex items-center gap-3">
            <button
              onClick={runScenario}
              disabled={running || companies.length === 0}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
            >
              {running ? "Discovering..." : "Start Discovery"}
            </button>
            <span className="text-xs text-slate-500">
              秘密を守りながら、異業種間の隠れた技術マッチを発見します
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
            <div
              ref={scrollRef}
              className="max-h-[70vh] space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              {events.length === 0 && !running && (
                <p className="text-sm text-slate-400">
                  &ldquo;Start Discovery&rdquo; を押すと、各社のAI
                  Agentが秘密を守りながらマッチング相手を探す様子がリアルタイムで表示されます。
                </p>
              )}
              {events.map((ev) => (
                <EventCard key={ev.id} ev={ev} companies={companies} />
              ))}
            </div>
            <div className="space-y-4">
              {matching && (
                <MatchingPanel
                  matching={matching}
                  companies={companies}
                  pairScores={pairScores}
                />
              )}
              <LedgerPanel blocks={ledger} verified={verified} />
              <AttackBox companies={companies} onDone={refreshSide} />
              {finalProposal && (
                <RevealPanel companies={companies} onDone={refreshSide} />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
