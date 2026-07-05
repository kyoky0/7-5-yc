"use client";

import { NDADocument } from "@/lib/types";

interface NDAModalProps {
  nda: NDADocument;
  onSign: () => void;
  onClose: () => void;
  signed: boolean;
}

export function NDAModal({ nda, onSign, onClose, signed }: NDAModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Non-Disclosure Agreement
            </h2>
            <p className="text-sm text-slate-500">
              ID: {nda.id} | Effective: {nda.effectiveDate}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Party A
            </div>
            <div className="text-sm font-semibold text-slate-700">
              {nda.partyA.description}
            </div>
            <div className="text-[11px] text-slate-500">
              Jurisdiction: {nda.partyA.jurisdiction}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Party B
            </div>
            <div className="text-sm font-semibold text-slate-700">
              {nda.partyB.description}
            </div>
            <div className="text-[11px] text-slate-500">
              Jurisdiction: {nda.partyB.jurisdiction}
            </div>
          </div>
        </div>

        <div className="mb-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
              <div className="text-[10px] font-semibold uppercase text-slate-400">
                Scope
              </div>
              <div className="text-[11px] text-slate-600">{nda.scope}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
              <div className="text-[10px] font-semibold uppercase text-slate-400">
                Duration
              </div>
              <div className="text-[11px] text-slate-600">{nda.duration}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
              <div className="text-[10px] font-semibold uppercase text-slate-400">
                Governing Law
              </div>
              <div className="text-[11px] text-slate-600">
                {nda.governingLaw}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
              <div className="text-[10px] font-semibold uppercase text-slate-400">
                Arbitration
              </div>
              <div className="text-[11px] text-slate-600">
                {nda.arbitration}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Full Text
          </div>
          <div className="max-h-60 overflow-y-auto whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-slate-600">
            {nda.fullText}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
          {signed ? (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              NDA Signed Successfully
            </div>
          ) : (
            <>
              <button
                onClick={onClose}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={onSign}
                className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
              >
                Sign NDA
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
