# Compiled AI Hackathon #3 — Requirements & Strategy

## Event Overview

| Item | Detail |
|------|--------|
| Name | Compiled x Transpose x Ritsumeikan x OUVC AI Hackathon #3 |
| Date | 2026-07-05 (Sat) 08:30-19:00 JST |
| Location | Ritsumeikan University, Ibaraki, Osaka |
| Build Time | 12:00-17:00 (5 hours) |
| Team Size | Max 4 |
| VIP | Garry Tan (YC President & CEO) — keynote + judging |

## Prizes

| Prize | Amount | What it rewards |
|-------|--------|-----------------|
| 1st Place | 250,000 JPY | Best overall |
| 2nd Place | 100,000 JPY | |
| 3rd Place | 50,000 JPY | |
| The Investable Startup Award | Special | Looks like a real fundable startup |
| The UX/UI Award | Special | Beautiful, polished design |
| The Biggest Engineering Lift | Special | Most technically impressive build |

## Deliverables (Required)

1. **Problem Statement** — What problem are you solving? For whom?
2. **Product Overview** — What does it do? How does it work?
3. **90-second Demo Video** — IN ENGLISH. Must show working product.
4. **Global Market Perspective** — Why is this a global opportunity?

## 3 Themes (Evaluation Axes) — YC RFS S26

### Theme 1: Company Brain
- Pull knowledge out of fragmented sources inside a company
- Structure it into executable skills for AI
- Map how a company works: refund processing, pricing decisions, incident response
- Go beyond search — make knowledge ACTIONABLE
- Current solutions (Glean, Guru, Notion AI) only solve search, not execution

### Theme 2: Dynamic Software Interfaces
- Users customize their own UI in real-time
- Software that adapts to the user, not the other way around
- AI generates and modifies interfaces on the fly
- End of "one UI fits all" — every user gets their own experience
- Beyond dashboards — the interface IS the interaction

### Theme 3: Software for Agents
- APIs, MCP servers, CLIs designed for AI agents, not humans
- Machine-readable documentation
- Identity systems and permissions for agents
- Payment infrastructure for autonomous programs
- Rebuild every software category for agent-first consumption

## Garry Tan Context

- Built GStack (23 AI coding skills for Claude Code) and GBrain (persistent knowledge base)
- Believes in "single developer with proper tools = team-scale output"
- Cares about: MCP protocol, developer tools, shipping fast, real products over slides
- YC President — has seen thousands of pitches. Generic AI wrappers bore him.
- Key quote: "The next trillion users aren't people — they're AI agents"

## What Wins (Pattern from past hackathons)

1. **Working demo > slides** — If it runs live, it wins over a deck
2. **Specific > generic** — "I solved THIS for THIS person" beats "platform for everything"
3. **Surprise moment** — One "whoa" in 90 seconds > 90 seconds of features
4. **Real data** — Demo with real transactions/content, not lorem ipsum
5. **Global story** — Japan is fine as starting market but must show global path

## What Loses

1. "AI wrapper" — ChatGPT with a different UI
2. "We'll build the platform later" — No working demo
3. "Everyone is our customer" — No specificity
4. "It's like X but with AI" — No insight into WHY AI changes this
5. Japan-only story with no global angle

---

## Market Research Summary

### Vertical AI Winners (reference points)
| Company | Domain | Valuation | ARR | Pattern |
|---------|--------|-----------|-----|---------|
| Harvey | Legal | $11B | $300M (3yr) | AI replaces lawyers |
| Cursor | Dev Tools | $50B | $4B (3yr) | AI-native daily driver |
| Abridge | Healthcare | $5.3B | — | Ambient clinical AI |
| Sierra | Customer Service | $4.5B | — | Branded AI agents |
| Glean | Enterprise Search | $7.2B | $200M | Company knowledge |

### MCP Ecosystem (2026)
- SDK: 97M monthly downloads (4750% growth in 16 months)
- Now under Linux Foundation (AAIF)
- 75% of API gateway vendors adding MCP features (Gartner)
- **Gaps:** Security (36.7% SSRF vuln), enterprise auth, discovery
- **Pain:** 46% of enterprises cite integration as #1 agent challenge
- Only 17% have fully deployed AI agents (intent-deployment gap: 68pts)

### "Bridge/Wrapper" Success Pattern
| Company | What it bridges | Outcome |
|---------|----------------|---------|
| Plaid | Banks → Fintech apps | $13.4B |
| Bridge | Stablecoins → Payments | $1.1B (Stripe acquired) |
| Merge.dev | HR/CRM → Apps | 929 active domains |
| Composio | SaaS → AI Agents | 900+ integrations, $2M ARR |
| Truto | APIs → MCP Servers | Dynamic MCP generation |

### Japanese Accounting Market
- Cloud accounting adoption: 38.4% (growing)
- Yayoi: 54.0%, freee: 25.1%, MoneyForward: 15.7% (= 94.8%)
- freee: 2.6M+ business users, open API, English docs
- **ZERO MCP servers for any Japanese accounting software**
- Tax incentives planned for 2028 → adoption accelerating

---

## Builder's Arsenal

### Existing Code (reusable)
- **Bookmee/minami-aoyama**: Fastify + Prisma + PostgreSQL + OpenAI
  - MoneyForward OAuth integration (working, deployed)
  - AI journal entry classification (勘定科目)
  - Receipt OCR + matching
  - Invoice compliance (インボイス制度)
  - Multi-tenant (Supabase Auth + RLS)
  - Deployed on Railway: https://bookmee-production.up.railway.app
- **zeta-totsugo**: Tax reconciliation SaaS (Vercel)
- **Claude Code + MCP**: Deep expertise, GStack/GBrain installed

### Tech Stack
- Backend: Fastify + Prisma + PostgreSQL
- Auth: Supabase Auth + RLS
- Frontend: Vanilla JS (lightweight, fast)
- Deploy: Railway (backend), Vercel (frontend)
- AI: OpenAI API, Claude API

### Domain Knowledge
- Japanese tax law (消費税, インボイス制度, 確定申告)
- Accounting workflows (仕訳, 月次締め, 税務申告)
- Real client relationships (南青山)
- Tax accountant market understanding (27,000+ firms in Japan)

---

## YC Portfolio Minefield (DO NOT OVERLAP)

### Company Brain companies in YC
- Hyper, Savant, Cerenovus, Hyperspell, Memory Store, Slite

### Software for Agents companies in YC
- Composio ($100K+ MRR, 500+ MCP servers)
- StackOne ($24M), CopilotKit ($27M)
- Zatanna, Manufact (20% of US 500 companies), 21st

### Safe zones (no YC company)
- Accounting/tax AI agents
- Japanese SaaS MCP servers
- Domain-specific compliance agents

---

## Judges Intelligence (2026-07-05)

### Confirmed Judges

| Name | Company | Role | Background | What impresses them |
|------|---------|------|------------|---------------------|
| Garry Tan | Y Combinator | President & CEO | GStack/GBrain builder, "next trillion users are agents" | Working product, MCP/Agent infra, dev tools |
| Sean Grove | Linzumi (YC) | Founder & CEO | 3x YC Founder, ex-OpenAI (post-training), ex-Netlify (OneGraph acq.) | Multi-agent coordination, AI coding agents |
| Henry Ndubuaku | Cactus (YC S25) | Founder & CTO | Quant/economist, Forbes Tech Council, turned down Nvidia | Edge AI, mobile inference, open-source, practical AI infra |

### Key Hosts (likely influential)

| Name | Company | Background | Interest |
|------|---------|------------|----------|
| Sabba Petri | Transpose Platform | c0mpiled series organizer, YC-connected | Global startups, agent ecosystems |
| Towaki Takikawa | Outerport, ex-NVIDIA Research | UT PhD, Neural Fields/3D AI researcher | Domain-specific AI agents, manufacturing AI |
| James Tan | Quest Ventures | Managing Partner, Asia VC | Digital commerce, Asia market |

### Pattern: What ALL judges care about

1. **AI agents doing real work** — every judge builds or invests in this
2. **Software for Agents is the table stakes axis** — all judges live in this world
3. **Company Brain × Software for Agents = highest impact combo** — hits Garry + Towaki directly
4. **Domain specificity wins** — Towaki (manufacturing), Henry (mobile), Sean (coding) are all vertical players
5. **Dynamic Software Interfaces = demo "whoa" factor** — use for visual surprise in 90-sec video

### Winning formula (derived from judges)

**Build something where an AI agent actually DOES a domain-specific job, using company knowledge, with a UI that adapts dynamically.**

→ Hit all 3 axes: Company Brain (knowledge) + Software for Agents (infra) + Dynamic Interfaces (UX)

---

## Open Question: What Fundamentally Wins?

Judges demand: domain-specific AI agent that does real work, not a generic tool.
Must hit 2-3 theme axes. Must have "whoa" demo moment.
Our moat: accounting/tax domain knowledge + working MoneyForward integration.
