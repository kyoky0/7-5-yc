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
  draft: 900, wall_flag: 600, wall_redact: 800, wall_block: 800,
  safe_message: 600, matching: 1200, serendipity: 1400,
  critique: 1000, final: 1600, log: 200,
};

interface Delegate { name: string; role: string; avatar: string; }

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
  entPerson: number; suPerson: number; time: string; room: string; agenda: string;
}> = {
  "megacorp:altai": { entPerson: 0, suPerson: 0, time: "10:30", room: "Room A", agenda: "High-temperature ceramic insulation for lithium-ion battery thermal management" },
  "megacorp:nanoshield": { entPerson: 1, suPerson: 0, time: "11:00", room: "Room B", agenda: "Nano-scale protective coating for automotive thermal systems" },
  "megacorp:biowrap": { entPerson: 0, suPerson: 1, time: "11:30", room: "Room A", agenda: "Bio-polymer housing for high-density battery electronics" },
};

type Phase = "idle" | "running" | "done";

interface EmbeddingData { matrix: Record<string, Record<string, number>>; ids: string[]; names: string[]; model: string; dimensions: number; tokensUsed: number; latencyMs: number; }
interface AgentVerdict { agent: string; role: string; score: number; verdict: string; latencyMs: number; model: string; }
interface PairAnalysis { enterprise: string; startup: string; agents: AgentVerdict[]; consensus: "strong" | "moderate" | "weak"; avgScore: number; moderationClean: boolean; moderationLatencyMs: number; }
interface DeepAnalysis { pairs: PairAnalysis[]; meta: { totalApiCalls: number; models: string[]; agentCount: number; totalLatencyMs: number; }; }

function countryFlag(country: string): string {
  const f: Record<string, string> = { Japan: "\u{1F1EF}\u{1F1F5}", Kazakhstan: "\u{1F1F0}\u{1F1FF}", China: "\u{1F1E8}\u{1F1F3}", USA: "\u{1F1FA}\u{1F1F8}" };
  return f[country] ?? "\u{1F30D}";
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [companies, setCompanies] = useState<CompanyMeta[]>([]);
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [ledger, setLedger] = useState<LedgerBlock[]>([]);
  const [verified, setVerified] = useState(true);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [, setMatching] = useState<MatchingResult | null>(null);
  const [pairScores, setPairScores] = useState<PairScore[]>([]);
  const [, setFinalProposal] = useState<string | null>(null);
  const [disclosures, setDisclosures] = useState<DisclosureState[]>([]);
  const [ndaDocs, setNdaDocs] = useState<Record<string, NDADocument>>({});
  const [showNDA, setShowNDA] = useState<string | null>(null);
  const [expandFeed, setExpandFeed] = useState(true);
  const [expandTrust, setExpandTrust] = useState(false);
  const [embeddingData, setEmbeddingData] = useState<EmbeddingData | null>(null);
  const [deepAnalysis, setDeepAnalysis] = useState<DeepAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [apiCalls, setApiCalls] = useState(0);
  const [teeAttest, setTeeAttest] = useState<any>(null);
  const [teeStatus, setTeeStatus] = useState<any>(null);
  const [teeVerifying, setTeeVerifying] = useState(false);
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

  async function fetchTeeData() {
    const [a, s] = await Promise.all([
      fetch("/api/tee/attest").then((r) => r.json()),
      fetch("/api/tee/status").then((r) => r.json()),
    ]);
    setTeeAttest(a);
    setTeeStatus(s);
  }

  async function verifyAttestation() {
    setTeeVerifying(true);
    await new Promise((r) => setTimeout(r, 1800));
    await fetchTeeData();
    setTeeVerifying(false);
  }

  useEffect(() => {
    fetch("/api/companies").then((r) => r.json()).then(setCompanies);
    refreshSide();
    refreshDisclosures();
    fetchTeeData();
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
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 500);
      runDeepAnalysis();
      return;
    }
    setEvents((prev) => [...prev, next]);
    setApiCalls((c) => c + 1);
    setTimeout(playNext, DELAY_BY_TYPE[next.type] ?? 500);
  }

  async function runScenario() {
    setPhase("running");
    setEvents([]);
    setMatching(null);
    setPairScores([]);
    setFinalProposal(null);
    setDeepAnalysis(null);
    setEmbeddingData(null);
    setApiCalls(0);
    const res = await fetch("/api/run", { method: "POST" });
    const data: RunResult = await res.json();
    setMatching(data.matching);
    setPairScores(data.pairScores ?? []);
    setFinalProposal(data.finalProposal);
    queueRef.current = [...data.events];
    playNext();
    fetch("/api/embeddings").then((r) => r.json()).then(setEmbeddingData);
  }

  async function runDeepAnalysis() {
    setAnalysisLoading(true);
    try {
      const res = await fetch("/api/deep-analysis", { method: "POST" });
      const data = await res.json();
      setDeepAnalysis(data);
      setApiCalls((c) => c + (data.meta?.totalApiCalls ?? 0));
    } catch { /* noop */ }
    setAnalysisLoading(false);
  }

  async function handleInterest(companyId: string, partnerId: string) {
    await fetch("/api/disclosure", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "interest", companyId, partnerId }) });
    refreshDisclosures();
  }

  async function handleSignNDA(enterpriseId: string, startupId: string) {
    const res = await fetch("/api/nda", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enterpriseId, startupId }) });
    const data = await res.json();
    setNdaDocs((prev) => ({ ...prev, [`${enterpriseId}:${startupId}`]: data.nda }));
    refreshDisclosures();
    refreshSide();
  }

  const sortedPairs = [...pairScores].sort((a, b) => b.serendipityScore - a.serendipityScore);

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
          <h1 className="mb-6 text-6xl font-black tracking-tight lg:text-8xl">Serendipity</h1>
          <p className="mb-8 text-2xl font-medium text-blue-100 lg:text-3xl">
            Your AI agent reads your company secrets.<br />
            Finds the perfect partner.<br />
            <span className="font-bold text-white">No one else sees a thing.</span>
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

      {/* ===== HOW IT WORKS ===== */}
      <section className="mx-auto max-w-5xl px-6 py-20 lg:px-12">
        <h2 className="mb-16 text-center text-4xl font-black text-slate-800 lg:text-5xl">How It Works</h2>
        <div className="grid gap-8 lg:grid-cols-3">
          {[
            { step: "01", title: "Upload Secrets", desc: "Each company submits goals, org chart, and calendars — encrypted into a TEE.", color: "text-blue-600" },
            { step: "02", title: "Agents Negotiate", desc: "AI agents match inside a hardware-isolated Secure Room. Operators see nothing.", color: "text-blue-600" },
            { step: "03", title: "Get Your Schedule", desc: "Who to meet, why, when, and where. Only safe outputs leave the enclave.", color: "text-blue-600" },
          ].map((s) => (
            <div key={s.step} className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <span className="text-6xl font-black text-blue-100">{s.step}</span>
              <h3 className="mt-4 text-2xl font-bold text-slate-800">{s.title}</h3>
              <p className="mt-2 text-lg text-slate-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== BEYOND MATCHING ===== */}
      <section className="bg-gradient-to-b from-white to-slate-50 px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 text-center">
            <span className="inline-block rounded-full bg-blue-100 px-4 py-1.5 text-sm font-bold text-blue-700">Not just a conference tool</span>
          </div>
          <h2 className="mb-4 text-center text-4xl font-black text-slate-800 lg:text-5xl">Beyond Matching</h2>
          <p className="mx-auto mb-16 max-w-2xl text-center text-xl text-slate-500">
            Serendipity is an always-on intelligence hub. Companies return for competitive insights, deal flow, and market sensing — all protected by TEE.
          </p>
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Market Radar */}
            <div className="group relative rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:border-blue-300 hover:shadow-lg">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-md shadow-blue-200">
                <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
              </div>
              <h3 className="mb-3 text-2xl font-bold text-slate-800">Market Radar</h3>
              <p className="mb-4 text-lg leading-relaxed text-slate-500">
                Continuous scanning of cross-industry opportunities via TEE-protected data feeds. Spot emerging synergies before your competitors do.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">Real-time feeds</span>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">Cross-industry</span>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">TEE-encrypted</span>
              </div>
            </div>
            {/* Deal Intelligence */}
            <div className="group relative rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:border-blue-300 hover:shadow-lg">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-md shadow-blue-200">
                <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                </svg>
              </div>
              <h3 className="mb-3 text-2xl font-bold text-slate-800">Deal Intelligence</h3>
              <p className="mb-4 text-lg leading-relaxed text-slate-500">
                AI tracks deal flow patterns, surfaces warm intros, and identifies acquisition targets. Your pipeline fills itself while data stays sealed.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">Warm intros</span>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">Deal flow</span>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">M&A targets</span>
              </div>
            </div>
            {/* Competitive Sensing */}
            <div className="group relative rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:border-blue-300 hover:shadow-lg">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-slate-800 shadow-md shadow-blue-200">
                <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h3 className="mb-3 text-2xl font-bold text-slate-800">Competitive Sensing</h3>
              <p className="mb-4 text-lg leading-relaxed text-slate-500">
                Monitor market moves without revealing what you are watching. TEE ensures no one — not even us — knows your watchlist.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">Zero-knowledge</span>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">Market moves</span>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">Private watchlist</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FROM CONFERENCE TO PLATFORM ===== */}
      <section className="border-b border-slate-100 bg-white px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-4 text-center text-4xl font-black text-slate-800 lg:text-5xl">From Conference to Platform</h2>
          <p className="mx-auto mb-16 max-w-2xl text-center text-xl text-slate-500">
            What starts as conference matching grows into the intelligence layer every company needs.
          </p>
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-0 right-0 top-8 hidden h-1 rounded-full bg-gradient-to-r from-blue-200 via-blue-400 to-blue-700 lg:block" />
            <div className="grid gap-8 lg:grid-cols-4">
              {/* Phase 1 */}
              <div className="relative flex flex-col items-center text-center">
                <div className="relative z-10 mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-lg font-black text-white shadow-lg shadow-blue-200 ring-4 ring-white">1</div>
                <div className="mb-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">TODAY</div>
                <h3 className="mb-2 text-xl font-bold text-slate-800">Conference Matching</h3>
                <p className="text-sm leading-relaxed text-slate-500">AI agents negotiate inside TEE to produce optimal meeting schedules at industry conferences.</p>
              </div>
              {/* Phase 2 */}
              <div className="relative flex flex-col items-center text-center">
                <div className="relative z-10 mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500 text-lg font-black text-white shadow-lg shadow-blue-200 ring-4 ring-white">2</div>
                <div className="mb-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">NEXT</div>
                <h3 className="mb-2 text-xl font-bold text-slate-800">Relationship Intelligence</h3>
                <p className="text-sm leading-relaxed text-slate-500">Ongoing partner scoring, relationship health tracking, and intro-path discovery across your network.</p>
              </div>
              {/* Phase 3 */}
              <div className="relative flex flex-col items-center text-center">
                <div className="relative z-10 mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-400 text-lg font-black text-white shadow-lg shadow-blue-200 ring-4 ring-white">3</div>
                <div className="mb-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">2027</div>
                <h3 className="mb-2 text-xl font-bold text-slate-800">Competitive Intel Hub</h3>
                <p className="text-sm leading-relaxed text-slate-500">Full market sensing — supply chain shifts, talent movement, patent filings — all processed inside TEE enclaves.</p>
              </div>
              {/* Phase 4 */}
              <div className="relative flex flex-col items-center text-center">
                <div className="relative z-10 mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-800 text-lg font-black text-white shadow-lg shadow-blue-300 ring-4 ring-white">4</div>
                <div className="mb-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">VISION</div>
                <h3 className="mb-2 text-xl font-bold text-slate-800">Autonomous Deal Agents</h3>
                <p className="text-sm leading-relaxed text-slate-500">AI agents autonomously negotiate, structure, and close B2B deals — humans approve, machines execute.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TEE ARCHITECTURE ===== */}
      <section className="bg-slate-900 px-6 py-20 text-white lg:px-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-4 text-center text-4xl font-black lg:text-5xl">Trusted Execution Environment</h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-xl text-slate-400">
            Hardware-isolated enclave where AI reads company secrets but operators, hackers, and other companies cannot.
          </p>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-700 bg-slate-800 p-6">
              <div className="mb-3 text-sm font-bold uppercase tracking-wider text-blue-400">Attestation</div>
              <div className="mb-2 text-lg font-bold">Intel SGX / AMD SEV</div>
              <p className="text-sm text-slate-400">Hardware-signed proof that code runs unmodified inside the enclave. Verifiable by any party.</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-bold text-emerald-400">VERIFIED</span>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-800 p-6">
              <div className="mb-3 text-sm font-bold uppercase tracking-wider text-blue-400">Memory Encryption</div>
              <div className="mb-2 text-lg font-bold">AES-256 MEE</div>
              <p className="text-sm text-slate-400">All data encrypted in memory. Even physical access to RAM chips reveals nothing.</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-bold text-emerald-400">ACTIVE</span>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-700 bg-slate-800 p-6">
              <div className="mb-3 text-sm font-bold uppercase tracking-wider text-blue-400">Sealed Storage</div>
              <div className="mb-2 text-lg font-bold">Per-Enclave Keys</div>
              <p className="text-sm text-slate-400">Secrets encrypted to the specific enclave identity. Moving to different hardware requires re-attestation.</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-bold text-emerald-400">SEALED</span>
              </div>
            </div>
          </div>
          <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-800/50 p-6">
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
              <span className="rounded-full bg-blue-900 px-3 py-1 font-bold text-blue-300">Privacy Wall: Regex + LLM Dual Pass</span>
              <span className="text-slate-600">&rarr;</span>
              <span className="rounded-full bg-blue-900 px-3 py-1 font-bold text-blue-300">SimHash/LSH Matching</span>
              <span className="text-slate-600">&rarr;</span>
              <span className="rounded-full bg-blue-900 px-3 py-1 font-bold text-blue-300">Multi-Agent Consensus</span>
              <span className="text-slate-600">&rarr;</span>
              <span className="rounded-full bg-blue-900 px-3 py-1 font-bold text-blue-300">Progressive Disclosure L0-L3</span>
              <span className="text-slate-600">&rarr;</span>
              <span className="rounded-full bg-emerald-900 px-3 py-1 font-bold text-emerald-300">Safe Output Only</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TEE LIVE STATUS ===== */}
      {teeAttest && teeStatus && (
        <section className="bg-slate-900 border-t border-slate-700 px-6 py-16 text-white lg:px-12">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
              <div>
                <div className="mb-1 flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
                  <h3 className="text-2xl font-black">Enclave Live Status</h3>
                </div>
                <p className="text-sm text-slate-400">AWS Nitro Enclaves &middot; Real-time attestation monitoring</p>
              </div>
              <button
                onClick={verifyAttestation}
                disabled={teeVerifying}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-emerald-500 disabled:opacity-60"
              >
                {teeVerifying ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Verifying Attestation...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                    Verify Attestation
                  </>
                )}
              </button>
            </div>

            {/* Attestation Status */}
            <div className="mb-6 rounded-2xl border border-slate-700 bg-slate-800 p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-bold uppercase tracking-wider text-blue-400">Attestation Document</div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-xs font-bold text-emerald-400">ATTESTED</span>
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <div className="mb-3">
                    <div className="text-xs font-medium text-slate-500">Enclave ID</div>
                    <div className="font-mono text-sm text-slate-300">{teeAttest.enclaveId}</div>
                  </div>
                  <div className="mb-3">
                    <div className="text-xs font-medium text-slate-500">Module</div>
                    <div className="font-mono text-sm text-slate-300">{teeAttest.attestationDoc.moduleId}</div>
                  </div>
                  <div className="mb-3">
                    <div className="text-xs font-medium text-slate-500">Timestamp</div>
                    <div className="font-mono text-sm text-slate-300">{teeAttest.attestationDoc.timestamp}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500">Digest Algorithm</div>
                    <div className="font-mono text-sm text-slate-300">{teeAttest.attestationDoc.digest}</div>
                  </div>
                </div>
                <div>
                  <div className="mb-2 text-xs font-medium text-slate-500">PCR Registers</div>
                  {Object.entries(teeAttest.pcrs as Record<string, string>).map(([key, val]) => (
                    <div key={key} className="mb-2">
                      <span className="mr-2 inline-block rounded bg-slate-700 px-2 py-0.5 text-xs font-bold text-blue-300">{key}</span>
                      <span className="font-mono text-xs text-slate-400 break-all">{val.slice(0, 32)}...{val.slice(-8)}</span>
                    </div>
                  ))}
                  <div className="mt-3">
                    <div className="text-xs font-medium text-slate-500">Policy Hash (SHA-256)</div>
                    <div className="font-mono text-xs text-slate-400 break-all">{teeAttest.policyHash}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Model + Runtime Metrics */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Security Model */}
              <div className="rounded-2xl border border-slate-700 bg-slate-800 p-6">
                <div className="mb-4 text-sm font-bold uppercase tracking-wider text-blue-400">Security Model</div>
                <div className="space-y-3">
                  {[
                    { label: "Secrets Decrypted in Enclave", active: teeAttest.securityModel.secretsDecryptedInEnclave },
                    { label: "Internal Log Sealed", active: teeAttest.securityModel.internalLogSealed },
                    { label: "Disclosure Review Enforced", active: teeAttest.securityModel.disclosureReviewEnforced },
                    { label: "vsock Isolation", active: teeAttest.securityModel.vsockIsolation },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-lg bg-slate-900/50 px-4 py-2.5">
                      <span className="text-sm text-slate-300">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${item.active ? "bg-emerald-400" : "bg-red-400"}`} />
                        <span className={`text-xs font-bold ${item.active ? "text-emerald-400" : "text-red-400"}`}>
                          {item.active ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Runtime Metrics */}
              <div className="rounded-2xl border border-slate-700 bg-slate-800 p-6">
                <div className="mb-4 text-sm font-bold uppercase tracking-wider text-blue-400">Runtime Metrics</div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-slate-900/50 p-3">
                    <div className="text-xs text-slate-500">Uptime</div>
                    <div className="text-lg font-black text-white">
                      {Math.floor(teeStatus.enclave.uptimeSeconds / 3600)}h {Math.floor((teeStatus.enclave.uptimeSeconds % 3600) / 60)}m
                    </div>
                  </div>
                  <div className="rounded-lg bg-slate-900/50 p-3">
                    <div className="text-xs text-slate-500">CPU / Memory</div>
                    <div className="text-lg font-black text-white">{teeStatus.enclave.cpuCount} vCPU / {(teeStatus.enclave.memoryMiB / 1024).toFixed(0)}GB</div>
                  </div>
                  <div className="rounded-lg bg-slate-900/50 p-3">
                    <div className="text-xs text-slate-500">Attestation Latency</div>
                    <div className="text-lg font-black text-emerald-400">{teeStatus.enclave.lastAttestationMs}ms</div>
                  </div>
                  <div className="rounded-lg bg-slate-900/50 p-3">
                    <div className="text-xs text-slate-500">KMS Decrypt Latency</div>
                    <div className="text-lg font-black text-emerald-400">{teeStatus.kms.lastDecryptLatencyMs}ms</div>
                  </div>
                </div>
              </div>
            </div>

            {/* vsock + KMS + Sealed Log + Disclosure Reviewer */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">vsock</span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400">CONNECTED</span>
                  </span>
                </div>
                <div className="font-mono text-xs text-slate-400">CID: {teeStatus.vsock.cid} &middot; Port: {teeStatus.vsock.port}</div>
                <div className="mt-1 text-sm font-bold text-white">{teeStatus.vsock.messagesRelayed} msgs relayed</div>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">KMS</span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400">ATTESTED</span>
                  </span>
                </div>
                <div className="font-mono text-xs text-slate-400">{teeStatus.kms.region}</div>
                <div className="mt-1 text-sm font-bold text-white">Attested Decrypt: ON</div>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Sealed Log</span>
                  <span className="rounded bg-amber-900/50 px-2 py-0.5 text-xs font-bold text-amber-400">SEALED</span>
                </div>
                <div className="font-mono text-xs text-slate-400">{(teeStatus.sealedLog.sealedSizeBytes / 1024).toFixed(1)} KB</div>
                <div className="mt-1 text-sm font-bold text-white">{teeStatus.sealedLog.entriesCount} entries</div>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Reviewer</span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400">ACTIVE</span>
                  </span>
                </div>
                <div className="font-mono text-xs text-slate-400">{teeStatus.disclosureReviewer.totalReviewed} reviewed</div>
                <div className="mt-1 flex items-center gap-3">
                  <span className="text-sm font-bold text-emerald-400">{teeStatus.disclosureReviewer.passed} passed</span>
                  <span className="text-sm font-bold text-red-400">{teeStatus.disclosureReviewer.blocked} blocked</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== TECH STACK ===== */}
      <section className="border-b border-slate-100 bg-slate-50 px-6 py-16 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-8 text-center text-3xl font-black text-slate-800">API Stack</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "GPT-4o-mini", api: "OpenAI Chat", use: "Agent drafting, critique, synthesis, multi-agent evaluation" },
              { name: "text-embedding-3-small", api: "OpenAI Embeddings", use: "256-dim vector similarity matrix for capability matching" },
              { name: "omni-moderation-latest", api: "OpenAI Moderation", use: "Content safety layer for Privacy Wall verification" },
              { name: "SimHash/LSH", api: "Custom", use: "Feature-hashing with hyperplane projection, Hamming distance" },
              { name: "SHA-256 Chain", api: "Node.js Crypto", use: "Tamper-evident audit log with hash chain verification" },
              { name: "TEE Enclave", api: "Intel SGX / AMD SEV", use: "Hardware-isolated secure computation environment" },
            ].map((t) => (
              <div key={t.name} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-lg font-bold text-slate-800">{t.name}</div>
                <div className="text-sm font-medium text-blue-600">{t.api}</div>
                <div className="mt-1 text-sm text-slate-400">{t.use}</div>
              </div>
            ))}
          </div>
          {apiCalls > 0 && (
            <div className="mt-6 text-center">
              <span className="rounded-full bg-blue-100 px-6 py-2 text-lg font-black text-blue-700">
                {apiCalls} API calls made this session
              </span>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 py-12 lg:px-12">

        {/* ===== COMPANIES ===== */}
        <section className="mb-16">
          <h2 className="mb-2 text-3xl font-black text-slate-800">Today&apos;s Participants</h2>
          <p className="mb-8 text-lg text-slate-400">4 companies &middot; 3 countries &middot; 8 delegates</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {companies.map((c) => {
              const delegates = DELEGATES[c.id] ?? [];
              return (
                <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl text-lg font-bold text-white" style={{ background: c.color }}>
                        {c.name?.[0] ?? "?"}
                      </div>
                      <div>
                        <div className="text-lg font-bold text-slate-800">{c.name ?? c.nameJa}</div>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <span>{countryFlag(c.country)}</span><span>{c.industry}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold text-white ${c.companyRole === "enterprise" ? "bg-blue-600" : "bg-emerald-600"}`}>
                      {c.companyRole === "enterprise" ? "Enterprise" : "Startup"}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {delegates.map((d) => (
                      <div key={d.name} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: c.color, opacity: 0.8 }}>{d.avatar}</div>
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

        {/* ===== LIVE DEMO ===== */}
        <section className="mb-16">
          <div className="flex flex-col items-center gap-6 rounded-3xl border-2 border-dashed border-blue-200 bg-blue-50/40 p-12">
            {phase === "idle" && (
              <>
                <h2 className="text-4xl font-black text-blue-800 lg:text-5xl">Live Demo</h2>
                <p className="max-w-lg text-center text-xl text-slate-500">8 AI agents enter the TEE Secure Match Room. Watch them negotiate in real time.</p>
                <button onClick={runScenario} disabled={companies.length === 0}
                  className="pulse-glow rounded-2xl bg-blue-600 px-14 py-6 text-2xl font-black text-white shadow-xl transition-all hover:bg-blue-500 hover:shadow-2xl disabled:opacity-50">
                  Start Matching
                </button>
              </>
            )}
            {phase === "running" && (
              <>
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 animate-ping rounded-full bg-blue-500" />
                  <h2 className="text-3xl font-black text-blue-800">Agents Negotiating in TEE...</h2>
                </div>
                <p className="text-lg text-slate-500">Secrets stay inside the enclave. Only safe outputs come out.</p>
                <div className="rounded-full bg-blue-100 px-4 py-1 text-sm font-bold text-blue-700">{apiCalls} API calls</div>
              </>
            )}
            {phase === "done" && (
              <>
                <svg className="h-10 w-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <h2 className="text-3xl font-black text-emerald-700">Matching Complete</h2>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <span className="rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-bold text-emerald-700">
                    {sortedPairs.filter((p) => p.serendipityScore >= 0.45).length} meetings recommended
                  </span>
                  <span className="rounded-full bg-slate-100 px-4 py-1.5 text-sm font-bold text-slate-500">
                    {sortedPairs.filter((p) => p.serendipityScore < 0.45).length} pairs skipped
                  </span>
                  <span className="rounded-full bg-blue-100 px-4 py-1.5 text-sm font-bold text-blue-700">
                    {apiCalls} API calls
                  </span>
                </div>
              </>
            )}
          </div>
        </section>

        {/* ===== LIVE FEED ===== */}
        {(phase === "running" || phase === "done") && (
          <section className="section-enter mb-16">
            <button onClick={() => setExpandFeed(!expandFeed)} className="mb-3 flex w-full items-center justify-between text-left">
              <h3 className="text-2xl font-bold text-slate-800">Agent Negotiation Feed</h3>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-400">{events.length} events</span>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${verified ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                  {verified ? "Hash Chain Verified" : "TAMPERED"}
                </span>
                <svg className={`h-5 w-5 text-slate-400 transition-transform ${expandFeed ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            {expandFeed && (
              <div ref={scrollRef} className="max-h-[40vh] space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                {events.map((ev) => (<EventCard key={ev.id} ev={ev} companies={companies} />))}
              </div>
            )}
          </section>
        )}

        {/* ===== EMBEDDING SIMILARITY HEATMAP ===== */}
        {embeddingData && phase === "done" && (
          <section className="section-enter mb-16">
            <h2 className="mb-2 text-3xl font-black text-slate-800">Vector Similarity Matrix</h2>
            <p className="mb-6 text-lg text-slate-400">
              OpenAI text-embedding-3-small ({embeddingData.dimensions}-dim) &middot; {embeddingData.tokensUsed} tokens &middot; {embeddingData.latencyMs}ms
            </p>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="p-2 text-left text-sm font-bold text-slate-400" />
                    {embeddingData.names.map((n) => (
                      <th key={n} className="p-2 text-center text-sm font-bold text-slate-600">{n}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {embeddingData.ids.map((rowId, ri) => (
                    <tr key={rowId}>
                      <td className="p-2 text-sm font-bold text-slate-600">{embeddingData.names[ri]}</td>
                      {embeddingData.ids.map((colId) => {
                        const val = embeddingData.matrix[rowId]?.[colId] ?? 0;
                        const isDiag = rowId === colId;
                        const intensity = isDiag ? 0 : Math.round((val - 0.3) * 200);
                        const bg = isDiag ? "#f1f5f9" : `rgba(37, 99, 235, ${Math.max(0.05, (val - 0.3) * 1.5)})`;
                        return (
                          <td key={colId} className="p-2 text-center" style={{ background: bg }}>
                            <span className={`text-sm font-mono font-bold ${isDiag ? "text-slate-300" : intensity > 60 ? "text-white" : "text-slate-700"}`}>
                              {isDiag ? "---" : val.toFixed(3)}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ===== MULTI-AGENT CONSENSUS ===== */}
        {(analysisLoading || deepAnalysis) && phase === "done" && (
          <section className="section-enter mb-16">
            <h2 className="mb-2 text-3xl font-black text-slate-800">Multi-Agent Consensus</h2>
            <p className="mb-6 text-lg text-slate-400">
              3 specialized AI agents independently evaluate each match
              {deepAnalysis && <> &middot; {deepAnalysis.meta.totalApiCalls} API calls &middot; {deepAnalysis.meta.totalLatencyMs}ms</>}
            </p>
            {analysisLoading && !deepAnalysis && (
              <div className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-6">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                <span className="text-lg font-bold text-blue-700">Running Deal Analyst + Tech DD + Cross-Border Agent...</span>
              </div>
            )}
            {deepAnalysis && (
              <div className="space-y-4">
                {deepAnalysis.pairs.map((pair) => {
                  const ent = companies.find((c) => c.id === pair.enterprise);
                  const su = companies.find((c) => c.id === pair.startup);
                  return (
                    <div key={`${pair.enterprise}:${pair.startup}`} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-slate-800">{ent?.name ?? ent?.nameJa}</span>
                          <span className="text-slate-300">&times;</span>
                          <span className="text-lg font-bold text-slate-800">{su?.name ?? su?.nameJa}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-4 py-1.5 text-sm font-black ${
                            pair.consensus === "strong" ? "bg-emerald-100 text-emerald-700" :
                            pair.consensus === "moderate" ? "bg-blue-100 text-blue-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {pair.consensus.toUpperCase()} CONSENSUS
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-600">
                            Avg: {pair.avgScore}/100
                          </span>
                          {pair.moderationClean && (
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">
                              Moderation: Clean ({pair.moderationLatencyMs}ms)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="grid gap-3 lg:grid-cols-3">
                        {pair.agents.map((a) => (
                          <div key={a.agent} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-sm font-bold text-slate-700">{a.agent}</span>
                              <span className="text-xs text-slate-400">{a.latencyMs}ms</span>
                            </div>
                            <div className="mb-2">
                              <div className="mb-1 flex items-center justify-between">
                                <span className="text-xs text-slate-400">{a.model}</span>
                                <span className={`text-lg font-black ${a.score >= 70 ? "text-emerald-600" : a.score >= 50 ? "text-blue-600" : "text-red-600"}`}>
                                  {a.score}
                                </span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                                <div className={`h-full rounded-full transition-all ${a.score >= 70 ? "bg-emerald-500" : a.score >= 50 ? "bg-blue-500" : "bg-red-500"}`}
                                  style={{ width: `${a.score}%` }} />
                              </div>
                            </div>
                            <p className="text-sm text-slate-500">{a.verdict}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ===== RECOMMENDED MEETINGS ===== */}
        {phase === "done" && pairScores.length > 0 && (
          <section ref={resultsRef} className="section-enter mb-16">
            <h2 className="mb-2 text-4xl font-black text-slate-800">Recommended Meetings</h2>
            <p className="mb-8 text-lg text-slate-400">Matches you would never find on Google or LinkedIn.</p>
            <div className="space-y-4">
              {sortedPairs.filter((p) => p.serendipityScore >= 0.45).map((pair, idx) => {
                const priority = idx === 0 ? "best" : "recommended";
                const enterprise = companies.find((c) => c.id === pair.enterprise);
                const startup = companies.find((c) => c.id === pair.startup);
                const disc = disclosures.find((d) => d.enterpriseId === pair.enterprise && d.startupId === pair.startup);
                const level = disc?.level ?? 0;
                const ndaKey = `${pair.enterprise}:${pair.startup}`;
                const nda = ndaDocs[ndaKey];
                const meeting = MEETING_TEMPLATES[ndaKey];
                const entDelegates = DELEGATES[pair.enterprise] ?? [];
                const suDelegates = DELEGATES[pair.startup] ?? [];
                const entPerson = meeting ? entDelegates[meeting.entPerson] : entDelegates[0];
                const suPerson = meeting ? suDelegates[meeting.suPerson] : suDelegates[0];

                return (
                  <div key={ndaKey} className={`rounded-2xl border-2 p-6 shadow-sm transition-all ${level >= 3 ? "border-emerald-400 bg-emerald-50/30" : level >= 2 ? "border-blue-400 bg-blue-50/30" : "border-slate-200 bg-white"}`}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: enterprise?.color }}>{entPerson?.avatar ?? "?"}</div>
                          <div>
                            <div className="text-lg font-bold text-slate-800">{entPerson?.name ?? "---"}</div>
                            <div className="text-sm text-slate-400">{entPerson?.role}</div>
                            <div className="text-xs text-slate-300">{enterprise?.name ?? enterprise?.nameJa}</div>
                          </div>
                        </div>
                        <div className="px-2 text-3xl text-blue-300">&harr;</div>
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: startup?.color }}>{level >= 3 ? (suPerson?.avatar ?? "?") : "?"}</div>
                          <div>
                            <div className="text-lg font-bold text-slate-800">{level >= 3 ? suPerson?.name : `${startup?.country} delegate`}</div>
                            <div className="text-sm text-slate-400">{level >= 3 ? suPerson?.role : "Identity hidden"}</div>
                            <div className="text-xs text-slate-300">{level >= 3 ? (startup?.name ?? startup?.nameJa) : `${countryFlag(startup?.country ?? "")} Undisclosed`}</div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className={`rounded-full px-4 py-1.5 text-sm font-black ${priority === "best" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                          {priority === "best" ? "Best Match" : "Recommended"}
                        </div>
                        <div className="rounded-full bg-amber-100 px-4 py-1.5 text-sm font-black text-amber-800">Serendipity {Math.round(pair.serendipityScore * 100)}%</div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">{[0, 1, 2, 3].map((l) => (<div key={l} className={`h-2 w-6 rounded-full ${l <= level ? (level >= 3 ? "bg-emerald-500" : "bg-blue-500") : "bg-slate-200"}`} />))}</div>
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
                    {level >= 1 && disc?.levelData[1] && <p className="mt-3 text-base text-slate-500">{disc.levelData[1].abstractCapability}</p>}
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
                          <button onClick={() => handleInterest(pair.enterprise, pair.startup)} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-500">Enterprise: Interested</button>
                          <button onClick={() => handleInterest(pair.startup, pair.enterprise)} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-500">Startup: Interested</button>
                        </>
                      )}
                      {level === 2 && !disc?.ndaSigned && (
                        <button onClick={() => handleSignNDA(pair.enterprise, pair.startup)} className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-amber-400">Generate &amp; Sign NDA</button>
                      )}
                      {nda && (
                        <button onClick={() => setShowNDA(showNDA === ndaKey ? null : ndaKey)} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
                          {showNDA === ndaKey ? "Hide NDA" : "View NDA"}
                        </button>
                      )}
                    </div>
                    {showNDA === ndaKey && nda && (
                      <div className="mt-4 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4">
                        <div className="mb-2 flex items-center justify-between text-sm"><span className="font-bold text-slate-700">NDA #{nda.id}</span><span className="text-slate-500">{nda.governingLaw}</span></div>
                        <pre className="whitespace-pre-wrap text-xs leading-relaxed text-slate-600">{nda.fullText}</pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {sortedPairs.filter((p) => p.serendipityScore < 0.45).length > 0 && (
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
                      <div key={`${skip.a}:${skip.b}`} className="flex items-center gap-4 rounded-xl bg-slate-50 px-5 py-3 opacity-50">
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

        {/* ===== TRUST ===== */}
        {phase === "done" && (
          <section className="section-enter mb-12">
            <button onClick={() => setExpandTrust(!expandTrust)} className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 py-4 text-left shadow-sm hover:shadow-md">
              <h3 className="text-xl font-bold text-slate-800">Trust &amp; Security Details</h3>
              <svg className={`h-5 w-5 text-slate-400 transition-transform ${expandTrust ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
      <footer className="border-t border-slate-100 bg-slate-900 px-6 py-12 text-center text-white">
        <p className="text-2xl font-black">Serendipity</p>
        <p className="mt-2 text-sm text-slate-400">
          TEE &middot; OpenAI GPT-4o &middot; Embeddings API &middot; Moderation API &middot; SimHash/LSH &middot; SHA-256 Chain &middot; Progressive Disclosure
        </p>
        <p className="mt-4 text-xs text-slate-500">
          Built with GStack for Compiled AI Hackathon #3
        </p>
      </footer>
    </div>
  );
}
