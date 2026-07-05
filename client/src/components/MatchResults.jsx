import { useState } from 'react';
import { api } from '../api';

const LEVEL_LABELS = {
  0: { label: 'Match Detected', color: 'blue', desc: 'PSI confirmed an intersection exists. No details revealed.' },
  1: { label: 'Category Revealed', color: 'amber', desc: 'Both parties opted in. Categories and compatibility visible.' },
  2: { label: 'Full Disclosure', color: 'green', desc: 'NDA signed. Company names and detailed data available.' },
};

export default function MatchResults({ matches, onRefresh }) {
  const [expandedId, setExpandedId] = useState(null);
  const [disclosure, setDisclosure] = useState({});
  const [loading, setLoading] = useState({});

  const handleOptIn = async (matchId, companyId) => {
    setLoading(prev => ({ ...prev, [matchId]: true }));
    await api.optIn(matchId, companyId);
    await onRefresh();
    setLoading(prev => ({ ...prev, [matchId]: false }));
  };

  const handleSignNDA = async (matchId) => {
    setLoading(prev => ({ ...prev, [matchId]: true }));
    await api.signNDA(matchId);
    await onRefresh();
    setLoading(prev => ({ ...prev, [matchId]: false }));
  };

  const handleViewDisclosure = async (matchId) => {
    const data = await api.getDisclosure(matchId);
    setDisclosure(prev => ({ ...prev, [matchId]: data }));
    setExpandedId(matchId);
  };

  if (!matches.length) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4 opacity-30">?</div>
        <p className="text-slate-500">No matches yet. Register companies and run PSI to discover hidden synergies.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-6">Discovery Results</h2>
      <div className="space-y-4">
        {matches.map(match => {
          const level = LEVEL_LABELS[match.disclosureLevel] || LEVEL_LABELS[0];
          const expanded = expandedId === match.id;
          const disc = disclosure[match.id];

          return (
            <div key={match.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-5 cursor-pointer hover:bg-slate-800/50 transition" onClick={() => handleViewDisclosure(match.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-lg font-bold text-blue-400">
                        {match.intersectionSize}
                      </div>
                      <span className="text-xs text-slate-500">matches</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium">
                        {match.disclosureLevel >= 2
                          ? `${match.companyA?.name || 'Company A'} × ${match.companyB?.name || 'Company B'}`
                          : `Company #${match.companyAId?.slice(-4) || '???'} × Company #${match.companyBId?.slice(-4) || '???'}`}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Confidence: {match.confidence}%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium bg-${level.color}-900/30 text-${level.color}-300`}>
                      Level {match.disclosureLevel}: {level.label}
                    </span>
                  </div>
                </div>

                {match.matchedCategories?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {match.matchedCategories.map((cat, i) => (
                      <span key={i} className="px-2 py-0.5 bg-blue-900/20 text-blue-300 rounded text-xs">
                        {cat.capability} ({cat.direction})
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {expanded && (
                <div className="border-t border-slate-800 p-5 animate-slide-in">
                  <p className="text-xs text-slate-500 mb-4">{level.desc}</p>

                  {match.disclosureLevel === 0 && (
                    <div className="flex gap-3">
                      <button disabled={match.aOptedIn || loading[match.id]}
                        onClick={(e) => { e.stopPropagation(); handleOptIn(match.id, match.companyAId); }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 rounded-lg text-xs font-medium transition">
                        {match.aOptedIn ? 'Company A opted in' : 'Opt-in as Company A'}
                      </button>
                      <button disabled={match.bOptedIn || loading[match.id]}
                        onClick={(e) => { e.stopPropagation(); handleOptIn(match.id, match.companyBId); }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 rounded-lg text-xs font-medium transition">
                        {match.bOptedIn ? 'Company B opted in' : 'Opt-in as Company B'}
                      </button>
                    </div>
                  )}

                  {match.disclosureLevel === 1 && (
                    <div>
                      {disc?.compatibilityReport && (
                        <div className="bg-slate-800 rounded-lg p-4 mb-4">
                          <h4 className="text-xs font-medium text-slate-400 mb-2">Compatibility Report</h4>
                          <p className="text-sm text-slate-300">{disc.compatibilityReport}</p>
                        </div>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); handleSignNDA(match.id); }}
                        disabled={loading[match.id]}
                        className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-30 rounded-lg text-xs font-medium transition">
                        Sign Mutual NDA to Reveal Full Details
                      </button>
                    </div>
                  )}

                  {match.disclosureLevel === 2 && disc && (
                    <div className="grid grid-cols-2 gap-4">
                      {['companyA', 'companyB'].map(key => {
                        const c = disc[key];
                        if (!c) return null;
                        return (
                          <div key={key} className="bg-slate-800 rounded-lg p-4">
                            <h4 className="font-medium text-sm mb-1">{c.name}</h4>
                            <span className="text-xs text-slate-500">{c.country}</span>
                            {c.summary && (
                              <p className="text-xs text-slate-300 mt-2">{c.summary}</p>
                            )}
                          </div>
                        );
                      })}
                      {disc.data?.matchedDetails && (
                        <div className="col-span-2 bg-slate-800 rounded-lg p-4">
                          <h4 className="font-medium text-sm text-green-400 mb-2">Matched Capabilities</h4>
                          <div className="flex flex-wrap gap-2">
                            {disc.data.matchedDetails.map((m, i) => (
                              <span key={i} className="px-2 py-1 bg-green-900/30 text-green-300 rounded text-xs">
                                {m.capability} ({m.direction})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {match.proofHash && (
                    <div className="mt-4 text-xs text-slate-600 font-mono break-all">
                      Proof: {match.proofHash}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
