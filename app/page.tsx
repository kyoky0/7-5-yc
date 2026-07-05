"use client";

import { useEffect, useRef, useState } from "react";
import { LedgerBlock, MatchingResult, RunResult, TimelineEvent } from "@/lib/types";
import { CompanyMeta } from "./components/types";
import { Vault } from "./components/Vault";
import { EventCard } from "./components/EventCard";
import { LedgerPanel } from "./components/LedgerPanel";
import { MatchingPanel } from "./components/MatchingPanel";
import { AttackBox } from "./components/AttackBox";
import { RevealPanel } from "./components/RevealPanel";
import { Roadmap } from "./components/Roadmap";

const DELAY_BY_TYPE: Record<TimelineEvent["type"], number> = {
  draft: 1400,
  wall_flag: 900,
  wall_redact: 1300,
  wall_block: 1300,
  safe_message: 1100,
  matching: 1800,
  critique: 1600,
  final: 2200,
  log: 350,
};

export default function Home() {
  const [view, setView] = useState<"demo" | "roadmap">("demo");
  const [companies, setCompanies] = useState<CompanyMeta[]>([]);
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [ledger, setLedger] = useState<LedgerBlock[]>([]);
  const [verified, setVerified] = useState(true);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [matching, setMatching] = useState<MatchingResult | null>(null);
  const [finalProposal, setFinalProposal] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const queueRef = useRef<TimelineEvent[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function refreshSide() {
    const [b, l] = await Promise.all([fetch("/api/budgets").then((r) => r.json()), fetch("/api/log").then((r) => r.json())]);
    setBudgets(b);
    setLedger(l.blocks);
    setVerified(l.verified);
  }

  useEffect(() => {
    fetch("/api/companies")
      .then((r) => r.json())
      .then(setCompanies);
    refreshSide();
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [events]);

  function playNext() {
    const next = queueRef.current.shift();
    if (!next) {
      setRunning(false);
      refreshSide();
      return;
    }
    setEvents((prev) => [...prev, next]);
    setTimeout(playNext, DELAY_BY_TYPE[next.type] ?? 900);
  }

  async function runScenario() {
    setRunning(true);
    setEvents([]);
    setMatching(null);
    setFinalProposal(null);
    const res = await fetch("/api/run", { method: "POST" });
    const data: RunResult = await res.json();
    setMatching(data.matching);
    setFinalProposal(data.finalProposal);
    queueRef.current = [...data.events];
    playNext();
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">🛡 Palisade</h1>
            <p className="text-sm text-slate-400">
              秘密は壁の向こうに留まる。壁を越えるのは、抽象化された洞察だけ。 — Private Multi-Company Agent Collaboration
            </p>
          </div>
          <div className="flex gap-1 rounded-lg border border-slate-800 bg-slate-900/60 p-1 text-sm">
            <button
              onClick={() => setView("demo")}
              className={`rounded px-3 py-1 ${view === "demo" ? "bg-indigo-600 text-white" : "text-slate-400"}`}
            >
              Demo
            </button>
            <button
              onClick={() => setView("roadmap")}
              className={`rounded px-3 py-1 ${view === "roadmap" ? "bg-indigo-600 text-white" : "text-slate-400"}`}
            >
              Roadmap
            </button>
          </div>
        </div>
      </header>

      {view === "roadmap" ? (
        <Roadmap />
      ) : (
        <>
          <Vault companies={companies} budgets={budgets} />

          <div className="flex items-center gap-3">
            <button
              onClick={runScenario}
              disabled={running || companies.length === 0}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow shadow-indigo-900/40 hover:bg-indigo-500 disabled:opacity-50"
            >
              {running ? "協働を実行中…" : "▶ 3社の協働を実行する"}
            </button>
            <span className="text-xs text-slate-500">
              課題: 「高齢者向けに、3社の強みを組み合わせた新しい商品・事業を考えてほしい(社外秘データは一切開示しないこと)」
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
            <div ref={scrollRef} className="max-h-[70vh] space-y-3 overflow-y-auto rounded-lg border border-slate-900 bg-slate-950/40 p-4">
              {events.length === 0 && !running && (
                <p className="text-sm text-slate-600">「▶ 3社の協働を実行する」を押すと、各社Private AgentがPrivacy Wallを介して協働する様子がここに流れます。</p>
              )}
              {events.map((ev) => (
                <EventCard key={ev.id} ev={ev} companies={companies} />
              ))}
            </div>
            <div className="space-y-4">
              {matching && <MatchingPanel matching={matching} companies={companies} />}
              <LedgerPanel blocks={ledger} verified={verified} />
              <AttackBox companies={companies} onDone={refreshSide} />
              {finalProposal && <RevealPanel companies={companies} onDone={refreshSide} />}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
