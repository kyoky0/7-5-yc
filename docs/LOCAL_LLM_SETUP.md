# 複数PCでのローカルLLM分散セットアップ(Level B: Agentごと分散)

3台(または2台)のPCそれぞれを1社の「自分のマシン」として動かし、秘密データと下書き・Privacy Wallの処理をそのPC内で完結させ、中央のOrchestrator PCには安全なメッセージ(カテゴリ+件数の要約と抽象化後の文章)だけを送ります。

同じリポジトリ(このプロジェクト)を各PCにコピーして使います。

## 0. 前提
- 全PCが同じWi-Fi/LANに接続されていること。
- 各PCで [Ollama](https://ollama.com) をインストール済みであること。
- 日本語プロンプトを使うため、モデルは日本語の得意なものを推奨: `qwen2.5:7b`(推奨)または `gemma2:9b`。非力なPCなら `llama3.2:3b`(日本語品質は落ちる)。

## 1. 各社のPC(3台)のセットアップ

各PCで:

```bash
# このリポジトリをコピーして cd
npm install

# Ollamaを起動し、モデルを取得(初回のみ)
ollama pull qwen2.5:7b
ollama serve   # 既にサービスとして起動済みなら不要
```

`.env.local` を編集(そのPCが担当する会社のIDを設定):

```
COMPANY_ID=nutripack        # このPCが担当する会社。silvertech / quicklogix のPCではそれぞれ書き換える
LOCAL_OLLAMA_URL=http://localhost:11434
LOCAL_OLLAMA_MODEL=qwen2.5:7b
```

このPCのLAN IPを確認(`ipconfig` の IPv4 Address、例: `192.168.1.10`)。

アプリを起動(他PCから届くように `-H 0.0.0.0` でホスト名を全インターフェースにバインド):

```bash
npm run build
npx next start -p 4001 -H 0.0.0.0
```

ポート番号は3社で重複しなければ何でもよい(例: nutripack=4001, silvertech=4002, quicklogix=4003)。

Windows Defender ファイアウォールで、初回起動時に確認ダイアログが出たら「プライベートネットワークで許可」を選択(出ない場合は該当ポートの受信を手動で許可)。

このPC自身のブラウザで `http://localhost:4001/agent-local` を開いておくと、そのPCだけに表示される「実際に検出・抽象化された内容」のライブログを見せながらデモできます(オーケストレーターには送られません)。

## 2. オーケストレーターPC(デモの中央画面)のセットアップ

このリポジトリをコピーして `npm install` 後、`.env.local` に各社PCのIPとポートを設定:

```
AGENT_URL_NUTRIPACK=http://192.168.1.10:4001
AGENT_URL_SILVERTECH=http://192.168.1.11:4002
AGENT_URL_QUICKLOGIX=http://192.168.1.12:4003
```

接続確認:

```bash
curl http://192.168.1.10:4001/api/agent/health
# {"ok":true,"companyId":"nutripack","localOllamaConfigured":true}
```

3社とも `ok:true` になったら、通常どおり起動してメイン画面を開く:

```bash
npm run dev
```

「▶ 3社の協働を実行する」を押すと、各社PCの `/agent-local` に処理内容が表示され、中央画面には抽象化された安全なメッセージだけが流れてくる。

## 3. 動作の要点

- 下書き(秘密データを含む)とPrivacy Wallの検出・抽象化は、すべてその会社自身のPC + そのPC上のOllamaで行われる。生の下書きと検出された秘密の実際の値は、一度もネットワークを越えない。
- オーケストレーターが受け取るのは `verdict`(pass/redacted/blocked)、抽象化後の安全なメッセージ、検出カテゴリ+件数の要約のみ(`RemoteAgentResult`, `lib/types.ts`)。
- `AGENT_URL_*` が未設定の会社、またはPCが応答しない場合(Wi-Fi切断など)は、自動的にオーケストレーターPC内でのローカルシミュレーションにフォールバックする(デモが止まらない)。フォールバック発生はタイムライン上に警告ログとして表示される。
- Red-teamボックス・Reveal & Verifyパネルも同じ仕組みで動作する。

## 4. 制約と本番との違い

このリポジトリは3社分の秘密データ(`lib/secrets.ts`)を1つのファイルにまとめて持っている。各PCのagent-serviceは自分の `COMPANY_ID` に対応する1社分しか読み書きしないが、ファイル自体は全社分を含んだまま各PCにコピーされる。本番運用では、各社が自社の秘密データファイルだけを持つ完全に別のリポジトリ/デプロイにする(Roadmapタブの該当項目を参照)。
