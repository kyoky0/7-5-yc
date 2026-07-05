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
import { EventCard } from "./components/EventCard";
import { LedgerPanel } from "./components/LedgerPanel";
import { AttackBox } from "./components/AttackBox";
import { Roadmap } from "./components/Roadmap";

const DELAY_BY_TYPE: Record<TimelineEvent["type"], number> = {
  draft: 900,
  wall_flag: 600,
  wall_redact: 800,
  wall_block: 800,
  safe_message: 600,
  matching: 1200,
  serendipity: 1400,
  critique: 1000,
  final: 1600,
  log: 200,
};

interface Delegate {
  name: string;
  nameJa: string;
  role: string;
  avatar: string;
}

const DELEGATES: Record<string, Delegate[]> = {
  megacorp: [
    { name: "Tanaka Yuki", nameJa: "田中 悠紀", role: "R&D Director, Battery Division", avatar: "TY" },
    { name: "Suzuki Akira", nameJa: "鈴木 明", role: "VP Engineering, Thermal Management", avatar: "SA" },
  ],
  altai: [
    { name: "Aliya Nursultan", nameJa: "アリヤ", role: "CEO / Co-founder", avatar: "AN" },
    { name: "Daulet Akhmetov", nameJa: "ダウレト", role: "Head of Materials Science", avatar: "DA" },
  ],
  nanoshield: [
    { name: "Wei Chen", nameJa: "陳 威", role: "CTO", avatar: "WC" },
    { name: "Liu Min", nameJa: "劉 敏", role: "Business Development", avatar: "LM" },
  ],
  biowrap: [
    { name: "Kimura Saya", nameJa: "木村 紗也", role: "CEO", avatar: "KS" },
    { name: "Nakamura Hiroshi", nameJa: "中村 浩", role: "Chief Materials Officer", avatar: "NH" },
  ],
};

const MEETING_TEMPLATES: Record<string, {
  entPerson: number;
  suPerson: number;
  time: string;
  room: string;
  agenda: string;
  agendaJa: string;
}> = {
  "megacorp:altai": {
    entPerson: 0, suPerson: 0,
    time: "10:30", room: "Room A",
    agenda: "High-temperature ceramic insulation for lithium-ion battery thermal management",
    agendaJa: "リチウムイオン電池の熱管理向け高温セラミック断熱材",
  },
  "megacorp:nanoshield": {
    entPerson: 1, suPerson: 0,
    time: "11:00", room: "Room B",
    agenda: "Nano-scale protective coating for automotive thermal systems",
    agendaJa: "自動車熱システム向けナノスケール保護コーティング",
  },
  "megacorp:biowrap": {
    entPerson: 0, suPerson: 1,
    time: "11:30", room: "Room A",
    agenda: "Bio-polymer housing for high-density battery electronics",
    agendaJa: "高密度バッテリー電子部品向けバイオポリマー筐体",
  },
};

type Phase = "idle" | "running" | "done";

function countryFlag(country: string): string {
  const flags: Record<string, string> = {
    Japan: "\u{1F1EF}\u{1F1F5}", Kazakhstan: "\u{1F1F0}\u{1F1FF}",
    China: "\u{1F1E8}\u{1F1F3}", USA: "\u{1F1FA}\u{1F1F8}",
  };
  return flags[country] ?? "\u{1F30D}";
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [companies, setCompanies] = useState<CompanyMeta[]>([]);
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [ledger, setLedger] = useState<LedgerBlock[]>([]);
  const [verified, setVerified] = useState(true);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [matching, setMatching] = useState<MatchingResult | null>(null);
  const [pairScores, setPairScores] = useState<PairScore[]>([]);
  const [finalProposal, setFinalProposal] = useState<string | null>(null);
  const [disclosures, setDisclosures] = useState<DisclosureState[]>([]);
  const [ndaDocs, setNdaDocs] = useState<Record<string, NDADocument>>({});
  const [showNDA, setShowNDA] = useState<string | null>(null);
  const [expandTrust, setExpandTrust] = useState(false);
  const [expandRoadmap, setExpandRoadmap] = useState(false);
  const [expandFeed, setExpandFeed] = useState(true);
  const queueRef = useRef<TimelineEvent[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

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
    fetch("/api/companies").then((r) => r.json()).then(setCompanies);
    refreshSide();
    refreshDisclosures();
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [events]);

  function playNext() {
    const next = queueRef.current.shift();
    if (!next) {
      setPhase("done");
      refreshSide();
      refreshDisclosures();
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 500);
      return;
    }
    setEvents((prev) => [...prev, next]);
    setTimeout(playNext, DELAY_BY_TYPE[next.type] ?? 500);
  }

  async function runScenario() {
    setPhase("running");
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ━━━ HERO ━━━ */}
      <header className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 px-6 py-16 text-white lg:px-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-blue-400 blur-3xl" />
          <div className="absolute right-1/4 bottom-1/4 h-48 w-48 rounded-full bg-cyan-400 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-5xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Compiled AI Hackathon #3 — YC RFS
          </div>
          <h1 className="mb-1 text-5xl font-black tracking-tight lg:text-7xl">
            Agent Expo
          </h1>
          <p className="mb-6 text-xl font-medium text-blue-200 lg:text-2xl">
            Secure Agent-to-Agent Conference Matching
          </p>
          <p className="max-w-3xl text-lg leading-relaxed text-blue-100/90 lg:text-xl">
            We replaced <span className="font-bold text-white">2 days of random conference networking</span> with{" "}
            <span className="font-bold text-white">10 minutes of secure agent-to-agent matching</span>.
          </p>
          <p className="mt-3 max-w-3xl text-base text-blue-200/80">
            企業のAI代理人が参加するセキュアな展示会。各AIは会社の目的・部署・人・開示ルールを理解し、
            TEE内で他社AIと会話。どの会社の誰と誰が会うべきか、いつ・何を話すべきかだけを人間に渡します。
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10 lg:px-12">

        {/* ━━━ TEE ARCHITECTURE DIAGRAM ━━━ */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold text-slate-800">How It Works</h2>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr]">
              {/* Left: Inputs */}
              <div className="space-y-3">
                <div className="text-center text-sm font-bold uppercase tracking-wider text-slate-400">
                  Each Company Sends
                </div>
                {["Goals & Priorities", "Org Chart & People", "Calendars & Availability", "Disclosure Policies"].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <span className="text-sm font-medium text-slate-700">{item}</span>
                    <span className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">encrypted</span>
                  </div>
                ))}
              </div>

              {/* Center: TEE */}
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="text-slate-300">&#x2193; &#x2193; &#x2193;</div>
                <div className="rounded-2xl border-2 border-blue-500 bg-blue-50 p-6 text-center shadow-lg">
                  <div className="mb-1 text-xs font-bold uppercase tracking-wider text-blue-600">
                    Trusted Execution Environment
                  </div>
                  <div className="mb-2 text-lg font-black text-blue-800">
                    Secure Match Room
                  </div>
                  <div className="text-sm text-blue-600">
                    Agent A &#x2194; Agent B
                  </div>
                  <div className="mt-2 text-xs text-blue-500">
                    Operators cannot see data inside
                  </div>
                </div>
                <div className="text-slate-300">&#x2193; &#x2193; &#x2193;</div>
              </div>

              {/* Right: Outputs */}
              <div className="space-y-3">
                <div className="text-center text-sm font-bold uppercase tracking-wider text-slate-400">
                  Approved Outputs Only
                </div>
                {[
                  { label: "Who should meet", icon: "person" },
                  { label: "Why they should meet", icon: "reason" },
                  { label: "Suggested time & room", icon: "time" },
                  { label: "What can be disclosed", icon: "shield" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-sm font-medium text-slate-700">{item.label}</span>
                    <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">safe</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ━━━ COMPANY DELEGATES ━━━ */}
        <section className="mb-12">
          <h2 className="mb-2 text-2xl font-bold text-slate-800">Company Delegates</h2>
          <p className="mb-6 text-base text-slate-500">
            4社 / 3か国 / 8名のAI代理人がTEE内で交渉
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {companies.map((c) => {
              const delegates = DELEGATES[c.id] ?? [];
              return (
                <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold text-white"
                        style={{ background: c.color }}
                      >
                        {c.nameJa[0]}
                      </div>
                      <div>
                        <div className="text-lg font-bold text-slate-800">{c.nameJa}</div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <span>{countryFlag(c.country)}</span>
                          <span>{c.industry}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold text-white ${
                      c.companyRole === "enterprise" ? "bg-blue-600" : "bg-emerald-600"
                    }`}>
                      {c.companyRole === "enterprise" ? "Enterprise" : "Startup"}
                    </span>
                  </div>

                  {/* Delegates */}
                  <div className="mb-3 space-y-2">
                    {delegates.map((d) => (
                      <div key={d.name} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ background: c.color, opacity: 0.8 }}
                        >
                          {d.avatar}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-700">{d.nameJa}</div>
                          <div className="text-xs text-slate-500">{d.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Secret vault + budget */}
                  <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-400">
                    <span className="font-bold text-slate-500">Private Context</span>{" "}
                    — Goals, org chart, calendars, disclosure rules{" "}
                    <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-blue-700">encrypted in TEE</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span className="font-medium">Specificity Budget</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-blue-500 transition-all"
                        style={{ width: `${((budgets[c.id] ?? 5) / 5) * 100}%` }}
                      />
                    </div>
                    <span className="font-mono font-bold">{budgets[c.id] ?? 5}/5</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ━━━ START MATCHING ━━━ */}
        <section className="mb-12">
          <div className="flex flex-col items-center gap-5 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-10">
            {phase === "idle" && (
              <>
                <h2 className="text-2xl font-bold text-blue-800">Ready to Match</h2>
                <p className="max-w-lg text-center text-base text-slate-600">
                  8名のAI代理人がTEEのSecure Match Roomに入り、各社の秘密を守りながら
                  最適なミーティングを発見します。
                </p>
                <button
                  onClick={runScenario}
                  disabled={companies.length === 0}
                  className="pulse-glow rounded-2xl bg-blue-600 px-12 py-5 text-xl font-black text-white shadow-xl transition-all hover:bg-blue-500 hover:shadow-2xl disabled:opacity-50"
                >
                  Enter the Match Room
                </button>
              </>
            )}
            {phase === "running" && (
              <>
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 animate-ping rounded-full bg-blue-500" />
                  <h2 className="text-2xl font-bold text-blue-800">Agents Negotiating in TEE...</h2>
                </div>
                <p className="text-base text-slate-600">
                  各エージェントがSecure Match Room内で交渉中。秘密は一切外に出ません。
                </p>
              </>
            )}
            {phase === "done" && (
              <>
                <svg className="h-8 w-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <h2 className="text-2xl font-bold text-emerald-700">Matching Complete</h2>
                <p className="text-base text-slate-600">
                  {pairScores.filter((p) => p.serendipityScore >= 0.45).length} 件の推奨ミーティング / {pairScores.filter((p) => p.serendipityScore < 0.45).length} 件スキップ
                </p>
              </>
            )}
          </div>
        </section>

        {/* ━━━ LIVE FEED (collapsible during/after run) ━━━ */}
        {(phase === "running" || phase === "done") && (
          <section className="section-enter mb-12">
            <button
              onClick={() => setExpandFeed(!expandFeed)}
              className="mb-3 flex w-full items-center justify-between text-left"
            >
              <div>
                <h2 className="text-xl font-bold text-slate-800">Agent Negotiation Feed</h2>
                <p className="text-sm text-slate-500">TEE内での各エージェントの交渉プロセス</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-400">{events.length} events</span>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                  verified ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                }`}>
                  {verified ? "Chain Verified" : "TAMPERED"}
                </span>
                <svg className={`h-5 w-5 text-slate-400 transition-transform ${expandFeed ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            {expandFeed && (
              <div ref={scrollRef}
                className="max-h-[40vh] space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                {events.map((ev) => (
                  <EventCard key={ev.id} ev={ev} companies={companies} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ━━━ MEETING SCHEDULE — THE KEY OUTPUT ━━━ */}
        {phase === "done" && pairScores.length > 0 && (
          <section ref={resultsRef} className="section-enter mb-12">
            <div className="mb-6">
              <h2 className="text-3xl font-black text-slate-800">
                Recommended Meetings
              </h2>
              <p className="mt-1 text-lg text-slate-500">
                TEEが導いた最適なマッチ — Google検索では絶対に見つからない組み合わせ
              </p>
              <div className="mt-3 flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="text-slate-600">Best Match</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="text-slate-600">Recommended</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-slate-300" />
                  <span className="text-slate-600">Low Priority</span>
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {[...pairScores].sort((a, b) => b.serendipityScore - a.serendipityScore).map((pair, idx) => {
                const priority = idx === 0 ? "best" : pair.serendipityScore >= 0.50 ? "recommended" : "low";
                const enterprise = companies.find((c) => c.id === pair.enterprise);
                const startup = companies.find((c) => c.id === pair.startup);
                const disc = disclosures.find(
                  (d) => d.enterpriseId === pair.enterprise && d.startupId === pair.startup
                );
                const level = disc?.level ?? 0;
                const ndaKey = `${pair.enterprise}:${pair.startup}`;
                const nda = ndaDocs[ndaKey];

                const meetingKey = `${pair.enterprise}:${pair.startup}`;
                const meeting = MEETING_TEMPLATES[meetingKey];
                const entDelegates = DELEGATES[pair.enterprise] ?? [];
                const suDelegates = DELEGATES[pair.startup] ?? [];
                const entPerson = meeting ? entDelegates[meeting.entPerson] : entDelegates[0];
                const suPerson = meeting ? suDelegates[meeting.suPerson] : suDelegates[0];

                return (
                  <div
                    key={meetingKey}
                    className={`rounded-2xl border-2 p-6 shadow-sm transition-all ${
                      level >= 3
                        ? "border-emerald-400 bg-emerald-50/30"
                        : level >= 2
                          ? "border-blue-400 bg-blue-50/30"
                          : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      {/* Left: People */}
                      <div className="flex items-center gap-4">
                        {/* Enterprise person */}
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white"
                            style={{ background: enterprise?.color }}>
                            {entPerson?.avatar ?? "?"}
                          </div>
                          <div>
                            <div className="text-base font-bold text-slate-800">
                              {entPerson?.nameJa ?? "---"}
                            </div>
                            <div className="text-xs text-slate-500">
                              {entPerson?.role}
                            </div>
                            <div className="text-xs text-slate-400">
                              {enterprise?.nameJa}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-center px-2">
                          <span className="text-2xl text-blue-400">&#x2194;</span>
                        </div>

                        {/* Startup person */}
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white"
                            style={{ background: startup?.color }}>
                            {level >= 3 ? (suPerson?.avatar ?? "?") : "?"}
                          </div>
                          <div>
                            <div className="text-base font-bold text-slate-800">
                              {level >= 3 ? suPerson?.nameJa : `${startup?.country} delegate`}
                            </div>
                            <div className="text-xs text-slate-500">
                              {level >= 3 ? suPerson?.role : "Role hidden"}
                            </div>
                            <div className="text-xs text-slate-400">
                              {level >= 3 ? startup?.nameJa : `${countryFlag(startup?.country ?? "")} Undisclosed`}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Score + Level */}
                      <div className="flex flex-col items-end gap-2">
                        <div className={`rounded-full px-3 py-1 text-xs font-black ${
                          priority === "best" ? "bg-emerald-100 text-emerald-700" :
                          priority === "recommended" ? "bg-blue-100 text-blue-700" :
                          "bg-slate-100 text-slate-500"
                        }`}>
                          {priority === "best" ? "Best Match" : priority === "recommended" ? "Recommended" : "Low Priority"}
                        </div>
                        <div className="rounded-full bg-amber-100 px-4 py-1.5 text-sm font-black text-amber-800">
                          Serendipity {Math.round(pair.serendipityScore * 100)}%
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {[0, 1, 2, 3].map((l) => (
                              <div key={l} className={`h-2 w-6 rounded-full ${
                                l <= level
                                  ? level >= 3 ? "bg-emerald-500" : "bg-blue-500"
                                  : "bg-slate-200"
                              }`} />
                            ))}
                          </div>
                          <span className="text-xs font-bold text-slate-500">L{level}</span>
                        </div>
                      </div>
                    </div>

                    {/* Meeting details */}
                    {meeting && (
                      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-700">
                          {meeting.time}
                        </span>
                        <span className="rounded-full bg-slate-200 px-3 py-1 text-sm font-medium text-slate-600">
                          {meeting.room}
                        </span>
                        <span className="text-sm text-slate-600">
                          {meeting.agendaJa}
                        </span>
                      </div>
                    )}

                    {/* Level-specific details */}
                    {level >= 1 && disc?.levelData[1] && (
                      <p className="mt-3 text-sm text-slate-600">
                        {disc.levelData[1].abstractCapability}
                      </p>
                    )}

                    {level >= 2 && disc?.levelData[2] && (
                      <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
                        <p className="text-sm font-medium text-blue-800">{disc.levelData[2].detailedCapability}</p>
                        <p className="mt-1 text-xs text-blue-600">Scale: {disc.levelData[2].scale}</p>
                      </div>
                    )}

                    {level >= 3 && disc?.levelData[3] && (
                      <div className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50 p-3">
                        <p className="text-base font-bold text-emerald-800">{disc.levelData[3].companyName}</p>
                        <p className="text-sm text-emerald-700">{disc.levelData[3].contact}</p>
                        <p className="mt-1 text-sm text-emerald-600">{disc.levelData[3].fullDetails}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {level === 1 && (
                        <>
                          <button onClick={() => handleInterest(pair.enterprise, pair.startup)}
                            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-500">
                            Enterprise: Interested
                          </button>
                          <button onClick={() => handleInterest(pair.startup, pair.enterprise)}
                            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-500">
                            Startup: Interested
                          </button>
                        </>
                      )}
                      {level === 2 && !disc?.ndaSigned && (
                        <button onClick={() => handleSignNDA(pair.enterprise, pair.startup)}
                          className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-amber-400">
                          Generate & Sign NDA
                        </button>
                      )}
                      {nda && (
                        <button onClick={() => setShowNDA(showNDA === ndaKey ? null : ndaKey)}
                          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
                          {showNDA === ndaKey ? "Hide NDA" : "View NDA"}
                        </button>
                      )}
                    </div>

                    {/* NDA */}
                    {showNDA === ndaKey && nda && (
                      <div className="mt-4 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4">
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="font-bold text-slate-700">NDA #{nda.id}</span>
                          <span className="text-slate-500">{nda.governingLaw}</span>
                        </div>
                        <pre className="whitespace-pre-wrap text-xs leading-relaxed text-slate-600">{nda.fullText}</pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Skipped / Not Recommended */}
            <div className="mt-6">
              <h3 className="mb-3 text-lg font-bold text-slate-400">Evaluated &amp; Skipped</h3>
              <div className="space-y-2">
                {[
                  { a: "altai", b: "nanoshield", reason: "No complementary capabilities — both in materials/coatings sector, overlapping market" },
                  { a: "altai", b: "biowrap", reason: "Minimal synergy — ceramics ↔ bio-polymer with no shared customer vertical" },
                  { a: "nanoshield", b: "biowrap", reason: "Similar stage, overlapping geography risk — no enterprise anchor for partnership" },
                ].map((skip) => {
                  const compA = companies.find((c) => c.id === skip.a);
                  const compB = companies.find((c) => c.id === skip.b);
                  return (
                    <div key={`${skip.a}:${skip.b}`}
                      className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 px-5 py-3 opacity-60">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ background: compA?.color ?? "#94a3b8" }}>
                          {compA?.nameJa[0] ?? "?"}
                        </div>
                        <span className="text-sm font-medium text-slate-500">{compA?.nameJa}</span>
                      </div>
                      <span className="text-slate-300">&#x2194;</span>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ background: compB?.color ?? "#94a3b8" }}>
                          {compB?.nameJa[0] ?? "?"}
                        </div>
                        <span className="text-sm font-medium text-slate-500">{compB?.nameJa}</span>
                      </div>
                      <span className="ml-auto rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-500">
                        Skipped
                      </span>
                      <span className="max-w-xs text-xs text-slate-400">{skip.reason}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ━━━ TRUST & SECURITY (collapsible) ━━━ */}
        {phase === "done" && (
          <section className="section-enter mb-8">
            <button
              onClick={() => setExpandTrust(!expandTrust)}
              className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 py-4 text-left shadow-sm transition-all hover:shadow-md"
            >
              <div>
                <h2 className="text-xl font-bold text-slate-800">Trust & Security</h2>
                <p className="text-sm text-slate-500">監査ログ + Red-Team攻撃テスト</p>
              </div>
              <svg className={`h-5 w-5 text-slate-400 transition-transform ${expandTrust ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expandTrust && (
              <div className="mt-4 grid gap-6 section-enter lg:grid-cols-2">
                <LedgerPanel blocks={ledger} verified={verified} />
                <AttackBox companies={companies} onDone={refreshSide} />
              </div>
            )}
          </section>
        )}

        {/* ━━━ ROADMAP (collapsible) ━━━ */}
        <section className="mb-12">
          <button
            onClick={() => setExpandRoadmap(!expandRoadmap)}
            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 py-4 text-left shadow-sm transition-all hover:shadow-md"
          >
            <div>
              <h2 className="text-xl font-bold text-slate-800">Architecture Roadmap</h2>
              <p className="text-sm text-slate-500">TEE + Privacy Wallのプロダクション拡張計画</p>
            </div>
            <svg className={`h-5 w-5 text-slate-400 transition-transform ${expandRoadmap ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandRoadmap && (
            <div className="mt-4 section-enter">
              <Roadmap />
            </div>
          )}
        </section>
      </div>

      {/* ━━━ FOOTER ━━━ */}
      <footer className="border-t border-slate-200 bg-white px-6 py-8 text-center">
        <p className="text-sm font-medium text-slate-500">
          Agent Expo — Built with TEE, SimHash/LSH, Progressive Disclosure, Cross-Border NDA
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Developed with GStack/GBrain methodology for AI-native rapid prototyping
        </p>
      </footer>
    </div>
  );
}
