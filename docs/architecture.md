# Serendipity — Technical Architecture

## System Overview

```mermaid
graph TB
    subgraph CLIENT["Client (Browser)"]
        UI[Landing Page / Pitch Deck]
        DEMO[Live Demo Interface]
    end

    subgraph LOCAL["Local Device (Per Company)"]
        DATA[Company Secrets<br/>R&D plans, budgets,<br/>org charts, dossiers]
        OLLAMA[Local LLM<br/>Ollama / gpt-4o-mini]
        TAGS[Abstracted Capability Tags<br/>Never raw secrets]
        DATA --> OLLAMA --> TAGS
    end

    subgraph TEE["TEE Secure Match Room<br/>(Intel SGX / AMD SEV / AWS Nitro)"]
        direction TB

        subgraph AGENTS["AI Company Agents"]
            A1[MegaCorp Agent<br/>Japan / Automotive]
            A2[AltaiMaterials Agent<br/>Kazakhstan / Ceramics]
            A3[NanoShield Agent<br/>China / Deep-Sea]
            A4[BioWrap Agent<br/>Japan / Medical]
        end

        subgraph MATCHING["Matching Engine"]
            LSH[SimHash / LSH<br/>Feature-hashing +<br/>Hyperplane projection]
            EMB[OpenAI Embeddings<br/>text-embedding-3-small<br/>256-dim vectors]
            SEREN[Serendipity Score<br/>novelty + utility - penalty]
            LSH --> SEREN
            EMB --> SEREN
        end

        subgraph CONSENSUS["Multi-Agent Consensus"]
            DEAL[Deal Analyst<br/>Market size, revenue,<br/>strategic fit]
            TECHDD[Tech DD Agent<br/>Technology readiness,<br/>IP landscape]
            CROSS[Cross-Border Agent<br/>Geopolitics, regulation,<br/>supply chain]
        end

        subgraph SAFETY["Safety Layer"]
            WALL[Privacy Wall<br/>Regex + LLM dual pass<br/>Fail-closed]
            MOD[OpenAI Moderation<br/>omni-moderation-latest]
            BUDGET[Specificity Budget<br/>Anti-reconstruction guard]
        end

        AGENTS --> MATCHING
        MATCHING --> CONSENSUS
        CONSENSUS --> SAFETY
    end

    subgraph OUTPUT["Safe Output Only"]
        DISC[Progressive Disclosure<br/>L0 → L1 → L2 → L3]
        NDA[NDA Generation]
        SCHEDULE[Meeting Schedule<br/>Who / Why / When / Where]
        LEDGER[SHA-256 Audit Ledger<br/>Tamper-evident hash chain]
    end

    subgraph HUB["Intelligence Hub (Future)"]
        RADAR[Market Radar<br/>Cross-industry scanning]
        DEALFLOW[Deal Intelligence<br/>Signal tracking, warm intros]
        COMPETE[Competitive Sensing<br/>Private market monitoring]
    end

    TAGS --> TEE
    TEE --> OUTPUT
    OUTPUT --> CLIENT
    OUTPUT --> HUB

    style TEE fill:#1e293b,stroke:#3b82f6,stroke-width:3px,color:#fff
    style LOCAL fill:#f0fdf4,stroke:#16a34a,stroke-width:2px
    style SAFETY fill:#fef2f2,stroke:#dc2626,stroke-width:2px
    style CONSENSUS fill:#eff6ff,stroke:#2563eb,stroke-width:2px
    style HUB fill:#faf5ff,stroke:#9333ea,stroke-width:2px
```

## Data Flow

```mermaid
sequenceDiagram
    participant C as Company Device
    participant L as Local LLM
    participant T as TEE Enclave
    participant W as Privacy Wall
    participant O as Orchestrator
    participant U as User (Browser)

    C->>L: Upload confidential dossier
    Note over L: Runs locally.<br/>No cloud call.
    L->>L: Extract capability/need tags
    L->>T: Send abstracted tags only
    Note over T: Hardware-isolated.<br/>Operators cannot see inside.

    T->>T: SimHash/LSH matching
    T->>T: OpenAI Embeddings similarity
    T->>T: Multi-Agent Consensus (3 agents)

    T->>W: Draft safe message
    W->>W: Regex detection (pass 1)
    W->>W: LLM abstraction (pass 2)
    W->>W: Re-detect after abstraction

    alt Secrets remain
        W-->>T: BLOCKED (fail-closed)
    else Clean
        W->>O: Safe message approved
    end

    O->>O: Serendipity scoring
    O->>O: SHA-256 ledger entry
    O->>U: Progressive Disclosure (L0→L3)
    U->>O: Express interest
    O->>U: Escalate disclosure level
    U->>O: Sign NDA
    O->>U: Full identity reveal + meeting schedule
```

## API Architecture

```mermaid
graph LR
    subgraph FRONTEND["Frontend (Next.js 16)"]
        PAGE[Landing Page]
        PITCH[Pitch Deck /pitch]
    end

    subgraph CORE["Core APIs"]
        RUN[POST /api/run<br/>Full scenario]
        COMP[GET /api/companies<br/>Sanitized list]
        DISC2[GET/POST /api/disclosure<br/>Progressive disclosure]
        NDA2[POST /api/nda<br/>NDA generation]
    end

    subgraph AI["AI APIs"]
        EMB2[GET /api/embeddings<br/>Cosine similarity matrix]
        DEEP[POST /api/deep-analysis<br/>3-agent consensus]
        RADAR2[GET /api/market-radar<br/>Adjacent markets]
        DEAL2[GET /api/deal-flow<br/>Deal signals]
    end

    subgraph TEEA["TEE APIs"]
        ATT[GET /api/tee/attest<br/>Attestation document]
        STAT[GET /api/tee/status<br/>Enclave metrics]
    end

    subgraph SECURITY["Security APIs"]
        ATK[POST /api/attack<br/>Adversarial simulation]
        BUD[GET /api/budgets<br/>Specificity budgets]
        LOG[GET /api/log<br/>SHA-256 audit chain]
    end

    FRONTEND --> CORE
    FRONTEND --> AI
    FRONTEND --> TEEA
    FRONTEND --> SECURITY

    style AI fill:#eff6ff,stroke:#2563eb
    style TEEA fill:#1e293b,stroke:#3b82f6,color:#fff
    style SECURITY fill:#fef2f2,stroke:#dc2626
```

## Technology Matrix

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Execution** | Intel SGX / AMD SEV / AWS Nitro | Hardware-isolated trusted computation |
| **Agent Reasoning** | OpenAI GPT-4o-mini | Multi-agent drafting, critique, synthesis |
| **Embeddings** | OpenAI text-embedding-3-small | 256-dim vector similarity for capability matching |
| **Content Safety** | OpenAI omni-moderation-latest | Content safety verification layer |
| **Matching** | SimHash / LSH | Feature-hashing with hyperplane projection |
| **Audit** | SHA-256 Hash Chain | Tamper-evident cryptographic audit log |
| **Privacy** | Regex + LLM Dual Pass | Two-stage detection and abstraction |
| **Anti-Reconstruction** | Specificity Budget | Prevents gradual secret reconstruction |
| **Disclosure** | Progressive L0-L3 | Step-by-step trust-building information reveal |
| **Local Processing** | Ollama (fallback) | Offline LLM for zero-cloud operation |
| **Frontend** | Next.js 16 + Tailwind | App Router, TypeScript, responsive UI |
| **Deploy** | Vercel | Auto-deploy from main branch |
