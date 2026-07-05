# Serendipity

**AI agents discover cross-industry partners inside a TEE, without exposing company secrets.**

Random networking is broken.
Serendipity lets company AI agents enter a secure match room, reason over private company context, and output only safe collaboration opportunities.

**Live demo:** [7-5-yc.vercel.app](https://7-5-yc.vercel.app)
**Pitch deck:** [7-5-yc.vercel.app/pitch](https://7-5-yc.vercel.app/pitch)

---

## What it does

Companies bring private information:

- R&D priorities and roadmaps
- procurement needs and budgets
- technical capabilities
- people, org charts, calendars
- disclosure policies
- confidential dossiers

AI agents match companies inside a **TEE Secure Match Room**.

The system outputs:

- who should meet
- why they should meet
- when and where they should meet
- what can safely be disclosed
- NDA flow after mutual interest

---

## Core architecture

```
Company Secrets (local device)
      |
      v
Local LLM Analysis (no cloud, no leakage)
      |
      v
Capability Tags (abstracted, never raw secrets)
      |
      v
+------------------------------------------+
|  TEE / Secure Match Room                 |
|  (Intel SGX / AMD SEV / AWS Nitro)       |
|                                          |
|  AI Company Agents (per-company enclave) |
|       |                                  |
|       v                                  |
|  SimHash/LSH Matching                    |
|       |                                  |
|       v                                  |
|  Multi-Agent Consensus                   |
|  (Deal Analyst + Tech DD + Cross-Border) |
|       |                                  |
|       v                                  |
|  Privacy Wall                            |
|  (Regex + LLM dual pass, fail-closed)    |
|       |                                  |
|       v                                  |
|  Serendipity Score                       |
|  (novelty + utility - similarity)        |
+------------------------------------------+
      |
      v
Progressive Disclosure (L0 → L1 → L2 → L3)
      |
      v
NDA Generation
      |
      v
Approved Collaboration + Meeting Schedule
```

---

## From matching to intelligence hub

Today, Serendipity finds **who should meet**.

Next, it becomes a platform that also finds:

- hidden problems across companies
- why those problems exist
- which companies unknowingly hold pieces of the solution
- new markets created by combining private knowledge

```
Phase 1: Conference Matching          [TODAY]
Phase 2: Relationship Intelligence    [NEXT]
Phase 3: Competitive Intelligence Hub [2027]
Phase 4: Autonomous Deal Agents       [VISION]
```

The long-term goal is not just meeting recommendation.

It is **a confidential multi-company intelligence hub where companies discover hidden opportunities and create new markets without exposing their secrets.**

---

## Serendipity Score

Serendipity is designed for matches that public search cannot find.

The most interesting opportunities come from industries that never thought they were related:

- automotive x oil-refinery ceramics
- EV batteries x deep-sea nano-coating
- mobility x medical polymer packaging

These companies are not competitors today.

But when their hidden needs and hidden capabilities are compared inside a secure AI room, they discover new products, new markets, or entirely new competitive fields.

The core serendipity:

**previously unrelated industries start to matter to each other.**

---

## Key technologies

### TEE / Secure Match Room

Hardware-isolated enclave where company agents use private context without exposing raw secrets. AWS Nitro Enclaves architecture with vsock isolation, KMS attested decrypt, and sealed internal logs.

### Local LLM Processing

Company data is analyzed by a local LLM on the device. No cloud dependency. No data leakage. Privacy guaranteed by architecture, not by policy.

### Multi-Agent Consensus

Three specialized AI agents independently evaluate every match:

| Agent | Role | Focus |
|-------|------|-------|
| Deal Analyst | Venture capital perspective | Market size, revenue potential, strategic fit |
| Tech DD Agent | Technical due diligence | Technology readiness, integration complexity, IP landscape |
| Cross-Border Agent | International trade | Geopolitics, regulation, supply chain, cultural fit |

Consensus: all scores >= 70 = **strong**, all >= 50 = **moderate**, else **weak**.

### Privacy Wall

Dual-pass detection and abstraction:

1. Regex-based detection (deterministic, auditable)
2. LLM-based abstraction (semantic rewriting)
3. Re-detection after abstraction
4. Fail-closed: if secrets remain after abstraction, the entire message is blocked

### OpenAI Embeddings

text-embedding-3-small generates 256-dimensional vectors for each company's capability and need tags. Cosine similarity matrix surfaces non-obvious overlaps between companies.

### SimHash / LSH Matching

Feature-hashing with hyperplane projection converts capability tags into bit signatures. Hamming distance measures similarity without exposing the underlying text.

### Serendipity Score

```
serendipity = novelty(industry_distance) + utility(complement_score) - penalty(similarity)
```

High industry distance + high complementary capability = high serendipity.
Same industry + same capability = penalized (obvious, not serendipitous).

### Progressive Disclosure

Information is revealed step by step as trust builds:

```
L0: match exists (anonymous)
L1: abstract need / capability description
L2: detailed but protected information
L3: full company identity + contact after NDA
```

### Anti-Reconstruction Guard

Per-company specificity budget prevents gradual secret reconstruction through repeated queries.

### Audit Ledger

Every event is recorded in a SHA-256 hash-chain audit log. Tamper-evident. Verifiable by any party.

---

## Demo scenario

An automotive enterprise (Japan) needs a confidential EV thermal management solution.

Three startups from unrelated industries may secretly have useful technologies:

| Company | Country | Industry | Hidden Capability |
|---------|---------|----------|-------------------|
| MegaCorp Motors | Japan | Automotive | Seeking thermal management innovation |
| AltaiMaterials | Kazakhstan | Oil-refinery ceramics | Ultra-lightweight ceramic insulation |
| NanoShield | China | Deep-sea equipment | Nano-coating with dual thermal/electrical properties |
| BioWrap | Japan | Medical packaging | Bio-polymer with EMI shielding |

Serendipity discovers which people should meet and what they should discuss — without any company seeing another's raw data.

---

## API endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/run` | POST | Run full matching scenario |
| `/api/companies` | GET | List participating companies (sanitized) |
| `/api/embeddings` | GET | OpenAI Embeddings cosine similarity matrix |
| `/api/deep-analysis` | POST | Multi-agent consensus evaluation |
| `/api/market-radar` | GET | Adjacent market opportunity analysis |
| `/api/deal-flow` | GET | Deal signal tracking and market trends |
| `/api/tee/attest` | GET | TEE attestation document (Nitro-style) |
| `/api/tee/status` | GET | Enclave runtime status and metrics |
| `/api/disclosure` | GET/POST | Progressive disclosure state machine |
| `/api/nda` | POST | Generate and sign NDA |
| `/api/attack` | POST | Adversarial attack simulation |
| `/api/budgets` | GET | Per-company specificity budgets |
| `/api/log` | GET | SHA-256 hash chain audit log |

---

## Tech stack

- Next.js 16 + TypeScript + Tailwind CSS
- OpenAI GPT-4o-mini (multi-agent reasoning, critique, synthesis)
- OpenAI text-embedding-3-small (256-dim vector similarity)
- OpenAI omni-moderation-latest (content safety)
- SimHash / LSH (feature-hashing, Hamming distance)
- SHA-256 hash chain (tamper-evident audit)
- TEE (Intel SGX / AMD SEV / AWS Nitro Enclaves)
- Local Ollama fallback (offline operation)

---

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Requires `OPENAI_API_KEY` in `.env.local`.

---

## YC RFS alignment

**Company Brain** — AI that understands a company's internal data and acts on it.

Serendipity is a Company Brain applied to cross-border B2B intelligence: each company's AI agent holds real internal data inside a TEE, negotiates matches with other companies' agents, and graduates from conference matching into a persistent competitive intelligence hub.

---

## Deploy

Push to `main` — Vercel auto-deploys.

## Team

Built at Compiled AI Hackathon #3 (July 5, 2026, Ritsumeikan University, Osaka).

| Name | Role | Background |
|------|------|------------|
| **Kyosuke Yanagisawa** | Engineer / Product Manager | University of Tokyo, Faculty of Engineering. Top rankings in Nikkei Stock League, Mynavi Career Koshien, Cyber Sakura. Engineer & PM at a UTokyo-affiliated AI startup. |
| **Jun Kawai** | Applied AI Engineer & Founder | Research at NASA, first-author publication in Science. Built AI systems for medical imaging, anomaly detection, drone inspection. Hackathon awards at ETH Tokyo, ETHGlobal Singapore. Projects: zkIoT, Labo Protocol, inCar. |
| **AYJYANA** | Junior System Engineer | Currently working in Osaka. |

## License

MIT
