import { CompanyId, DisclosureLevel, DisclosureState } from "./types";
import { COMPANIES, ENTERPRISES, STARTUPS } from "./secrets";

// プロセスグローバルな状態管理
declare global {
  // eslint-disable-next-line no-var
  var __disclosureStates: Map<string, DisclosureState> | undefined;
}

function getStates(): Map<string, DisclosureState> {
  if (!globalThis.__disclosureStates) {
    globalThis.__disclosureStates = new Map();
  }
  return globalThis.__disclosureStates;
}

function pairKey(a: CompanyId, b: CompanyId): string {
  return [a, b].sort().join(":");
}

// 初期化: enterprise × startup の全ペアを作成
export function initializeDisclosures(): void {
  const states = getStates();
  for (const e of ENTERPRISES) {
    for (const s of STARTUPS) {
      const key = pairKey(e.id, s.id);
      if (!states.has(key)) {
        states.set(key, {
          enterpriseId: e.id,
          startupId: s.id,
          level: 0,
          enterpriseOptedIn: false,
          startupOptedIn: false,
          ndaSigned: false,
          levelData: {
            0: { matchExists: false },
            1: null,
            2: null,
            3: null,
          },
        });
      }
    }
  }
}

// マッチング結果を受けてLevel 0を更新
export function setMatchExists(
  enterpriseId: CompanyId,
  startupId: CompanyId,
  abstractCap: string,
  abstractNeed: string,
  region: string,
): void {
  const states = getStates();
  const key = pairKey(enterpriseId, startupId);
  const state = states.get(key);
  if (!state) return;
  state.levelData[0] = { matchExists: true };
  state.levelData[1] = { abstractCapability: abstractCap, abstractNeed: abstractNeed, region };
  state.level = 1; // マッチが見つかったら自動でLevel 1に
  states.set(key, state);
}

// 興味を表明
export function expressInterest(companyId: CompanyId, partnerId: CompanyId): DisclosureState | null {
  const states = getStates();
  const key = pairKey(companyId, partnerId);
  const state = states.get(key);
  if (!state) return null;

  if (companyId === state.enterpriseId) {
    state.enterpriseOptedIn = true;
  } else {
    state.startupOptedIn = true;
  }

  // 双方が興味を示したらLevel 2に
  if (state.enterpriseOptedIn && state.startupOptedIn && state.level < 2) {
    const startup = COMPANIES.find((c) => c.id === state.startupId);
    state.level = 2;
    state.levelData[2] = {
      detailedCapability: startup
        ? `${startup.role} with proven technology in ${startup.industry.replace(/-/g, " ")}`
        : "",
      scale:
        startup?.country === "Kazakhstan"
          ? "Central Asian manufacturing base"
          : startup?.country === "China"
            ? "Shenzhen-based with 12+ engineers"
            : "Osaka-based with FDA-certified facilities",
      timeline: "Available for immediate pilot partnership",
    };
  }

  states.set(key, state);
  return state;
}

// NDA署名でLevel 3に
export function signNDA(enterpriseId: CompanyId, startupId: CompanyId): DisclosureState | null {
  const states = getStates();
  const key = pairKey(enterpriseId, startupId);
  const state = states.get(key);
  if (!state || state.level < 2) return null;

  state.ndaSigned = true;
  state.level = 3;

  const startup = COMPANIES.find((c) => c.id === state.startupId);

  state.levelData[3] = {
    companyName: startup?.name ?? "",
    contact: `${startup?.name} CEO — ${startup?.country}`,
    fullDetails: `Full technical dossier and contact information now available for ${startup?.name} (${startup?.role}, ${startup?.country}).`,
  };

  states.set(key, state);
  return state;
}

// 全ディスクロージャー状態を取得
export function getAllDisclosures(): DisclosureState[] {
  const states = getStates();
  return Array.from(states.values());
}

// 特定ペアの状態を取得
export function getDisclosure(enterpriseId: CompanyId, startupId: CompanyId): DisclosureState | null {
  const states = getStates();
  return states.get(pairKey(enterpriseId, startupId)) ?? null;
}

export function resetDisclosures(): void {
  globalThis.__disclosureStates = undefined;
}
