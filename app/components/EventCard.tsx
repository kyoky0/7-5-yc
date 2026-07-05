"use client";

import { TimelineEvent } from "@/lib/types";
import { CompanyMeta } from "./types";

function actorLabel(actor: string, companies: CompanyMeta[]): { label: string; color: string } {
  const c = companies.find((x) => x.id === actor);
  if (c) return { label: c.nameJa, color: c.color };
  if (actor === "critique") return { label: "批評Agent", color: "#a855f7" };
  if (actor === "orchestrator") return { label: "Orchestrator", color: "#eab308" };
  return { label: "System", color: "#64748b" };
}

function ModeBadge({ mode }: { mode?: "local" | "remote" }) {
  if (!mode) return null;
  return (
    <span className="rounded bg-slate-800/80 px-1.5 py-0.5 text-[10px] font-normal normal-case text-slate-400">
      {mode === "remote" ? "🖥 会社自身のマシン" : "💻 ローカルシミュレーション"}
    </span>
  );
}

export function EventCard({ ev, companies }: { ev: TimelineEvent; companies: CompanyMeta[] }) {
  const { label, color } = actorLabel(ev.actor, companies);

  if (ev.type === "log") {
    return (
      <div className="event-enter flex items-center gap-2 pl-2 text-xs text-slate-500">
        <span>⛓</span>
        <span>{ev.title}</span>
        {ev.ledgerBlock && (
          <span className="font-mono text-slate-600">
            #{ev.ledgerBlock.index} hash:{ev.ledgerBlock.hash.slice(0, 10)}…
          </span>
        )}
      </div>
    );
  }

  if (ev.type === "matching") {
    return (
      <div className="event-enter rounded-lg border border-sky-800/60 bg-sky-950/30 p-4">
        <div className="mb-1 text-sm font-semibold text-sky-300">🔗 {ev.title}</div>
        <p className="text-sm leading-relaxed text-sky-100/80">{ev.detail}</p>
      </div>
    );
  }

  if (ev.type === "final") {
    return (
      <div className="event-enter rounded-xl border-2 border-amber-500/60 bg-linear-to-br from-amber-950/40 to-amber-900/10 p-5 shadow-lg shadow-amber-900/20">
        <div className="mb-2 text-sm font-bold tracking-wide text-amber-300">🏆 {ev.title}</div>
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-amber-50">{ev.detail}</p>
      </div>
    );
  }

  if (ev.type === "critique") {
    return (
      <div className="event-enter rounded-lg border border-purple-700/60 bg-purple-950/30 p-4">
        <div className="mb-1 text-sm font-semibold text-purple-300">🔍 {ev.title}</div>
        <p className="text-sm leading-relaxed text-purple-100/80">{ev.detail}</p>
      </div>
    );
  }

  if (ev.type === "draft") {
    return (
      <div className="event-enter rounded-lg border border-dashed border-slate-700 bg-slate-900/40 p-4">
        <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide" style={{ color }}>
          <span className="h-2 w-2 rounded-full" style={{ background: color }} />
          {label} · 🔒 内部下書き(社外未公開)
          <ModeBadge mode={ev.mode} />
        </div>
        {ev.draft ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-400">{ev.draft}</p>
        ) : (
          <p className="text-sm italic leading-relaxed text-slate-500">{ev.detail}</p>
        )}
      </div>
    );
  }

  if (ev.type === "wall_flag") {
    return (
      <div className="event-enter rounded-lg border border-red-800/60 bg-red-950/20 p-3">
        <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-red-300">
          ⚠️ {ev.title}
          <ModeBadge mode={ev.mode} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ev.flagged
            ? ev.flagged.map((f, i) => (
                <span key={i} className="rounded bg-red-500/20 px-1.5 py-0.5 text-[11px] font-mono text-red-300 ring-1 ring-red-500/40">
                  {f.category}: {f.text}
                </span>
              ))
            : ev.flaggedSummary?.map((f, i) => (
                <span key={i} className="rounded bg-red-500/20 px-1.5 py-0.5 text-[11px] font-mono text-red-300 ring-1 ring-red-500/40">
                  {f.category} x{f.count}
                </span>
              ))}
        </div>
      </div>
    );
  }

  if (ev.type === "wall_block") {
    return (
      <div className="event-enter rounded-lg border-2 border-red-600 bg-red-950/50 p-4">
        <div className="mb-1 flex items-center gap-2 text-sm font-bold text-red-300">
          🚫 {ev.title}
          <ModeBadge mode={ev.mode} />
        </div>
        <p className="text-sm text-red-200/90">{ev.detail}</p>
      </div>
    );
  }

  // wall_redact / safe_message
  return (
    <div className="event-enter rounded-lg border border-emerald-700/50 bg-emerald-950/20 p-4">
      <div className="mb-1 flex items-center gap-2 text-xs font-semibold" style={{ color }}>
        <span className="h-2 w-2 rounded-full" style={{ background: color }} />
        {label} · {ev.type === "wall_redact" ? "🛡 抽象化して安全な形に変換" : "✅ 機密要素なし"}
        <ModeBadge mode={ev.mode} />
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-emerald-100/90">{ev.safeMessage}</p>
    </div>
  );
}
