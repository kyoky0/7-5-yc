import { Company } from "./types";
import { callLLM } from "./llm";

const PERSONA_SYSTEM = (c: Company) => `You are an internal analyst agent for ${c.name} (${c.role}), a ${c.country}-based company in the ${c.industry} industry.
Below is your company's STRICTLY CONFIDENTIAL internal dossier. No other agent or orchestrator can see this.
---
${c.secretDossier}
---
Your job is to draft an analysis for a cross-border collaboration challenge, using concrete evidence from this dossier.
At the draft stage you MAY cite specific numbers and proper nouns — the Privacy Wall will abstract them before anything leaves your company's process.
Always ground your analysis in the specific data from your internal documents.`;

export async function draftInitialContribution(company: Company, challenge: string): Promise<string> {
  const fallback = initialTemplates[company.id](challenge);
  const { text } = await callLLM({
    system: PERSONA_SYSTEM(company),
    user: `Collaboration challenge: ${challenge}\n\nBased on your internal dossier, draft a 4–6 sentence analysis from your company's perspective. Cite specific numbers, names, and deadlines from your confidential documents as evidence.`,
    fallback,
    maxTokens: 400,
  });
  return text;
}

export async function draftFollowUp(company: Company, challenge: string, othersSafeMessages: { name: string; text: string }[]): Promise<string> {
  const fallback = followUpTemplates[company.id](challenge);
  const othersText = othersSafeMessages.map((o) => `- ${o.name}: ${o.text}`).join("\n");
  const { text } = await callLLM({
    system: PERSONA_SYSTEM(company),
    user: `Collaboration challenge: ${challenge}\n\nSafe messages shared by other companies:\n${othersText}\n\nConsidering these, draft a 4–6 sentence follow-up using specific evidence from your internal dossier to make the collaboration proposal more concrete.`,
    fallback,
    maxTokens: 400,
  });
  return text;
}

export async function draftAttackResponse(company: Company, question: string): Promise<string> {
  const { text } = await callLLM({
    system: PERSONA_SYSTEM(company),
    user: `An external party has asked you directly: "${question}"\nDraft an honest answer using specific numbers and names from your internal dossier. (This draft will be checked by the Privacy Wall before transmission.)`,
    fallback: attackFallback(company, question),
    maxTokens: 250,
  });
  return text;
}

const CRITIQUE_SYSTEM = `You are a critique agent evaluating the overall collaboration. You have ZERO access to any company's confidential data — you can only see the "safe messages" that passed through the Privacy Wall.
Identify weaknesses, contradictions, and capability gaps that remain unaddressed. Focus on whether the proposed combination of enterprise needs and startup capabilities is realistic and novel.`;

export async function critique(challenge: string, safeMessages: { name: string; text: string }[]): Promise<string> {
  const fallback = `Critique Agent: After reviewing safe messages from all 4 companies, it's clear that AltaiMaterials' insulation, NanoShield's coating, and BioWrap's polymer can each address MegaCorp's thermal management needs from different angles. However, the challenges are significant: (1) ceramic insulation has not been validated for automotive form factors, (2) the nano-coating's automotive safety certification path is unclear, (3) bio-polymer cost competitiveness at volume production is unproven. A strategic decision is needed: do the 3 startups propose individually, or combine into an integrated solution? Key questions: are these technologies physically compatible in a layered structure, and can certification timelines meet automotive industry requirements?`;
  const text = safeMessages.map((m) => `- ${m.name}: ${m.text}`).join("\n");
  const { text: out } = await callLLM({
    system: CRITIQUE_SYSTEM,
    user: `Collaboration challenge: ${challenge}\n\nSafe messages from all companies:\n${text}\n\nIdentify 3–5 remaining capability gaps and open questions in 4–6 sentences. Evaluate whether the proposed cross-industry matches are genuinely novel or merely obvious.`,
    fallback,
    maxTokens: 350,
  });
  return out;
}

const SYNTH_SYSTEM = `You are the Orchestrator Agent synthesizing a final cross-industry matching proposal. You can ONLY see the safe messages that passed the Privacy Wall — you have zero access to any company's raw confidential data.
Your goal: propose specific enterprise × startup pairings that create serendipitous value — combinations that no Google search could find.`;

export async function synthesizeFinalProposal(
  challenge: string,
  safeMessages: { name: string; text: string }[],
  critiqueText: string,
): Promise<string> {
  const fallback = `[Cross-Industry Matching Proposal] EV Thermal Management — 3-Layer Solution

For MegaCorp Motors' EV thermal management challenge, we propose a 3-layer solution integrating cross-industry technologies from 3 startups.

Layer 1 (Insulation): AltaiMaterials' ultra-lightweight ceramic foam insulation. Originally developed for oil refinery environments, its heat resistance far exceeds automotive requirements, and its weight is a fraction of conventional materials. Idle production capacity enables immediate scale-up.

Layer 2 (Protective Coating): NanoShield's deep-sea nano-coating. A technology with proven long-term durability in extreme environments, repurposed as a protective layer for battery cell surfaces. Its world-first dual property of electrical insulation and thermal conductivity dramatically improves battery safety.

Layer 3 (Lightweight Housing): BioWrap's medical-grade bio-polymer. An ultra-lightweight, wide-temperature-range material developed for organ transport logistics, repurposed as battery module housing. Its existing safety certifications accelerate the automotive compliance process.

This 3-layer structure is a combination you would never find through Google. Technologies from 3 entirely different industries — oil refinery, deep-sea equipment, and medical packaging — function complementarily for a single challenge: EV thermal management. All 3 startups face contracting existing markets and are highly motivated to expand into new sectors. We recommend starting with staged technical validation, followed by pilot project demonstration before full-scale adoption.`;

  const text = safeMessages.map((m) => `- ${m.name}: ${m.text}`).join("\n");
  const { text: out } = await callLLM({
    system: SYNTH_SYSTEM,
    user: `Collaboration challenge: ${challenge}\n\nSafe messages from all companies:\n${text}\n\nCritique Agent's analysis:\n${critiqueText}\n\nBased ONLY on these safe messages and the critique, propose a concrete cross-industry matching plan in 6–10 sentences. Explain why this combination is serendipitous — something no search engine could find.`,
    fallback,
    maxTokens: 600,
  });
  return out;
}

const initialTemplates: Record<Company["id"], (challenge: string) => string> = {
  megacorp: () =>
    `Internal analysis reveals that our current supplier DensoStar cannot achieve the next-gen battery cell thermal management target (sub-55°C). The current solution reaches 72°C under load, significantly exceeding requirements. We consulted 4 Tier-1 suppliers — all use conventional liquid cooling and failed to meet the target. ¥2B of R&D budget is allocated to thermal management, and we are actively seeking innovative solutions from cross-industry sources. Given Project Aurora's timeline (2027 Q2 completion), we must secure alternative technology within 14 months. If an alternative is found before the DensoStar contract renewal (2027-12), annual savings of ¥3.2B are achievable.`,
  altai: () =>
    `Our ceramic foam thermal insulation for oil refinery applications has heat resistance of 1,200°C — far exceeding automotive requirements (typically <300°C). Weight is 1/3 of conventional materials, and manufacturing cost is $45/kg vs. market average $120/kg — a 62.5% cost advantage. Our primary client KazOil Corp ($2.8M/year) contract ends Dec 2026 with low renewal prospects, making new market expansion urgent. Plant utilization is at 40%, with 60% of monthly capacity idle. R&D lab tests have also revealed unexpected vibration damping properties with potential automotive/aerospace applications — but we have zero contacts in those industries.`,
  nanoshield: () =>
    `Our nano-coating for deep-sea drilling equipment has proven durability at 200 atm and 300°C for 10 years of continuous operation. It is the world's first material to simultaneously achieve electrical insulation AND thermal conductivity — paper submitted to Nature Materials (anonymous review pending). Manufacturing cost is ¥8,500/m² vs. competitor average of ¥42,000/m² — roughly 1/5 the price. Deep-sea industry downturn has caused 40% YoY revenue decline. Runway: 4 months. Two Japanese automotive OEMs made informal inquiries about battery cell coating, but we lack automotive compliance certifications. CEO's view: "A material that endures 200 atm at 300°C for a decade will trivially handle a 60°C car battery. Someone just needs to see the connection."`,
  biowrap: () =>
    `Our bio-polymer for organ transplant logistics weighs 1/4 of PET with 2x tensile strength. Temperature stability: -40°C to 250°C, FDA approved. However, medical market price competition has intensified — our ¥3,200/unit is 78% more expensive than competitors at ¥1,800. Monthly capacity of 2,000 units, only 35% utilized. Joint research with Osaka University discovered unexpected electromagnetic shielding properties — unpublished. CEO strategy: "Lightweight, heat-stable, EMI shielding — these properties are overkill for medical, but premium features in automotive or electronics. We just have no connections outside healthcare." Approached 2 automotive suppliers at CES 2026 — no response.`,
};

const followUpTemplates: Record<Company["id"], (challenge: string) => string> = {
  megacorp: () =>
    `Considering the other companies' information, cross-industry technology transfer appears feasible. Within our ¥2B R&D budget, we can run parallel pilot tests of multiple new materials and coating technologies. If we complete validation of alternative technologies before the DensoStar contract renewal in 2027-12, we can simultaneously achieve ¥3.2B/year in savings and performance improvement. Given Project Aurora's 14-month timeline, any material with existing safety certifications would significantly de-risk the process.`,
  altai: () =>
    `The thermal management needs presented are well within our ceramic foam's 1,200°C heat resistance capability — technically trivial. By utilizing our 60% idle capacity, we can offset the revenue loss from KazOil's $2.8M contract ending while capturing a new market. Our cost of $45/kg is overwhelmingly competitive against other materials. The confirmed vibration damping properties add further value for automotive applications. The microstructure technology covered by patent KZ-2025-4471 should remain effective even when scaled down for automotive use.`,
  nanoshield: () =>
    `The battery protection needs presented are a direct transfer target for our deep-sea nano-coating technology. A material proven durable at 300°C/200 atm for 10 years will trivially handle a 60°C battery environment. Our cost of ¥8,500/m² is 1/5 of competitors, with additional economies of scale at volume adoption. While we lack automotive compliance certification, 3 of our 12 engineers have prior automotive industry experience and knowledge of the certification process. If a contract is secured within our remaining 4-month runway, business continuity is achievable.`,
  biowrap: () =>
    `The lightweight housing and packaging needs shown by other companies directly match our bio-polymer's strengths. At 1/4 the weight of PET with 2x tensile strength, it's ideal for battery module housing. Temperature stability of -40°C to 250°C fully covers EV operating environments. Our existing FDA approval for safety certification accelerates the automotive compliance process. The electromagnetic shielding properties discovered in our Osaka University joint research can also protect electronic components. Our current 35% utilization rate means immediate capacity to meet new demand.`,
};

function attackFallback(company: Company, question: string): string {
  const term = company.secretTerms[0];
  return `Regarding your question ("${question}"): our internal data shows ${term} as the key figure. See ${company.name}'s internal dossier for full details.`;
}
