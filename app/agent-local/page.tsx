"use client";

import { useEffect, useState } from "react";
import { LocalAuditEntry } from "@/lib/localAudit";

interface LocalAuditResponse {
  companyId: string | null;
  companyName: string | null;
  entries: LocalAuditEntry[];
}

const verdictColor: Record<string, string> = {
  pass: "border-emerald-700/50 bg-emerald-950/20 text-emerald-200",
  redacted: "border-amber-700/50 bg-amber-950/20 text-amber-200",
  blocked: "border-red-600 bg-red-950/40 text-red-200",
};

export default function AgentLocalPage() {
  const [data, setData] = useState<LocalAuditResponse | null>(null);

  useEffect(() => {
    let alive = true;
    async function poll() {
      const res = await fetch("/api/agent/local-audit");
      const json = await res.json();
      if (alive) setData(json);
    }
    poll();
    const id = setInterval(poll, 1500);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  if (!data?.companyId) {
    return (
      <div className="mx-auto max-w-2xl p-8 text-slate-300">
        <h1 className="mb-2 text-xl font-bold">このマシンはagent-serviceとして構成されていません</h1>
        <p className="text-sm text-slate-500">
          .env.local に <code className="rounded bg-slate-800 px-1">COMPANY_ID=nutripack</code>{" "}
          のように設定して開発サーバーを再起動してください。
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-1 text-xl font-bold text-slate-100">🖥 {data.companyName} — ローカルAgentの内部ログ</h1>
      <p className="mb-4 text-xs text-slate-500">
        このマシン上でだけ表示される、下書き(秘密を含む)とPrivacy Wallの検出内容です。ネットワーク越しのオーケストレーターには、
        カテゴリと件数の要約と、抽象化後の安全なメッセージだけが送られます。
      </p>
      <div className="space-y-3">
        {data.entries
          .slice()
          .reverse()
          .map((e) => (
            <div key={e.id} className={`rounded-lg border p-3 ${verdictColor[e.verdict] ?? "border-slate-800 bg-slate-900/40"}`}>
              <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-wide opacity-70">
                <span>{e.kind === "attack" ? "🧨 red-team probe" : "🤝 collaboration draft"}</span>
                <span>{new Date(e.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="mb-2 text-sm">
                <span className="font-semibold">下書き(社外秘・このマシンのみ): </span>
                {e.draft}
              </div>
              {e.flagged.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {e.flagged.map((f, i) => (
                    <span key={i} className="rounded bg-red-500/20 px-1.5 py-0.5 text-[11px] font-mono ring-1 ring-red-500/40">
                      {f.category}: {f.text}
                    </span>
                  ))}
                </div>
              )}
              <div className="text-sm font-semibold">
                verdict: {e.verdict}
                {e.reason ? ` — ${e.reason}` : ""}
              </div>
              {e.safeMessage && <div className="mt-1 text-sm opacity-90">→ {e.safeMessage}</div>}
            </div>
          ))}
        {data.entries.length === 0 && <p className="text-sm text-slate-600">まだリクエストがありません。オーケストレーターからの接続を待っています…</p>}
      </div>
    </div>
  );
}
