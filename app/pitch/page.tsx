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
        <p className="mb-8 max-w-3xl text-3xl font-medium text-blue-200 lg:text-4xl">
          Unlock your company&apos;s hidden knowledge.<br />
          Find partners no one else can see.
        </p>
        <p className="max-w-2xl text-xl text-blue-300">
          AI reads your internal secrets inside a hardware-encrypted room,<br />
          matches you with the perfect cross-industry partner,<br />
          and <span className="font-bold text-white">no one else ever sees your data</span>.
        </p>
        <div className="mt-16 text-lg text-slate-400">Compiled AI Hackathon #3 &middot; July 5, 2026</div>
      </div>
    ),
  },
  {
    id: "problem",
    bg: "bg-white",
    content: (
      <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center">
        <h2 className="mb-6 text-6xl font-black text-slate-800 lg:text-7xl">Wasted Treasure</h2>
        <p className="mb-12 max-w-3xl text-2xl text-slate-500">
          Every company has tacit knowledge locked inside — R&amp;D plans, procurement needs, technical capabilities.
        </p>
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-4">
          <div className="rounded-3xl border-2 border-red-200 bg-red-50 p-6">
            <div className="mb-3 text-4xl font-black text-red-600">Paper</div>
            <p className="text-lg text-red-800">Internal knowledge stays on documents and in people&apos;s heads</p>
          </div>
          <div className="rounded-3xl border-2 border-red-200 bg-red-50 p-6">
            <div className="mb-3 text-4xl font-black text-red-600">Invisible</div>
            <p className="text-lg text-red-800">No one outside your company knows what you can do or need</p>
          </div>
          <div className="rounded-3xl border-2 border-red-200 bg-red-50 p-6">
            <div className="mb-3 text-4xl font-black text-red-600">Unsolved</div>
            <p className="text-lg text-red-800">Problems stay unsolved because the solution is in another industry</p>
          </div>
          <div className="rounded-3xl border-2 border-red-200 bg-red-50 p-6">
            <div className="mb-3 text-4xl font-black text-red-600">Wasted</div>
            <p className="text-lg text-red-800">Your company&apos;s most valuable asset is rotting unused</p>
          </div>
        </div>
        <p className="mt-12 max-w-2xl text-2xl font-bold text-slate-700">
          Other companies don&apos;t know what you have.<br />
          You don&apos;t know what they have.<br />
          <span className="text-red-600">That&apos;s a trillion dollars of wasted potential.</span>
        </p>
      </div>
    ),
  },
  {
    id: "fear",
    bg: "bg-gradient-to-br from-slate-900 to-slate-800",
    content: (
      <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center text-white">
        <h2 className="mb-6 text-6xl font-black lg:text-7xl">&ldquo;But AI is scary.&rdquo;</h2>
        <p className="mb-16 max-w-3xl text-2xl text-slate-300">
          Japanese enterprises won&apos;t put confidential data into ChatGPT.<br />
          And they&apos;re right — cloud AI means your secrets on someone else&apos;s server.
        </p>
        <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-red-800 bg-red-950/50 p-8">
            <div className="mb-4 text-3xl font-black text-red-400">Cloud AI</div>
            <ul className="space-y-3 text-left text-lg text-red-300">
              <li>Your data on OpenAI / Google servers</li>
              <li>Can be logged, leaked, or subpoenaed</li>
              <li>ChatGPT can&apos;t handle NDA-bound info</li>
              <li>No compliance team will approve it</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-emerald-800 bg-emerald-950/50 p-8">
            <div className="mb-4 text-3xl font-black text-emerald-400">Local LLM + TEE</div>
            <ul className="space-y-3 text-left text-lg text-emerald-300">
              <li>Data never leaves your machine</li>
              <li>Hardware encryption, not policy</li>
              <li>Even the server operator can&apos;t see inside</li>
              <li>Built for Japanese enterprise security</li>
            </ul>
          </div>
        </div>
        <p className="mt-12 text-2xl font-bold text-emerald-400">
          Step 1: Put your data on a Local LLM. Zero risk. Zero cloud.
        </p>
      </div>
    ),
  },
  {
    id: "how",
    bg: "bg-white",
    content: (
      <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center">
        <h2 className="mb-4 text-6xl font-black text-slate-800 lg:text-7xl">How It Works</h2>
        <p className="mb-16 max-w-2xl text-xl text-slate-500">
          Local LLM extracts capability tags. TEE does the matching. No raw secrets ever leave.
        </p>
        <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-4">
          {[
            { step: "1", title: "Local LLM", desc: "Your company data stays on YOUR device. A local LLM reads it and extracts abstracted capability tags. No cloud. No leakage.", color: "from-blue-500 to-blue-700", icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
            { step: "2", title: "TEE Enclave", desc: "Tags enter an AWS Nitro Enclave — hardware-isolated, memory-encrypted. Not even the server operator can peek inside.", color: "from-emerald-500 to-emerald-700", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
            { step: "3", title: "AI Matching", desc: "Inside the TEE, AI agents negotiate, find cross-industry synergies, and a Privacy Wall blocks any secret from leaking.", color: "from-blue-600 to-indigo-700", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
            { step: "4", title: "Safe Output", desc: "Only disclosure-reviewed, abstracted results leave the enclave. Who to meet, why, when. Zero raw data exposed.", color: "from-blue-700 to-slate-800", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
          ].map((s) => (
            <div key={s.step} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${s.color}`}>
                <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                </svg>
              </div>
              <div className="mb-1 text-sm font-black text-blue-600">Step {s.step}</div>
              <h3 className="mb-2 text-xl font-bold text-slate-800">{s.title}</h3>
              <p className="text-sm text-slate-500">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-8 py-4">
          <p className="text-xl font-bold text-emerald-700">
            TEE = Privacy by architecture, not by policy. Hardware guarantees &gt; legal promises.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "tee",
    bg: "bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900",
    content: (
      <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center text-white">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-5 py-2 text-lg font-semibold text-emerald-400 backdrop-blur-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          AWS Nitro Enclaves
        </div>
        <h2 className="mb-6 text-6xl font-black lg:text-7xl">TEE: The Core</h2>
        <p className="mb-12 max-w-3xl text-xl text-blue-200">
          Trusted Execution Environment — the military-grade technology that makes Serendipity possible.
          Your data is encrypted in hardware. Even with physical access to the server, no one can read it.
        </p>
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-3">
          {[
            { title: "Memory Encryption", desc: "All data inside the enclave is encrypted in RAM. Even a memory dump reveals nothing.", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
            { title: "vsock Isolation", desc: "No network interface. The only I/O channel is a vsock — a virtual socket with no internet access.", icon: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" },
            { title: "KMS Attestation", desc: "Secrets are only decrypted after cryptographic proof that the correct code is running in the enclave.", icon: "M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" },
          ].map((t) => (
            <div key={t.title} className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6 backdrop-blur-sm">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
                <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={t.icon} />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold">{t.title}</h3>
              <p className="text-sm text-slate-400">{t.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 rounded-2xl border border-blue-800 bg-blue-950/50 px-6 py-4">
          <p className="text-lg text-blue-200">
            <span className="font-bold text-white">ChatGPT cannot do this.</span> It runs on shared cloud infrastructure.
            Serendipity runs inside a hardware-isolated enclave where even AWS cannot see your data.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "after",
    bg: "bg-white",
    content: (
      <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center">
        <h2 className="mb-6 text-6xl font-black text-slate-800 lg:text-7xl">After the Match</h2>
        <p className="mb-12 max-w-3xl text-2xl text-slate-500">
          Matching is just the beginning. Once companies connect, Serendipity becomes their intelligence hub.
        </p>
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
          {[
            { phase: "Today", title: "Conference Matching", desc: "AI finds the perfect cross-industry partner at trade shows. Zero data exposure.", badge: "bg-emerald-500" },
            { phase: "Next", title: "Post-NDA Intelligence", desc: "After NDA, Serendipity manages ongoing deal flow, market signals, and collaboration — things ChatGPT can't touch.", badge: "bg-blue-500" },
            { phase: "2027", title: "Competitive Intelligence", desc: "Always-on TEE hub for private market monitoring, hiring patterns, and competitor moves. Sealed data, real insights.", badge: "bg-amber-500" },
            { phase: "Vision", title: "Autonomous Deal Agents", desc: "Your AI agent autonomously finds, negotiates, and closes cross-border partnerships while you sleep.", badge: "bg-purple-500" },
          ].map((p) => (
            <div key={p.phase} className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-left">
              <span className={`inline-block rounded-full px-4 py-1.5 text-sm font-black text-white ${p.badge}`}>{p.phase}</span>
              <h3 className="mt-4 text-2xl font-bold text-slate-800">{p.title}</h3>
              <p className="mt-2 text-lg text-slate-500">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "japan",
    bg: "bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900",
    content: (
      <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center text-white">
        <h2 className="mb-6 text-6xl font-black lg:text-7xl">Why Japan Needs This</h2>
        <p className="mb-12 max-w-3xl text-2xl text-blue-200">
          Japanese enterprises are the most security-conscious in the world. That&apos;s not a bug — it&apos;s our market.
        </p>
        <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-600 bg-slate-800/50 p-6 backdrop-blur-sm">
            <div className="mb-3 text-4xl font-black text-blue-300">NDA</div>
            <p className="text-lg text-slate-300">Post-NDA collaboration needs a secure AI layer. ChatGPT can&apos;t be used for NDA-bound information.</p>
          </div>
          <div className="rounded-2xl border border-slate-600 bg-slate-800/50 p-6 backdrop-blur-sm">
            <div className="mb-3 text-4xl font-black text-blue-300">Keiretsu</div>
            <p className="text-lg text-slate-300">Cross-industry partnerships are Japan&apos;s DNA. But the discovery process is stuck in the 1990s.</p>
          </div>
          <div className="rounded-2xl border border-slate-600 bg-slate-800/50 p-6 backdrop-blur-sm">
            <div className="mb-3 text-4xl font-black text-blue-300">Trust</div>
            <p className="text-lg text-slate-300">Hardware encryption + local LLM + TEE attestation. Security-by-architecture, not by promise.</p>
          </div>
        </div>
        <p className="mt-12 max-w-2xl text-2xl font-bold">
          The company that solves &ldquo;secure AI for Japanese enterprise&rdquo; wins a massive, untouched market.
        </p>
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
          4 companies. 3 countries. 8 delegates.<br />
          Watch TEE-protected AI agents match in real time.
        </p>
        <a
          href="/"
          className="inline-block rounded-3xl bg-blue-600 px-16 py-8 text-4xl font-black text-white shadow-2xl transition-all hover:bg-blue-500 hover:shadow-blue-200"
        >
          Launch Demo &rarr;
        </a>
        <div className="mt-10 rounded-2xl bg-slate-100 px-6 py-3">
          <p className="text-sm font-semibold text-slate-600">
            TEE Attestation &middot; Privacy Wall &middot; Multi-Agent Consensus &middot; SHA-256 Audit Chain &middot; Progressive Disclosure
          </p>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <span className="rounded-full bg-slate-100 px-5 py-2 text-lg font-bold text-slate-600">MegaCorp (Japan)</span>
          <span className="rounded-full bg-slate-100 px-5 py-2 text-lg font-bold text-slate-600">AltaiMaterials (Kazakhstan)</span>
          <span className="rounded-full bg-slate-100 px-5 py-2 text-lg font-bold text-slate-600">NanoShield (China)</span>
          <span className="rounded-full bg-slate-100 px-5 py-2 text-lg font-bold text-slate-600">BioWrap (Japan)</span>
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
