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
  role: string;
  avatar: string;
}

const DELEGATES: Record<string, Delegate[]> = {
  megacorp: [
    { name: "Tanaka Yuki", role: "R&D Director, Battery Division", avatar: "TY" },
    { name: "Suzuki Akira", role: "VP Engineering, Thermal Management", avatar: "SA" },
  ],
  altai: [
    { name: "Aliya Nursultan", role: "CEO / Co-founder", avatar: "AN" },
    { name: "Daulet Akhmetov", role: "Head of Materials Science", avatar: "DA" },
  ],
  nanoshield: [
    { name: "Wei Chen", role: "CTO", avatar: "WC" },
    { name: "Liu Min", role: "Business Development", avatar: "LM" },
  ],
  biowrap: [
    { name: "Kimura Saya", role: "CEO", avatar: "KS" },
    { name: "Nakamura Hiroshi", role: "Chief Materials Officer", avatar: "NH" },
  ],
};

const MEETING_TEMPLATES: Record<string, {
  entPerson: number;
  suPerson: number;
  time: string;
  room: string;
  agenda: string;
}> = {
  "megacorp:altai": {
    entPerson: 0, suPerson: 0,
    time: "10:30", room: "Room A",
    agenda: "High-temperature ceramic insulation for lithium-ion battery thermal management",
  },
  "megacorp:nanoshield": {
    entPerson: 1, suPerson: 0,
    time: "11:00", room: "Room B",
    agenda: "Nano-scale protective coating for automotive thermal systems",
  },
  "megacorp:biowrap": {
    entPerson: 0, suPerson: 1,
    time: "11:30", room: "Room A",
    agenda: "Bio-polymer housing for high-density battery electronics",
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
  const [expandFeed, setExpandFeed] = useState(true);
  const [expandTrust, setExpandTrust] = useState(false);
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

  const sortedPairs = [...pairScores].sort((a, b) => b.serendipityScore - a.serendipityScore);
  const recommended = sortedPairs.filter((p) => p.serendipityScore >= 0.45);
  const skipped = sortedPairs.filter((p) => p.serendipityScore < 0.45);

  return (
    <div className="min-h-screen bg-white">

      {/* ===== HERO ===== */}
      <header className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 px-6 py-24 text-white lg:px-12 lg:py-32">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-blue-400 blur-3xl" />
          <div className="absolute right-1/3 bottom-1/4 h-64 w-64 rounded-full bg-cyan-400 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-sm font-semibold backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            YC RFS: Company Brain
          </div>
          <h1 className="mb-6 text-6xl font-black tracking-tight lg:text-8xl">
            Agent Expo
          </h1>
          <p className="mb-8 text-2xl font-medium text-blue-100 lg:text-3xl">
            Your AI agent reads your company secrets.<br />
            Finds the perfect partner.<br />
            <span className="text-white font-bold">No one else sees a thing.</span>
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <div className="rounded-2xl bg-white/10 px-8 py-4 backdrop-blur-sm">
              <div className="text-4xl font-black lg:text-5xl">2 days</div>
              <div className="text-sm text-blue-200">random networking</div>
            </div>
            <div className="text-4xl font-black text-blue-300">&rarr;</div>
            <div className="rounded-2xl bg-white/10 px-8 py-4 backdrop-blur-sm">
              <div className="text-4xl font-black text-emerald-400 lg:text-5xl">10 min</div>
              <div className="text-sm text-blue-200">AI-matched meetings</div>
            </div>
          </div>
        </div>
      </header>

      {/* ===== HOW IT WORKS — 3 steps ===== */}
      <section className="mx-auto max-w-5xl px-6 py-20 lg:px-12">
        <h2 className="mb-16 text-center text-4xl font-black text-slate-800 lg:text-5xl">
          How It Works
        </h2>
        <div className="grid gap-8 lg:grid-cols-3">
          {[
            {
              step: "01",
              title: "Upload Secrets",
              desc: "Each company submits goals, org chart, and calendars — encrypted into a TEE.",
              icon: (
                <svg className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                </svg>
              ),
            },
            {
              step: "02",
              title: "Agents Negotiate",
              desc: "AI agents match inside a Secure Room. They see everything. Operators see nothing.",
              icon: (
                <svg className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              ),
            },
            {
              step: "03",
              title: "Get Your Schedule",
              desc: "Who to meet, why, when, and where. Only safe outputs leave the enclave.",
              icon: (
                <svg className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              ),
            },
          ].map((s) => (
            <div key={s.step} className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                  {s.icon}
                </div>
                <span className="text-5xl font-black text-blue-100">{s.step}</span>
              </div>
              <h3 className="mb-2 text-2xl font-bold text-slate-800">{s.title}</h3>
              <p className="text-lg text-slate-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== TEE EXPLAINER — one sentence ===== */}
      <section className="bg-slate-50 px-6 py-16 lg:px-12">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-4 text-3xl font-black text-slate-800 lg:text-4xl">
            Trusted Execution Environment
          </h2>
          <p className="text-xl text-slate-500 lg:text-2xl">
            A hardware-isolated room where AI reads company secrets,<br className="hidden lg:block" />
            but <span className="font-bold text-slate-800">operators, hackers, and other companies</span> cannot.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 py-12 lg:px-12">

        {/* ===== COMPANIES — compact cards ===== */}
        <section className="mb-16">
          <h2 className="mb-2 text-3xl font-black text-slate-800">
            Today&apos;s Participants
          </h2>
          <p className="mb-8 text-lg text-slate-400">
            4 companies &middot; 3 countries &middot; 8 delegates
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {companies.map((c) => {
              const delegates = DELEGATES[c.id] ?? [];
              return (
                <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-xl text-lg font-bold text-white"
                        style={{ background: c.color }}
                      >
                        {c.name?.[0] ?? "?"}
                      </div>
                      <div>
                        <div className="text-lg font-bold text-slate-800">{c.name ?? c.nameJa}</div>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
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
                  <div className="space-y-1.5">
                    {delegates.map((d) => (
                      <div key={d.name} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2">
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ background: c.color, opacity: 0.8 }}
                        >
                          {d.avatar}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-700">{d.name}</div>
                          <div className="text-xs text-slate-400">{d.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ===== LIVE DEMO — start button ===== */}
        <section className="mb-16">
          <div className="flex flex-col items-center gap-6 rounded-3xl border-2 border-dashed border-blue-200 bg-blue-50/40 p-12">
            {phase === "idle" && (
              <>
                <h2 className="text-4xl font-black text-blue-800 lg:text-5xl">Live Demo</h2>
                <p className="max-w-lg text-center text-xl text-slate-500">
                  8 AI agents enter the Secure Match Room. Watch them negotiate in real time.
                </p>
                <button
                  onClick={runScenario}
                  disabled={companies.length === 0}
                  className="pulse-glow rounded-2xl bg-blue-600 px-14 py-6 text-2xl font-black text-white shadow-xl transition-all hover:bg-blue-500 hover:shadow-2xl disabled:opacity-50"
                >
                  Start Matching
                </button>
              </>
            )}
            {phase === "running" && (
              <>
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 animate-ping rounded-full bg-blue-500" />
                  <h2 className="text-3xl font-black text-blue-800">Agents Negotiating...</h2>
                </div>
                <p className="text-lg text-slate-500">Secrets stay inside the TEE. Only safe outputs come out.</p>
              </>
            )}
            {phase === "done" && (
              <>
                <svg className="h-10 w-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <h2 className="text-3xl font-black text-emerald-700">Matching Complete</h2>
                <p className="text-lg text-slate-500">
                  {recommended.length} meetings recommended &middot; {skipped.length} pairs skipped
                </p>
              </>
            )}
          </div>
        </section>

        {/* ===== LIVE FEED ===== */}
        {(phase === "running" || phase === "done") && (
          <section className="section-enter mb-16">
            <button
              onClick={() => setExpandFeed(!expandFeed)}
              className="mb-3 flex w-full items-center justify-between text-left"
            >
              <h3 className="text-2xl font-bold text-slate-800">Agent Negotiation Feed</h3>
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

        {/* ===== RECOMMENDED MEETINGS ===== */}
        {phase === "done" && pairScores.length > 0 && (
          <section ref={resultsRef} className="section-enter mb-16">
            <h2 className="mb-2 text-4xl font-black text-slate-800">
              Recommended Meetings
            </h2>
            <p className="mb-8 text-lg text-slate-400">
              Matches you would never find on Google or LinkedIn.
            </p>

            <div className="space-y-4">
              {sortedPairs.filter((p) => p.serendipityScore >= 0.45).map((pair, idx) => {
                const priority = idx === 0 ? "best" : "recommended";
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
                      level >= 3 ? "border-emerald-400 bg-emerald-50/30"
                      : level >= 2 ? "border-blue-400 bg-blue-50/30"
                      : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white"
                            style={{ background: enterprise?.color }}>
                            {entPerson?.avatar ?? "?"}
                          </div>
                          <div>
                            <div className="text-lg font-bold text-slate-800">{entPerson?.name ?? "---"}</div>
                            <div className="text-sm text-slate-400">{entPerson?.role}</div>
                            <div className="text-xs text-slate-300">{enterprise?.name ?? enterprise?.nameJa}</div>
                          </div>
                        </div>
                        <div className="px-2 text-3xl text-blue-300">&harr;</div>
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white"
                            style={{ background: startup?.color }}>
                            {level >= 3 ? (suPerson?.avatar ?? "?") : "?"}
                          </div>
                          <div>
                            <div className="text-lg font-bold text-slate-800">
                              {level >= 3 ? suPerson?.name : `${startup?.country} delegate`}
                            </div>
                            <div className="text-sm text-slate-400">
                              {level >= 3 ? suPerson?.role : "Identity hidden"}
                            </div>
                            <div className="text-xs text-slate-300">
                              {level >= 3 ? (startup?.name ?? startup?.nameJa) : `${countryFlag(startup?.country ?? "")} Undisclosed`}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className={`rounded-full px-4 py-1.5 text-sm font-black ${
                          priority === "best" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                        }`}>
                          {priority === "best" ? "Best Match" : "Recommended"}
                        </div>
                        <div className="rounded-full bg-amber-100 px-4 py-1.5 text-sm font-black text-amber-800">
                          Serendipity {Math.round(pair.serendipityScore * 100)}%
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {[0, 1, 2, 3].map((l) => (
                              <div key={l} className={`h-2 w-6 rounded-full ${
                                l <= level ? (level >= 3 ? "bg-emerald-500" : "bg-blue-500") : "bg-slate-200"
                              }`} />
                            ))}
                          </div>
                          <span className="text-xs font-bold text-slate-400">L{level}</span>
                        </div>
                      </div>
                    </div>

                    {meeting && (
                      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-700">{meeting.time}</span>
                        <span className="rounded-full bg-slate-200 px-3 py-1 text-sm font-medium text-slate-600">{meeting.room}</span>
                        <span className="text-sm text-slate-600">{meeting.agenda}</span>
                      </div>
                    )}

                    {level >= 1 && disc?.levelData[1] && (
                      <p className="mt-3 text-base text-slate-500">{disc.levelData[1].abstractCapability}</p>
                    )}
                    {level >= 2 && disc?.levelData[2] && (
                      <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
                        <p className="text-sm font-medium text-blue-800">{disc.levelData[2].detailedCapability}</p>
                        <p className="mt-1 text-xs text-blue-600">Scale: {disc.levelData[2].scale}</p>
                      </div>
                    )}
                    {level >= 3 && disc?.levelData[3] && (
                      <div className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50 p-3">
                        <p className="text-lg font-bold text-emerald-800">{disc.levelData[3].companyName}</p>
                        <p className="text-sm text-emerald-700">{disc.levelData[3].contact}</p>
                        <p className="mt-1 text-sm text-emerald-600">{disc.levelData[3].fullDetails}</p>
                      </div>
                    )}

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
                          Generate &amp; Sign NDA
                        </button>
                      )}
                      {nda && (
                        <button onClick={() => setShowNDA(showNDA === ndaKey ? null : ndaKey)}
                          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
                          {showNDA === ndaKey ? "Hide NDA" : "View NDA"}
                        </button>
                      )}
                    </div>

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

            {/* Skipped */}
            {skipped.length > 0 && (
              <div className="mt-8">
                <h3 className="mb-3 text-xl font-bold text-slate-300">Evaluated &amp; Skipped</h3>
                <div className="space-y-2">
                  {[
                    { a: "altai", b: "nanoshield", reason: "Overlapping sector — no complementary capabilities" },
                    { a: "altai", b: "biowrap", reason: "No shared customer vertical" },
                    { a: "nanoshield", b: "biowrap", reason: "Similar stage, no enterprise anchor" },
                  ].map((skip) => {
                    const compA = companies.find((c) => c.id === skip.a);
                    const compB = companies.find((c) => c.id === skip.b);
                    return (
                      <div key={`${skip.a}:${skip.b}`}
                        className="flex items-center gap-4 rounded-xl bg-slate-50 px-5 py-3 opacity-50">
                        <span className="text-sm font-medium text-slate-400">{compA?.name ?? compA?.nameJa}</span>
                        <span className="text-slate-300">&harr;</span>
                        <span className="text-sm font-medium text-slate-400">{compB?.name ?? compB?.nameJa}</span>
                        <span className="ml-auto text-xs text-slate-300">{skip.reason}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ===== TRUST — collapsible ===== */}
        {phase === "done" && (
          <section className="section-enter mb-12">
            <button
              onClick={() => setExpandTrust(!expandTrust)}
              className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 py-4 text-left shadow-sm hover:shadow-md"
            >
              <h3 className="text-xl font-bold text-slate-800">Trust &amp; Security Details</h3>
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
      </div>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-slate-100 bg-white px-6 py-10 text-center">
        <p className="text-lg font-bold text-slate-800">Agent Expo</p>
        <p className="mt-1 text-sm text-slate-400">
          TEE &middot; SimHash/LSH &middot; Privacy Wall &middot; Progressive Disclosure &middot; Cross-Border NDA
        </p>
        <p className="mt-2 text-xs text-slate-300">
          Built with GStack &middot; Compiled AI Hackathon #3
        </p>
      </footer>
    </div>
  );
}
