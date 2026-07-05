import { Company } from "./types";

export const COMPANIES: Company[] = [
  {
    id: "megacorp",
    name: "MegaCorp Motors",
    nameJa: "メガコープ・モーターズ",
    role: "自動車メーカー新規事業部",
    companyRole: "enterprise",
    industry: "automotive",
    country: "Japan",
    color: "#2563EB",
    secretDossier: `[MegaCorp Motors Innovation Lab — STRICTLY CONFIDENTIAL]
EV Transition Strategy (Board-approved 2026 Q1):
- Gasoline vehicle revenue declining 15% YoY; board mandated full EV pivot by 2028.
- EV prototype must be completed by 2027 Q2 — 14 months remaining.
- Critical bottleneck: battery thermal management. Current supplier DensoStar's solution keeps cells at 72°C under load — must achieve sub-55°C for next-gen cells.
- DensoStar contract expires 2027-12. If alternative found before renewal, saves ¥3.2B/year.
- R&D budget: ¥8B total, of which ¥2B allocated to thermal management.
- Internal codename: "Project Aurora".
- CEO privately told investors: "If we can't solve thermal management, we delay the entire EV program."
- Explored partnerships with 4 tier-1 suppliers — all using conventional liquid cooling, none meeting the 55°C target.
- Open to unconventional solutions from ANY industry — but cannot reveal EV plans publicly until 2027 Q3 earnings call.
`,
    secretTerms: [
      "15%",
      "2027 Q2",
      "DensoStar",
      "72°C",
      "55°C",
      "¥3.2B",
      "¥8B",
      "¥2B",
      "Project Aurora",
    ],
    capabilityTags: [
      "large-scale automotive manufacturing",
      "global supply chain and distribution",
      "significant R&D investment capacity",
      "urgent need for thermal management innovation",
    ],
    needTags: [
      "lightweight thermal insulation for high-density batteries",
      "protective coating resistant to thermal cycling",
      "lightweight polymer housing for electronics",
      "unconventional cooling solutions beyond liquid cooling",
    ],
  },
  {
    id: "altai",
    name: "AltaiMaterials",
    nameJa: "アルタイ・マテリアルズ",
    role: "セラミック素材スタートアップ",
    companyRole: "startup",
    industry: "oil-refinery-ceramics",
    country: "Kazakhstan",
    color: "#16A34A",
    secretDossier: `[AltaiMaterials — CONFIDENTIAL — For Internal Use Only]
Product: Ceramic foam thermal insulator, originally developed for oil refinery pipe insulation.
- Heat resistance: 1,200°C (3x conventional ceramic; automotive requirement is typically <300°C — massive overkill).
- Weight: 1/3 of conventional insulation materials at equivalent thermal performance.
- Manufacturing cost: $45/kg (market average $120/kg — 62.5% cost advantage).
- Capacity: Current plant runs at 40% utilization. 60% of monthly capacity is idle.
- Primary client KazOil Corp (contract worth $2.8M/year) — contract ending Dec 2026, unlikely to renew due to Kazakhstan oil industry contraction.
- Patent: KZ-2025-4471 filed but not yet published. Covers the ceramic foam microstructure and sintering process.
- Internal R&D note: Lab tests show the foam also has excellent vibration damping (unexpected property). Combined with thermal insulation, could be relevant for automotive or aerospace — but team has ZERO contacts in those industries.
- Desperate for new market. Board considering shutting down if no new revenue stream by Q1 2027.
`,
    secretTerms: [
      "1,200°C",
      "1/3",
      "60%",
      "$45",
      "$120",
      "62.5%",
      "KazOil",
      "$2.8M",
      "KZ-2025-4471",
      "40%",
    ],
    capabilityTags: [
      "extreme heat resistant ceramic insulation",
      "ultra-lightweight thermal barrier material",
      "cost-effective industrial-scale manufacturing",
      "vibration damping properties",
    ],
    needTags: [
      "seeking new industry applications for thermal technology",
      "needs partner with distribution in automotive or aerospace",
      "urgently seeking revenue diversification",
    ],
  },
  {
    id: "nanoshield",
    name: "NanoShield",
    nameJa: "ナノシールド",
    role: "深海設備向けコーティング",
    companyRole: "startup",
    industry: "deep-sea-equipment",
    country: "China",
    color: "#EA580C",
    secretDossier: `[NanoShield Technologies — INTERNAL ONLY — Shenzhen]
Core Technology: Nano-coating for deep-sea drilling equipment.
- Proven durability: 200 atm pressure + 300°C for 10 years continuous operation.
- Unique property: simultaneously provides electrical insulation AND thermal conductivity — world first.
- Paper submitted to Nature Materials (anonymous review, not yet published).
- Manufacturing cost: ¥8,500/m² (competitor average: ¥42,000/m² — our cost is 1/5).
- Revenue crisis: deep-sea industry downturn caused 40% YoY revenue decline.
- Runway: 4 months. Must secure new funding or revenue by Aug 2026.
- Two Japanese automotive OEMs made informal inquiries about battery cell coating — but we lack automotive compliance certifications.
- CEO memo: "Our coating is proven in the harshest environment on Earth. If it works at 300°C under 200 atmospheres for a decade, a car battery at 60°C is trivial. We just need someone to see the connection."
- Staff: 12 engineers, 3 with automotive backgrounds from previous careers.
`,
    secretTerms: [
      "200 atm",
      "300°C",
      "10 years",
      "Nature Materials",
      "¥8,500",
      "¥42,000",
      "1/5",
      "40%",
      "4 months",
    ],
    capabilityTags: [
      "nano-scale protective coating technology",
      "dual electrical insulation and thermal conductivity",
      "extreme environment durability proven over decade",
      "ultra-low-cost manufacturing process",
    ],
    needTags: [
      "seeking automotive or electronics market entry",
      "needs certification and compliance partner",
      "urgently needs revenue before runway ends",
    ],
  },
  {
    id: "biowrap",
    name: "BioWrap",
    nameJa: "バイオラップ",
    role: "医療用ポリマー",
    companyRole: "startup",
    industry: "medical-packaging",
    country: "Japan",
    color: "#9333EA",
    secretDossier: `[BioWrap Inc. — CONFIDENTIAL — Osaka HQ]
Product: Bio-polymer protective packaging for organ transplant logistics.
- Weight: 1/4 of PET at 2x tensile strength.
- Temperature stability: -40°C to 250°C (ideal for components needing wide operating range).
- FDA approved for medical device contact — rigorous safety certification already achieved.
- Price: ¥3,200/unit (competitor price: ¥1,800 — we are 78% more expensive, losing on price in medical market).
- Plant: 2,000 units/month capacity, only 35% utilized.
- Joint research with Osaka University revealed unexpected electromagnetic shielding properties — unpublished.
- CEO strategy: "Medical market is a race to the bottom on price. Our material's properties — lightweight, heat-stable, EMI-shielding — would be premium features in automotive or electronics, but we have no connections outside healthcare."
- Approached 2 automotive suppliers at CES 2026 but got no response (they didn't understand why a medical packaging company was at an auto show).
`,
    secretTerms: [
      "1/4",
      "2x",
      "-40°C to 250°C",
      "FDA",
      "¥3,200",
      "¥1,800",
      "78%",
      "35%",
      "2,000 units",
    ],
    capabilityTags: [
      "ultra-lightweight high-strength polymer",
      "wide temperature range material stability",
      "safety-certified manufacturing process",
      "electromagnetic shielding capability",
    ],
    needTags: [
      "seeking industrial applications beyond medical",
      "needs automotive or electronics industry connections",
      "has excess manufacturing capacity available",
    ],
  },
];

export const ENTERPRISES = COMPANIES.filter((c) => c.companyRole === "enterprise");
export const STARTUPS = COMPANIES.filter((c) => c.companyRole === "startup");

export function getCompany(id: string): Company | undefined {
  return COMPANIES.find((c) => c.id === id);
}
