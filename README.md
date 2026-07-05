# Agent Expo

**Replace 2 days of random conference networking with 10 minutes of AI-matched meetings.**

AI agents negotiate inside a Trusted Execution Environment (TEE) on behalf of each company. They read internal company data -- R&D priorities, procurement needs, org charts -- find the best cross-border matches, and output a meeting schedule. No human ever sees another company's secrets.

**Live demo:** [7-5-yc.vercel.app](https://7-5-yc.vercel.app)

## The Problem

Trade shows waste 80% of attendees' time. Matching happens on public profiles (LinkedIn, pitch decks), not on the real data that determines fit. Current matchmaking platforms don't have DD-level data and default to keyword matching.

## How It Works

1. **Upload Secrets** -- Each company submits goals, org chart, calendars, and disclosure policies. Data is encrypted into a TEE.
2. **Agents Negotiate** -- AI agents match inside a hardware-isolated Secure Room using SimHash/LSH. Operators cannot see data inside.
3. **Get Your Schedule** -- Who to meet, why, when, and where. Only privacy-wall-approved outputs leave the enclave.

## Architecture

| Layer | Current Implementation |
|-------|----------------------|
| Privacy Wall | TEE + Regex/LLM dual verification, fail-closed |
| Matching | SimHash/LSH feature-hashing, Hamming similarity |
| Serendipity Score | novelty + utility - similarity penalty |
| Anti-Reconstruction | Per-company specificity budget |
| Integrity Proof | SHA-256 hash chain audit log |
| Agent Isolation | Per-company TEE enclave, safe messages only |
| Progressive Disclosure | L0 (anonymous) -> L1 (abstract) -> L2 (detailed) -> L3 (full identity) |

## Stack

- Next.js 16 + TypeScript + Tailwind CSS
- OpenAI SDK (agent reasoning)
- SimHash/LSH (capability matching)
- SHA-256 hash chain (audit trail)

## YC RFS Alignment

**Company Brain** -- AI that understands a company's internal data and acts on it. Agent Expo is a Company Brain applied to cross-border B2B matchmaking: each company's AI agent holds real internal data inside a TEE, then negotiates matches with other companies' agents without exposing raw data.

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Requires `OPENAI_API_KEY` in `.env.local`.

## Deploy

Push to `main` -- Vercel auto-deploys.

## Team

Built at Compiled AI Hackathon #3 (July 5, 2026, Ritsumeikan University, Osaka).

## License

MIT
