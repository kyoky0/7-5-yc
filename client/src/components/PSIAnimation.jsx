import { useState, useEffect } from 'react';

export default function PSIAnimation({ steps, companies, flags }) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (!steps?.length) return;
    const interval = setInterval(() => {
      setVisibleCount(prev => {
        if (prev >= steps.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 400);
    return () => clearInterval(interval);
  }, [steps]);

  if (!steps) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative w-20 h-20 mb-6">
          <div className="absolute inset-0 border-2 border-blue-500 rounded-full animate-ping opacity-20" />
          <div className="absolute inset-2 border-2 border-blue-400 rounded-full animate-ping opacity-30" style={{ animationDelay: '0.5s' }} />
          <div className="absolute inset-4 border-2 border-blue-300 rounded-full animate-ping opacity-40" style={{ animationDelay: '1s' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        </div>
        <p className="text-blue-400 font-medium">Initiating Private Set Intersection Protocol...</p>
        <p className="text-slate-600 text-xs mt-2">Data stays encrypted. Only intersections are revealed.</p>
      </div>
    );
  }

  const grouped = {};
  steps.forEach(s => {
    if (!grouped[s.pair]) grouped[s.pair] = [];
    grouped[s.pair].push(s);
  });

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h2 className="text-lg font-semibold mb-6 text-center">PSI Protocol Execution</h2>

      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-800" />

        {Object.entries(grouped).map(([pair, pairSteps]) => (
          <div key={pair} className="mb-8">
            <div className="flex items-center gap-3 mb-3 pl-10">
              <span className="text-sm font-medium text-blue-400">{pair}</span>
            </div>
            {pairSteps.map((step, i) => {
              const globalIdx = steps.indexOf(step);
              const visible = globalIdx < visibleCount;
              if (!visible) return null;

              const isMatch = step.step === 3 && step.intersectionSize > 0;
              return (
                <div key={i} className="flex items-start gap-4 mb-2 animate-slide-in">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isMatch ? 'bg-green-600 glow-green' : 'bg-slate-800'}`}>
                    {isMatch
                      ? <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                      : <span className="text-xs text-slate-500">{i + 1}</span>}
                  </div>
                  <div className={`flex-1 px-4 py-2 rounded-lg text-xs ${isMatch ? 'bg-green-900/20 text-green-300 border border-green-800' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}>
                    <span className="font-medium">Step {step.step}</span>
                    {step.description && <span className="ml-2 text-slate-500">— {step.description}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {visibleCount >= steps.length && (
        <div className="text-center mt-8 animate-slide-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-900/20 border border-green-800 rounded-full text-green-300 text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Protocol complete. Zero-knowledge proofs generated.
          </div>
        </div>
      )}
    </div>
  );
}
