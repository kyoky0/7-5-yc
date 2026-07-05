"use client";

const ROWS: { today: string; production: string; why: string }[] = [
  {
    today: "SimHash + ランダム超平面LSHによる能力マッチング(ローカル計算・ビット列のみ共有)",
    production: "OPRF(Oblivious PRF)ベースのPrivate Set Intersection / PSI Cardinality",
    why: "秘密の集合そのものを中央に渡さずに交差集合の有無・件数だけを計算できる、暗号学的に証明された安全性を持たせるため",
  },
  {
    today: "regexパターン検出 + LLMによる抽象化の2段検証、fail-closedでブロック",
    production: "TEE(Trusted Execution Environment) + Remote Attestation",
    why: "Privacy Wallの実行コードとメモリ自体を、プラットフォーム運営者を含め誰も覗けない隔離環境で動かし、実行証明を第三者が検証できるようにするため",
  },
  {
    today: "会社ごとの固定specificity budget(カウンタ)による繰り返し質問対策",
    production: "形式的なDifferential Privacyのノイズ付与とプライバシー予算(ε)管理",
    why: "「少しずつ質問を変えて秘密を再構成する」攻撃に対して、数学的に上界が証明された情報漏洩量の保証を与えるため",
  },
  {
    today: "SHA-256によるコミット&リビール(事後開示で一致を確認)",
    production: "zkML / ZKP — 秘密を開示せずに『正しく導出された』ことを証明",
    why: "デモを超えた本番運用では、秘密を一切開示せずに正当性を証明する必要があるため(Revealは開示を伴う簡易版)",
  },
  {
    today: "実装済み: 各社が自分のPC上でagent-service(自社の秘密データ+Agent+ローカルLLM+Privacy Wall)を実行し、Orchestratorには安全なメッセージとカテゴリ/件数の要約だけがネットワーク越しに届く(docs/LOCAL_LLM_SETUP.md)。未設定/未接続時は自動でローカルシミュレーションにフォールバック",
    production: "各社独自のインフラ(VPC/オンプレ)でホスティングされた常設サービス+相互認証(mTLS)+TEEによる実行証明",
    why: "デモではPCの物理的分離だけで『Orchestratorが秘密を見ない』を実現しているが、本番では通信経路の暗号化・相互認証・実行環境自体の証明まで必要になるため",
  },
  {
    today: "プロセス内メモリのハッシュチェーン監査ログ(SHA-256連結)",
    production: "Merkle Treeでのバッチ化 + オンチェーンへのルートハッシュ定期アンカリング",
    why: "監査ログの改ざん耐性を、単一サーバへの信頼ではなく公開台帳による第三者検証可能性にまで高めるため",
  },
  {
    today: "3社固定シナリオ、単一セッション内の協働",
    production: "Federated Learning的に多数企業のAgentを常時接続し、新しい課題が来るたびに関連しそうな企業だけを自動でマッチングして招集",
    why: "『どの企業の組み合わせが有望か』を人手で決めず、継続的に発見できるCompany Brainネットワークにするため",
  },
];

export function Roadmap() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-5">
        <h2 className="mb-2 text-lg font-bold text-slate-100">本番アーキテクチャへの拡張ロードマップ</h2>
        <p className="mb-4 text-sm text-slate-400">
          このプロトタイプは5時間のハッカソン向けに意図的に単純化しています。以下は「今回実装した簡易版」と「本番で置き換えるべき技術」の対応表です。
        </p>
        <div className="space-y-3">
          {ROWS.map((r, i) => (
            <div key={i} className="rounded border border-slate-800 bg-slate-900/40 p-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">今回実装(Today)</div>
                  <div className="text-sm text-slate-300">{r.today}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-indigo-400">本番構想(Production)</div>
                  <div className="text-sm text-indigo-200">{r.production}</div>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                <span className="font-semibold text-slate-400">Why: </span>
                {r.why}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
