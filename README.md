# Serendipity

**Replace 2 days of random conference networking with 10 minutes of AI-matched meetings.**

AI agents negotiate inside a Trusted Execution Environment (TEE) on behalf of each company. They read internal company data — R&D priorities, procurement needs, org charts — find the best cross-border matches, and output a meeting schedule. No human ever sees another company's secrets.

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
| Market Radar | Continuous cross-industry opportunity scanning via embeddings + TEE |
| Deal Intelligence | AI-tracked deal flow, warm intro ranking, outreach drafting |
| Competitive Sensing | Private competitor monitoring inside hardware-isolated enclaves |

## Stack

- Next.js 16 + TypeScript + Tailwind CSS
- OpenAI GPT-4o-mini (multi-agent reasoning, critique, synthesis)
- OpenAI text-embedding-3-small (256-dim vector similarity matrix)
- OpenAI omni-moderation-latest (content safety verification)
- SimHash/LSH (feature-hashing capability matching)
- SHA-256 hash chain (tamper-evident audit trail)
- TEE (Intel SGX / AMD SEV hardware-isolated enclave)

## YC RFS Alignment

**Company Brain** — AI that understands a company's internal data and acts on it. Serendipity is a Company Brain applied to cross-border B2B matchmaking: each company's AI agent holds real internal data inside a TEE, then negotiates matches with other companies' agents without exposing raw data.

## Beyond Matching

Serendipity is not just a conference matchmaker — it is a persistent intelligence layer for cross-industry opportunity discovery.

### Market Radar

Continuous cross-industry opportunity scanning powered by OpenAI Embeddings. Agents monitor patent filings, press releases, funding rounds, and regulatory shifts across sectors to surface non-obvious partnership opportunities before competitors see them. All scanning runs inside the TEE — your watch-list and strategic priorities never leave the enclave.

### Deal Intelligence

AI-tracked deal flow and warm intro generation. Once a match is surfaced, Serendipity's agents build a deal dossier: mutual contacts, overlapping investors, complementary IP portfolios, and optimal timing windows. Warm introduction paths are ranked by strength and recency, and agents can draft outreach on your behalf — subject to your disclosure policy.

### Competitive Sensing

Monitor market moves privately via TEE. Track competitor hiring patterns, product launches, and partnership announcements without revealing what you are watching. Because sensing runs inside hardware-isolated enclaves, your competitive intelligence queries are invisible to platform operators and other participants alike.

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
