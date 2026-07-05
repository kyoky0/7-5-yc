import { useState, useEffect } from 'react';
import { api } from './api';
import CompanyPanel from './components/CompanyPanel';
import MatchResults from './components/MatchResults';
import PSIAnimation from './components/PSIAnimation';

const FLAG = { Japan: '\u{1F1EF}\u{1F1F5}', Kazakhstan: '\u{1F1F0}\u{1F1FF}', China: '\u{1F1E8}\u{1F1F3}' };

export default function App() {
  const [companies, setCompanies] = useState([]);
  const [matches, setMatches] = useState([]);
  const [running, setRunning] = useState(false);
  const [psiSteps, setPsiSteps] = useState(null);
  const [view, setView] = useState('companies');

  const refresh = async () => {
    const c = await api.getCompanies();
    setCompanies(c);
    const m = await api.getMatches();
    setMatches(m);
  };

  useEffect(() => { refresh(); }, []);

  const handleRunPSI = async () => {
    setRunning(true);
    setPsiSteps([]);
    setView('psi');
    const result = await api.runMatch();
    if (result.results) {
      const steps = result.results.flatMap(r => (r.psiSteps || []).map(s => ({ ...s, pair: `${r.companyA?.name} × ${r.companyB?.name}` })));
      setPsiSteps(steps);
    }
    await refresh();
    setTimeout(() => {
      setRunning(false);
      setView('results');
    }, 2000);
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="text-blue-400">Agora</span>
              <span className="text-slate-500 text-base ml-3 font-normal">Company Brain with Secret Handshake</span>
            </h1>
          </div>
          <nav className="flex gap-2">
            {['companies', 'results'].map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${view === v ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                {v === 'companies' ? 'Company Brains' : 'Match Results'}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {view === 'companies' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Registered Company Brains</h2>
              <button onClick={handleRunPSI} disabled={running || companies.length < 2}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 rounded-lg font-semibold text-sm transition">
                {running ? 'Running PSI Protocol...' : 'Run Private Set Intersection'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {companies.map(c => (
                <CompanyPanel key={c.id} company={c} flag={FLAG[c.country] || ''} onDelete={async () => { await api.deleteCompany(c.id); refresh(); }} />
              ))}
              <CompanyPanel isNew onCreated={refresh} />
            </div>
          </>
        )}

        {view === 'psi' && <PSIAnimation steps={psiSteps} companies={companies} flags={FLAG} />}

        {view === 'results' && <MatchResults matches={matches} onRefresh={refresh} />}
      </main>

      <footer className="border-t border-slate-800 px-6 py-4 mt-12">
        <p className="text-center text-slate-600 text-xs">
          Data never leaves your machine. Discoveries cross borders. Built for Compiled AI Hackathon #3.
        </p>
      </footer>
    </div>
  );
}
