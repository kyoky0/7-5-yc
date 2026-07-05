import { Company } from "./types";

/**
 * These dossiers simulate each company's confidential internal documents.
 * They are imported ONLY by lib/agents.ts (per-company agent context) and
 * lib/commitReveal.ts (for the commit-reveal proof). The orchestrator and
 * the client never import this module directly.
 */
export const COMPANIES: Company[] = [
  {
    id: "nutripack",
    name: "NutriPack",
    nameJa: "ニュートリパック",
    role: "食品包装メーカー",
    color: "#f97316",
    secretDossier: `[NutriPack 内部機密メモ — 社外秘]
顧客離脱分析(2026 Q1, 社内調査 n=4,200):
- 65歳以上の顧客の23.4%が「パッケージを開封できず購入を諦めた」と回答。
- 特に主要顧客であるサンライズ・スーパーマーケット(契約額 年間 4.2億円)からクレームが急増。
- 現行パッケージの原価は1個あたり187円(樹脂フィルム調達先: 大東化成、単価は非公開契約条件)。
- 新パッケージ材料への切替は原価を1個あたり210円まで許容可能(粗利率32%を維持できる上限)。
- 大東化成との独占供給契約により、他社製法の採用には違約金1,800万円が発生。
- 社内R&Dでイージーオープン機構を試作したが、特許出願済みの「ノッチ角度15度切込み技術」(SilverTech社が保有と噂)と抵触する可能性があり凍結中。
`,
    secretTerms: [
      "23.4%",
      "187円",
      "210円",
      "サンライズ・スーパーマーケット",
      "大東化成",
      "4.2億円",
      "1,800万円",
      "ノッチ角度15度切込み技術",
    ],
    capabilityTags: [
      "high volume food packaging manufacturing",
      "unmet accessibility demand among senior consumers",
      "cost-sensitive margin constraints on materials",
      "existing retail distribution contracts",
    ],
  },
  {
    id: "silvertech",
    name: "SilverTech",
    nameJa: "シルバーテック",
    role: "高齢者向けアクセシビリティ研究",
    color: "#22c55e",
    secretDossier: `[SilverTech 内部機密メモ — 社外秘]
握力・巧緻性研究データ(2025年度, 被験者320名, 65-85歳):
- 平均握力は男性で28.6kg、女性で17.2kgまで低下(30代平均の58%)。
- 現行の一般的な食品パッケージ開封には最低9.5kgの把持力とひねりトルクが必要 → 被験者の41%が基準を満たさない。
- 自社特許 第7,441,982号「ノッチ角度15度切込み技術」(2024年出願、開封力を2.1kgまで低減)を保有。
- ライセンス供与モデルの想定価格: 導入企業1社あたり年間ライセンス料 6,000万円 + 個数比例ロイヤリティ1個0.8円。
- 主要交渉先候補として食品業界大手3社と接触中だが、うち1社(コードネーム「N社」)とは価格面で交渉停滞中。
- 自社には量産設備・製造ラインが無く、単独では製品化不可能。
`,
    secretTerms: [
      "28.6kg",
      "17.2kg",
      "9.5kg",
      "41%",
      "第7,441,982号",
      "ノッチ角度15度切込み技術",
      "6,000万円",
      "0.8円",
      "コードネーム「N社」",
    ],
    capabilityTags: [
      "patented easy-open grip mechanism for low hand strength users",
      "unmet accessibility demand among senior consumers",
      "no manufacturing or distribution capability of its own",
      "licensing-based revenue model",
    ],
  },
  {
    id: "quicklogix",
    name: "QuickLogix",
    nameJa: "クイックロジックス",
    role: "物流・フルフィルメント",
    color: "#3b82f6",
    secretDossier: `[QuickLogix 内部機密メモ — 社外秘]
拠点別キャパシティ稼働率(2026年5月時点):
- 関東第3倉庫の稼働率は58%にとどまり、月間 120,000個分の余剰配送キャパシティが存在。
- 高齢者向け宅配needs(自社調査による顧客ヒアリング)で、シニア世帯向け小口配送の需要が前年比34%増加。
- 主要顧客である介護施設チェーン「はなみずき介護グループ」(月間契約額 8,900万円)から、開封しやすい梱包への切替要望が複数件寄せられている。
- 現行の配送単価は1個あたり42円(繁忙期は58円)。新規パートナー向け特別レートとして1個33円まで提示可能(採算ライン29円)。
- 過去に類似の3社間PoC(A社×B社×自社)を試みたが、情報共有の齟齬により頓挫した失敗事例あり(社内では「プロジェクト・ミストラル」と呼称)。
`,
    secretTerms: [
      "58%",
      "120,000個",
      "34%",
      "はなみずき介護グループ",
      "8,900万円",
      "42円",
      "58円",
      "33円",
      "29円",
      "プロジェクト・ミストラル",
    ],
    capabilityTags: [
      "unused fulfillment and distribution capacity",
      "unmet accessibility demand among senior consumers",
      "senior-focused delivery logistics experience",
      "cost-sensitive margin constraints on shipping",
    ],
  },
];

export function getCompany(id: string): Company | undefined {
  return COMPANIES.find((c) => c.id === id);
}
