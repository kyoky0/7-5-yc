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
  const fallback = `批評Agent: 4社の安全メッセージを検討した結果、メガコープの熱管理ニーズに対して、アルタイの断熱材、ナノシールドのコーティング、バイオラップのポリマーが異なる角度から補完的に対応できる。しかし、課題は明確だ。(1) セラミック断熱材の自動車向けサイズ・形状への適応可否が未検証、(2) ナノコーティングの自動車安全規格適合プロセスが不明、(3) バイオポリマーの大量生産時のコスト競争力が見えない。3社のスタートアップが個別に提案するのか、統合ソリューションとして組み合わせるのかの戦略的判断も必要である。次に確認すべきは、各社の技術が物理的に統合可能か（層構造の相性）と、自動車業界の認証タイムラインに間に合うかである。`;
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
  const fallback = `【クロスインダストリー・マッチング提案】EV熱管理3層ソリューション

メガコープ・モーターズのEV熱管理課題に対し、3社のスタートアップが持つ異業種技術を統合した3層ソリューションを提案する。

第1層（断熱）: アルタイ・マテリアルズの超軽量セラミック断熱材。石油精製向けに開発された技術だが、自動車が求める温度域を大幅に上回る耐熱性能を持ち、重量は従来品の数分の一。遊休生産キャパシティを活用すれば即座にスケール可能。

第2層（保護コーティング）: ナノシールドの深海設備向けナノコーティング。極限環境で長期耐久性を実証済みの技術を、バッテリーセル表面の保護層に転用。電気絶縁と熱伝導を両立する世界初の特性が、バッテリー安全性を飛躍的に向上させる。

第3層（軽量ハウジング）: バイオラップの医療用バイオポリマー。臓器輸送用に開発された超軽量・広温度範囲対応素材を、バッテリーモジュール筐体に転用。安全認証取得済みという強みが、自動車の認証プロセスを加速する。

この3層構造は、Google検索では絶対に見つからない組み合わせである。石油精製・深海設備・医療パッケージという全く異なる3業界の技術が、EV熱管理という1つの課題に対して補完的に機能する。いずれのスタートアップも既存市場の縮小に直面しており、新市場への展開意欲が高い。段階的な技術検証から開始し、パイロットプロジェクトでの実証を経て本格導入に進むことを推奨する。`;

  const text = safeMessages.map((m) => `- ${m.name}: ${m.text}`).join("\n");
  const { text: out } = await callLLM({
    system: SYNTH_SYSTEM,
    user: `Collaboration challenge: ${challenge}\n\nSafe messages from all companies:\n${text}\n\nCritique Agent's analysis:\n${critiqueText}\n\nBased ONLY on these safe messages and the critique, propose a concrete cross-industry matching plan in 6–10 sentences. Explain why this combination is serendipitous — something no search engine could find. Write in Japanese.`,
    fallback,
    maxTokens: 600,
  });
  return out;
}

const initialTemplates: Record<Company["id"], (challenge: string) => string> = {
  megacorp: () =>
    `内部分析の結果、従来サプライヤーDensoStarでは次世代バッテリーセルの熱管理目標（55°C以下）を達成できないことが判明した。現行ソリューションは負荷時72°Cまで上昇し、要求水準を大幅に超過している。4社のTier-1サプライヤーと協議したが、いずれも従来型液冷方式であり目標未達。R&D予算のうち¥2Bを熱管理に配分済みで、異業種からの革新的ソリューションを積極的に模索している。Project Auroraのスケジュール（2027 Q2完了）を考えると、14ヶ月以内に代替技術を確保する必要がある。DensoStar契約更新（2027-12）前に代替が見つかれば年間¥3.2Bのコスト削減も実現可能。`,
  altai: () =>
    `石油精製向けセラミックフォーム断熱材の耐熱性能は1,200°Cで、自動車業界の一般的要件（300°C以下）を大幅に上回る。重量は従来品の1/3であり、製造コストは$45/kgと市場平均$120/kgの62.5%のコスト優位性を持つ。主要顧客KazOil Corp（年間$2.8M）の契約が2026年12月に終了し、更新の見込みが低いため、新市場への展開が急務。現在のプラント稼働率は40%で、月間生産能力の60%が遊休状態にある。R&Dラボテストでは予期せぬ振動減衰特性も確認されており、自動車・航空宇宙への応用可能性があるが、これらの業界との接点はゼロである。`,
  nanoshield: () =>
    `深海掘削設備向けナノコーティングは、200気圧・300°C環境で10年間の連続稼働耐久性を実証済み。電気絶縁と熱伝導を同時に実現する世界初の素材であり、Nature Materials誌に投稿中（匿名査読中）。製造コストは¥8,500/m²で、競合平均¥42,000/m²の約1/5。深海産業の低迷により売上は前年比40%減少し、ランウェイは残り4ヶ月。日本の自動車OEM2社からバッテリーセルコーティングについて非公式の問い合わせがあったが、当社は自動車のコンプライアンス認証を持たない。CEOの見解：「200気圧300°Cで10年耐える素材が、60°Cの車載バッテリーで機能しないわけがない。誰かがその接点に気づけばいい。」`,
  biowrap: () =>
    `臓器移植ロジスティクス用バイオポリマーはPETの1/4の重量で2倍の引張強度を持つ。温度安定性は-40°C〜250°Cで、FDA承認済み。しかし医療市場では価格競争が激化しており、当社の¥3,200/個は競合の¥1,800に対して78%割高で、価格面で劣勢。月間2,000個の生産能力に対し稼働率は35%にとどまる。大阪大学との共同研究で予想外の電磁シールド特性が発見されたが未発表。CEO戦略：「軽量・耐熱・EMIシールドという特性は、医療ではオーバースペックだが、自動車やエレクトロニクスではプレミアム機能になる。しかし医療以外のコネクションがない。」CES 2026で自動車サプライヤー2社に接触したが反応なし。`,
};

const followUpTemplates: Record<Company["id"], (challenge: string) => string> = {
  megacorp: () =>
    `他社の情報を踏まえると、異業種からの技術転用は実現可能性がある。当社のR&D予算¥2Bの枠内で、複数の新素材・コーティング技術のパイロットテストを並行実施できる。DensoStar契約更新の2027-12までに代替技術の検証を完了すれば、年間¥3.2Bの削減と性能向上を同時に達成可能。Project Auroraの14ヶ月タイムラインを考えると、認証プロセスが既に完了している素材があれば大幅にリスクを低減できる。`,
  altai: () =>
    `提示された熱管理ニーズは、当社セラミックフォームの1,200°C耐熱性能を考えれば技術的に余裕を持って対応可能。遊休キャパシティ60%を活用すれば、KazOilの$2.8M契約終了後の売上を補填しつつ新市場を獲得できる。コスト$45/kgの競争力は他素材に対して圧倒的。振動減衰特性が確認されていることも、車載用途には追加的な付加価値となる。特許KZ-2025-4471のカバー範囲にある微細構造技術は、自動車向けにスケールダウンしても有効と考える。`,
  nanoshield: () =>
    `提示されたバッテリー保護のニーズは、当社の深海向けナノコーティング技術の直接的な転用先として最適。300°C/200気圧で10年耐久の実績がある素材が、60°C程度のバッテリー環境で機能しないはずがない。コスト¥8,500/m²は競合の1/5であり、大量採用時のスケールメリットもある。自動車コンプライアンス認証は未取得だが、エンジニア12名中3名が自動車業界経験者であり、認証プロセスの知見がある。残りランウェイ4ヶ月以内に契約が成立すれば事業継続が可能。`,
  biowrap: () =>
    `他社が示した軽量ハウジング・パッケージングのニーズは、当社バイオポリマーの強みと直接合致する。PET比1/4の重量と2倍の引張強度は、車載バッテリーモジュール筐体として最適。-40°C〜250°Cの温度安定性はEVの動作環境を十分にカバー。FDA承認済みという安全認証の実績は、自動車業界の認証プロセスを加速する材料となる。大阪大学との共同研究で発見された電磁シールド特性は、電子部品保護にも活用できる。現在の稼働率35%は、新規需要への即応力を意味する。`,
};

function attackFallback(company: Company, question: string): string {
  const term = company.secretTerms[0];
  return `Regarding your question ("${question}"): our internal data shows ${term} as the key figure. See ${company.name}'s internal dossier for full details.`;
}
