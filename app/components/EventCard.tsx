"use client";

import { TimelineEvent } from "@/lib/types";
import { CompanyMeta } from "./types";

function actorLabel(
  actor: string,
  companies: CompanyMeta[]
): { label: string; color: string } {
  const c = companies.find((x) => x.id === actor);
  if (c) return { label: c.nameJa, color: c.color };
  if (actor === "critique") return { label: "Critique Agent", color: "#7c3aed" };
  if (actor === "orchestrator")
    return { label: "Orchestrator", color: "#d97706" };
  return { label: "System", color: "#64748b" };
}

function ModeBadge({ mode }: { mode?: "local" | "remote" }) {
  if (!mode) return null;
  return (
    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-normal normal-case text-slate-500">
      {mode === "remote" ? "Remote" : "Local Sim"}
    </span>
  );
}

export function EventCard({
  ev,
  companies,
}: {
  ev: TimelineEvent;
  companies: CompanyMeta[];
}) {
  const { label, color } = actorLabel(ev.actor, companies);

  if (ev.type === "log") {
    return (
      <div className="event-enter flex items-center gap-2 pl-2 text-xs text-slate-400">
        <span className="text-slate-300">&#x26D3;</span>
        <span>{ev.title}</span>
        {ev.ledgerBlock && (
          <span className="font-mono text-slate-400">
            #{ev.ledgerBlock.index} hash:{ev.ledgerBlock.hash.slice(0, 10)}...
          </span>
        )}
      </div>
    );
  }

  if (ev.type === "serendipity") {
    return (
      <div className="event-enter rounded-xl border-2 border-amber-300 bg-amber-50 p-4 shadow-sm">
        <div className="mb-1 flex items-center gap-2 text-sm font-bold text-amber-700">
          <svg
            className="h-4 w-4 text-amber-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          {ev.title}
          {ev.serendipityScore != null && (
            <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
              Serendipity {Math.round(ev.serendipityScore * 100)}%
            </span>
          )}
        </div>
        <p className="text-sm leading-relaxed text-amber-800">{ev.detail}</p>
      </div>
    );
  }

  if (ev.type === "matching") {
    return (
      <div className="event-enter rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="mb-1 text-sm font-semibold text-blue-700">
          {ev.title}
        </div>
        <p className="text-sm leading-relaxed text-blue-600">{ev.detail}</p>
      </div>
    );
  }

  if (ev.type === "final") {
    return (
      <div className="event-enter rounded-xl border-2 border-blue-400 bg-gradient-to-br from-blue-50 to-white p-5 shadow-md">
        <div className="mb-2 text-sm font-bold tracking-wide text-blue-700">
          {ev.title}
        </div>
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-700">
          {ev.detail}
        </p>
      </div>
    );
  }

  if (ev.type === "critique") {
    return (
      <div className="event-enter rounded-xl border border-purple-200 bg-purple-50 p-4">
        <div className="mb-1 text-sm font-semibold text-purple-700">
          {ev.title}
        </div>
        <p className="text-sm leading-relaxed text-purple-600">{ev.detail}</p>
      </div>
    );
  }

  if (ev.type === "draft") {
    return (
      <div className="event-enter rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
        <div
          className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide"
          style={{ color }}
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: color }}
          />
          {label} - Internal Draft (Not Shared)
          <ModeBadge mode={ev.mode} />
        </div>
        {ev.draft ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-500">
            {ev.draft}
          </p>
        ) : (
          <p className="text-sm italic leading-relaxed text-slate-400">
            {ev.detail}
          </p>
        )}
      </div>
    );
  }

  if (ev.type === "wall_flag") {
    return (
      <div className="event-enter rounded-xl border border-red-200 bg-white p-3">
        <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-red-600">
          <span className="text-red-500">Warning</span> {ev.title}
          <ModeBadge mode={ev.mode} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ev.flagged
            ? ev.flagged.map((f, i) => (
                <span
                  key={i}
                  className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-mono text-red-600 ring-1 ring-red-200"
                >
                  {f.category}: {f.text}
                </span>
              ))
            : ev.flaggedSummary?.map((f, i) => (
                <span
                  key={i}
                  className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-mono text-red-600 ring-1 ring-red-200"
                >
                  {f.category} x{f.count}
                </span>
              ))}
        </div>
      </div>
    );
  }

  if (ev.type === "wall_block") {
    return (
      <div className="event-enter rounded-xl border-2 border-red-300 bg-red-50 p-4">
        <div className="mb-1 flex items-center gap-2 text-sm font-bold text-red-700">
          BLOCKED - {ev.title}
          <ModeBadge mode={ev.mode} />
        </div>
        <p className="text-sm text-red-600">{ev.detail}</p>
      </div>
    );
  }

  // wall_redact / safe_message
  return (
    <div className="event-enter rounded-xl border border-emerald-200 bg-white p-4">
      <div
        className="mb-1 flex items-center gap-2 text-xs font-semibold"
        style={{ color }}
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: color }}
        />
        {label} -{" "}
        {ev.type === "wall_redact"
          ? "Abstracted to Safe Form"
          : "No Sensitive Content"}
        <ModeBadge mode={ev.mode} />
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
        {ev.safeMessage}
      </p>
    </div>
  );
}
