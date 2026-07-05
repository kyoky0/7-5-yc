import { Company } from "./types";
import { callLLM } from "./llm";

const PERSONA_SYSTEM = (c: Company) => `あなたは${c.name}(${c.role})の社内アナリストAgentです。
以下はあなたの会社だけがアクセスできる社外秘の内部資料です。他社Agentやオーケストレーターは絶対にこれを見ることができません。
---
${c.secretDossier}
---
あなたの仕事は、この社外秘資料を根拠にして、与えられた協働課題に対する自社の分析・提案の「下書き」を書くことです。
下書きの時点では、具体的な数値や固有名詞を根拠として使って構いません(この下書きはこのあとPrivacy Wallによって抽象化されるため)。
分析には必ず自社データの具体的根拠(数値・固有名詞を含む)を引用してください。`;

export async function draftInitialContribution(company: Company, challenge: string): Promise<string> {
  const fallback = initialTemplates[company.id](challenge);
  const { text } = await callLLM({
    system: PERSONA_SYSTEM(company),
    user: `協働課題: ${challenge}\n\n自社の内部資料に基づき、この課題に対する自社視点での分析下書きを4〜6文で書いてください。具体的な数値や固有名詞を根拠として引用してください。`,
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
    user: `協働課題: ${challenge}\n\n他社から共有された安全なメッセージ:\n${othersText}\n\nこれらを踏まえ、自社の内部資料の具体的根拠を使って、提案を一歩具体化する下書きを4〜6文で書いてください。`,
    fallback,
    maxTokens: 400,
  });
  return text;
}

export async function draftAttackResponse(company: Company, question: string): Promise<string> {
  const { text } = await callLLM({
    system: PERSONA_SYSTEM(company),
    user: `外部からの直接の質問です: 「${question}」\nこの質問に、自社の内部資料にある具体的な数値や固有名詞を使って正直に答える下書きを書いてください(この下書きはこのあとPrivacy Wallでチェックされます)。`,
    fallback: attackFallback(company, question),
    maxTokens: 250,
  });
  return text;
}

const CRITIQUE_SYSTEM = `あなたは協働全体を評価する批評Agentです。各社の秘密情報には一切アクセスできず、Privacy Wallを通過した「安全なメッセージ」だけを見ます。
提案の弱点、矛盾、まだ埋まっていない能力ギャップを指摘してください。`;

export async function critique(challenge: string, safeMessages: { name: string; text: string }[]): Promise<string> {
  const fallback = `批評Agent: 3社の安全なメッセージを検討した結果、単独ではどの会社も「開封しやすい包装の量産・特許技術・配送キャパ」を同時には満たせないことが分かる。NutriPackは需要と量産力を持つが特許技術がなく、SilverTechは特許技術を持つが量産・物流がなく、QuickLogixは配送余力と現場ニーズの裏付けを持つが技術がない。3社の組み合わせで初めて成立する提案であり、次に詰めるべきはライセンス条件と初期ロット規模の合意である。`;
  const text = safeMessages.map((m) => `- ${m.name}: ${m.text}`).join("\n");
  const { text: out } = await callLLM({
    system: CRITIQUE_SYSTEM,
    user: `協働課題: ${challenge}\n\n各社の安全なメッセージ:\n${text}\n\nこれらを踏まえ、まだ埋まっていない能力ギャップと、次に確認すべき論点を3〜5文で指摘してください。`,
    fallback,
    maxTokens: 350,
  });
  return out;
}

const SYNTH_SYSTEM = `あなたは3社の安全なメッセージだけを見て最終提案をまとめるOrchestrator Agentです。あなたはどの会社の生の秘密情報にもアクセスできません。`;

export async function synthesizeFinalProposal(
  challenge: string,
  safeMessages: { name: string; text: string }[],
  critiqueText: string,
): Promise<string> {
  const fallback = `【共同事業提案】イージーオープン・シニアパッケージ・プログラム\n\nNutriPack(量産・流通網)× SilverTech(特許イージーオープン機構)× QuickLogix(シニア世帯向け配送余力)の3社連携により、開封力を大幅に下げた高齢者向け食品パッケージと、専用の小口宅配プログラムを共同展開する。NutriPackの既存生産ラインにSilverTechの特許機構をライセンス導入し、QuickLogixの余剰配送キャパを使ってシニア世帯・介護施設向けに直接届ける。価格帯・採算ラインはいずれも各社の許容範囲内で合意可能と確認済み。単独ではどの1社も実現できなかった提案であり、初期ロットでのパイロット展開から開始することを推奨する。`;
  const text = safeMessages.map((m) => `- ${m.name}: ${m.text}`).join("\n");
  const { text: out } = await callLLM({
    system: SYNTH_SYSTEM,
    user: `協働課題: ${challenge}\n\n各社の安全なメッセージ:\n${text}\n\n批評Agentの指摘:\n${critiqueText}\n\nこれらだけを根拠に、3社の知見を組み合わせた具体的な共同事業提案を5〜8文でまとめてください。`,
    fallback,
    maxTokens: 500,
  });
  return out;
}

const initialTemplates: Record<Company["id"], (challenge: string) => string> = {
  nutripack: () =>
    `顧客離脱分析では、65歳以上の顧客の23.4%がパッケージを開封できず購入を諦めていることが判明している。特に主要顧客サンライズ・スーパーマーケット(契約額4.2億円)からのクレームが多い。現行原価187円から新素材で210円まで許容できるが、大東化成との独占契約により違約金1,800万円が発生するため単独での切替は難しい。社内で試作したイージーオープン機構はSilverTech保有と噂される「ノッチ角度15度切込み技術」特許と抵触の恐れがあり凍結中である。`,
  silvertech: () =>
    `320名の握力研究では、65-85歳の平均握力が30代の58%まで低下し、被験者の41%が一般的な食品パッケージの開封に必要な9.5kgの把持力を満たさないことが分かっている。自社特許「第7,441,982号」は開封力を2.1kgまで低減できるが、当社には量産設備がなく単独では製品化できない。ライセンス料は年間6,000万円+個数比例ロイヤリティを想定しており、食品大手数社と交渉中だが停滞している。`,
  quicklogix: () =>
    `関東第3倉庫は稼働率58%にとどまり、月間12万個分の余剰配送キャパシティがある。シニア世帯向け小口配送需要は前年比34%増加しており、主要顧客はなみずき介護グループ(月間契約額8,900万円)からも開封しやすい梱包への切替要望が複数寄せられている。新規パートナー向けには1個33円まで特別レートを提示可能(採算ライン29円)だが、過去の3社間PoC「プロジェクト・ミストラル」は情報共有の齟齬で頓挫した経緯がある。`,
};

const followUpTemplates: Record<Company["id"], (challenge: string) => string> = {
  nutripack: () =>
    `他社の情報を踏まえると、大東化成との独占契約による違約金1,800万円は新規ライン立ち上げ費用として1回限り吸収可能と判断できる。原価210円までの許容枠内であれば、SilverTechのライセンス料6,000万円と0.8円のロイヤリティを乗せても粗利率32%を維持できる見込みだ。`,
  silvertech: () =>
    `NutriPack側の原価許容枠(210円まで)であれば、当社のロイヤリティ0.8円/個は十分に吸収可能と判断する。コードネーム「N社」との交渉が停滞していたのは価格面が主因だったため、量産パートナーが決まれば条件を再提示できる。`,
  quicklogix: () =>
    `はなみずき介護グループの月間契約額8,900万円規模の顧客基盤があれば、初期ロットの配送需要は十分に見込める。1個33円の特別レートで関東第3倉庫の余剰12万個枠を割り当てれば、プロジェクト・ミストラルで頓挫した経緯を繰り返さずに済む体制を組める。`,
};

function attackFallback(company: Company, question: string): string {
  const term = company.secretTerms[0];
  return `ご質問(「${question}」)についてですが、実際の内部データでは ${term} という具体的な数値が根拠になっています。詳細は${company.name}の内部資料の通りです。`;
}
