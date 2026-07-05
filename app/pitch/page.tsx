"use client";

import { useState, useEffect, useCallback } from "react";

const SLIDES = [
  {
    id: "title",
    bg: "bg-gradient-to-br from-blue-800 via-blue-900 to-slate-950",
    content: (
      <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center text-white">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-2 text-lg font-semibold backdrop-blur-sm">
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
          YC RFS: Company Brain
        </div>
        <h1 className="mb-6 text-8xl font-black tracking-tight lg:text-[10rem]">Serendipity</h1>
        <p className="mb-12 max-w-3xl text-3xl font-medium text-blue-200 lg:text-4xl">
          AI finds the partner you didn&apos;t know you needed.<br />
          Without seeing your secrets.
        </p>
        <div className="flex items-center gap-6">
          <div className="rounded-2xl bg-white/10 px-10 py-6 backdrop-blur-sm">
            <div className="text-5xl font-black lg:text-6xl">2 days</div>
            <div className="mt-1 text-lg text-blue-300">random networking</div>
          </div>
          <div className="text-5xl font-black text-blue-400">&rarr;</div>
          <div className="rounded-2xl bg-white/10 px-10 py-6 backdrop-blur-sm">
            <div className="text-5xl font-black text-emerald-400 lg:text-6xl">10 min</div>
            <div className="mt-1 text-lg text-blue-300">AI-matched meetings</div>
          </div>
        </div>
        <div className="mt-16 text-lg text-slate-400">Compiled AI Hackathon #3 &middot; July 5, 2026</div>
      </div>
    ),
  },
  {
    id: "problem",
    bg: "bg-white",
    content: (
      <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center">
        <h2 className="mb-12 text-7xl font-black text-slate-800">The Problem</h2>
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-3">
          <div className="rounded-3xl border-2 border-red-200 bg-red-50 p-8">
            <div className="mb-4 text-5xl font-black text-red-600">80%</div>
            <p className="text-xl text-red-800">of trade show time is wasted on bad matches</p>
          </div>
          <div className="rounded-3xl border-2 border-red-200 bg-red-50 p-8">
            <div className="mb-4 text-5xl font-black text-red-600">$50K</div>
            <p className="text-xl text-red-800">per booth, most leads never convert</p>
          </div>
          <div className="rounded-3xl border-2 border-red-200 bg-red-50 p-8">
            <div className="mb-4 text-5xl font-black text-red-600">0%</div>
            <p className="text-xl text-red-800">of matchmakers use real internal data</p>
          </div>
        </div>
        <p className="mt-12 max-w-3xl text-2xl text-slate-500">
          Matching happens on public profiles &mdash; LinkedIn, pitch decks.<br />
          Not on the real data that determines fit.
        </p>
      </div>
    ),
  },
  {
    id: "how",
    bg: "bg-gradient-to-br from-slate-900 to-blue-950",
    content: (
      <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center text-white">
        <h2 className="mb-16 text-7xl font-black">How It Works</h2>
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-4">
          {[
            { step: "1", title: "Ingest Local Data", desc: "Companies upload R&D priorities, procurement needs, org charts. Data stays on their device.", color: "from-blue-500 to-blue-700", icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" },
            { step: "2", title: "Local LLM Analyzes", desc: "A local LLM reads secrets and extracts capability tags. No data leaves the machine. Ever.", color: "from-cyan-500 to-blue-600", icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
            { step: "3", title: "TEE Match Room", desc: "Agents negotiate inside a hardware-isolated enclave. Privacy Wall blocks any secret leakage.", color: "from-blue-600 to-indigo-700", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
            { step: "4", title: "Get Your Schedule", desc: "Who to meet, why, when, where. Only safe outputs leave the enclave. Zero raw data exposed.", color: "from-emerald-500 to-emerald-700", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
          ].map((s) => (
            <div key={s.step} className="rounded-3xl border border-slate-700 bg-slate-800/50 p-8 backdrop-blur-sm">
              <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${s.color}`}>
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                </svg>
              </div>
              <div className="mb-2 text-lg font-black text-blue-300">Step {s.step}</div>
              <h3 className="mb-3 text-2xl font-bold">{s.title}</h3>
              <p className="text-lg text-slate-400">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 rounded-2xl border border-emerald-800 bg-emerald-950/50 px-8 py-4">
          <p className="text-xl font-bold text-emerald-400">
            Local LLM = No cloud dependency. No data leakage. Full privacy by architecture.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "tech",
    bg: "bg-white",
    content: (
      <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center">
        <h2 className="mb-4 text-7xl font-black text-slate-800">The Tech</h2>
        <p className="mb-12 text-2xl text-slate-400">6 API layers, 3 AI models, hardware-isolated execution</p>
        <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-3">
          {[
            { name: "GPT-4o-mini", tag: "OpenAI Chat", desc: "Multi-agent reasoning, critique, synthesis", color: "border-blue-300 bg-blue-50" },
            { name: "text-embedding-3-small", tag: "OpenAI Embeddings", desc: "256-dim vector similarity for capability matching", color: "border-blue-300 bg-blue-50" },
            { name: "omni-moderation-latest", tag: "OpenAI Moderation", desc: "Content safety verification layer", color: "border-blue-300 bg-blue-50" },
            { name: "SimHash / LSH", tag: "Custom Algorithm", desc: "Feature-hashing with hyperplane projection", color: "border-slate-300 bg-slate-50" },
            { name: "SHA-256 Hash Chain", tag: "Crypto", desc: "Tamper-evident audit log with chain verification", color: "border-slate-300 bg-slate-50" },
            { name: "Intel SGX / AMD SEV", tag: "TEE Hardware", desc: "Hardware-isolated enclave, memory encryption", color: "border-emerald-300 bg-emerald-50" },
          ].map((t) => (
            <div key={t.name} className={`rounded-2xl border-2 p-6 text-left ${t.color}`}>
              <div className="text-2xl font-black text-slate-800">{t.name}</div>
              <div className="mb-2 text-sm font-bold text-blue-600">{t.tag}</div>
              <div className="text-lg text-slate-500">{t.desc}</div>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <span className="rounded-full bg-blue-100 px-4 py-2 text-lg font-bold text-blue-700">3 AI Models</span>
          <span className="rounded-full bg-slate-100 px-4 py-2 text-lg font-bold text-slate-700">6 API Layers</span>
          <span className="rounded-full bg-emerald-100 px-4 py-2 text-lg font-bold text-emerald-700">Hardware TEE</span>
          <span className="rounded-full bg-amber-100 px-4 py-2 text-lg font-bold text-amber-700">Multi-Agent Consensus</span>
        </div>
      </div>
    ),
  },
  {
    id: "hub",
    bg: "bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900",
    content: (
      <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center text-white">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-lg font-semibold backdrop-blur-sm">
          Beyond Matching
        </div>
        <h2 className="mb-6 text-7xl font-black">The Intelligence Hub</h2>
        <p className="mb-16 max-w-3xl text-2xl text-blue-200">
          Matching is just the entry point. Serendipity becomes your company&apos;s always-on intelligence layer.
        </p>
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
          {[
            { phase: "Today", title: "Conference Matching", desc: "AI agents find the perfect partners at trade shows. Zero data exposure.", badge: "bg-emerald-500" },
            { phase: "Next", title: "Relationship Intelligence", desc: "Track ongoing deal signals, warm intros, and follow-up timing across your network.", badge: "bg-blue-500" },
            { phase: "2027", title: "Competitive Intelligence Hub", desc: "Monitor market moves, hiring patterns, and competitor partnerships — all inside TEE.", badge: "bg-amber-500" },
            { phase: "Vision", title: "Autonomous Deal Agents", desc: "Your AI agent autonomously initiates, negotiates, and closes cross-border partnerships.", badge: "bg-purple-500" },
          ].map((p) => (
            <div key={p.phase} className="rounded-3xl border border-slate-600 bg-slate-800/50 p-8 text-left backdrop-blur-sm">
              <span className={`inline-block rounded-full px-4 py-1.5 text-sm font-black text-white ${p.badge}`}>{p.phase}</span>
              <h3 className="mt-4 text-3xl font-bold">{p.title}</h3>
              <p className="mt-3 text-xl text-slate-400">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "demo",
    bg: "bg-white",
    content: (
      <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center">
        <h2 className="mb-8 text-7xl font-black text-slate-800">Live Demo</h2>
        <p className="mb-12 max-w-2xl text-2xl text-slate-500">
          4 real companies. 3 countries. 8 delegates.<br />
          Watch AI agents negotiate inside a TEE in real time.
        </p>
        <a
          href="/"
          className="inline-block rounded-3xl bg-blue-600 px-16 py-8 text-4xl font-black text-white shadow-2xl transition-all hover:bg-blue-500 hover:shadow-blue-200"
        >
          Launch Demo &rarr;
        </a>
        <div className="mt-16 flex flex-wrap items-center justify-center gap-4">
          <span className="rounded-full bg-slate-100 px-5 py-2 text-lg font-bold text-slate-600">MegaCorp Motors (Japan)</span>
          <span className="rounded-full bg-slate-100 px-5 py-2 text-lg font-bold text-slate-600">AltaiMaterials (Kazakhstan)</span>
          <span className="rounded-full bg-slate-100 px-5 py-2 text-lg font-bold text-slate-600">NanoShield (China)</span>
          <span className="rounded-full bg-slate-100 px-5 py-2 text-lg font-bold text-slate-600">BioWrap (Japan)</span>
        </div>
        <div className="mt-12 text-lg text-slate-400">
          7-5-yc.vercel.app &middot; GitHub: kyoky0/7-5-yc
        </div>
      </div>
    ),
  },
];

export default function PitchPage() {
  const [current, setCurrent] = useState(0);

  const goNext = useCallback(() => setCurrent((c) => Math.min(c + 1, SLIDES.length - 1)), []);
  const goPrev = useCallback(() => setCurrent((c) => Math.max(c - 1, 0)), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") { e.preventDefault(); goNext(); }
      if (e.key === "ArrowLeft" || e.key === "Backspace") { e.preventDefault(); goPrev(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  const slide = SLIDES[current];

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <div className={`h-full w-full transition-colors duration-500 ${slide.bg}`}>
        {slide.content}
      </div>

      {/* Navigation */}
      <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4">
        <button onClick={goPrev} disabled={current === 0}
          className="rounded-full bg-black/20 px-4 py-2 text-white backdrop-blur-sm transition-all hover:bg-black/40 disabled:opacity-20">
          &larr;
        </button>
        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`h-2.5 rounded-full transition-all ${i === current ? "w-8 bg-blue-500" : "w-2.5 bg-white/30 hover:bg-white/50"}`} />
          ))}
        </div>
        <button onClick={goNext} disabled={current === SLIDES.length - 1}
          className="rounded-full bg-black/20 px-4 py-2 text-white backdrop-blur-sm transition-all hover:bg-black/40 disabled:opacity-20">
          &rarr;
        </button>
      </div>

      {/* Slide counter */}
      <div className="fixed right-6 top-6 z-50 rounded-full bg-black/20 px-4 py-1.5 text-sm font-bold text-white backdrop-blur-sm">
        {current + 1} / {SLIDES.length}
      </div>
    </div>
  );
}
