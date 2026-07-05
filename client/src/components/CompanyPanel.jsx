import { useState } from 'react';
import { api } from '../api';

const COUNTRIES = ['Japan', 'Kazakhstan', 'China'];

const PLACEHOLDER = `Example: Our company specializes in nano-coating technology for automotive parts. We have proprietary processes for thermal barrier coatings that operate at 800-1200°C. We're looking for partners with mineral processing capabilities, especially rare earth elements for coating precursors.`;

export default function CompanyPanel({ company, flag, isNew, onCreated, onDelete }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [country, setCountry] = useState('Japan');
  const [rawInput, setRawInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (isNew) {
    return (
      <>
        <button onClick={() => setOpen(true)}
          className="border-2 border-dashed border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center gap-3 hover:border-blue-500 transition min-h-[200px] cursor-pointer">
          <span className="text-3xl text-slate-600">+</span>
          <span className="text-slate-500 text-sm">Register Company Brain</span>
        </button>

        {open && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-lg animate-slide-in">
              <h3 className="text-lg font-semibold mb-4">Register Company Brain</h3>

              <label className="block text-sm text-slate-400 mb-1">Company Name</label>
              <input value={name} onChange={e => setName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 mb-4 text-sm focus:outline-none focus:border-blue-500" />

              <label className="block text-sm text-slate-400 mb-1">Country</label>
              <select value={country} onChange={e => setCountry(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 mb-4 text-sm focus:outline-none focus:border-blue-500">
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <label className="block text-sm text-slate-400 mb-1">Company Knowledge (trade secrets, capabilities, needs)</label>
              <textarea value={rawInput} onChange={e => setRawInput(e.target.value)}
                placeholder={PLACEHOLDER} rows={6}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 mb-4 text-sm focus:outline-none focus:border-blue-500 resize-none" />

              <div className="flex gap-3 justify-end">
                <button onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
                <button disabled={!name || !rawInput || loading}
                  onClick={async () => {
                    setLoading(true);
                    await api.createCompany({ name, country, rawInput });
                    setLoading(false);
                    setOpen(false);
                    setName(''); setCountry('Japan'); setRawInput('');
                    onCreated?.();
                  }}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 rounded-lg text-sm font-medium transition">
                  {loading ? 'Extracting with Local LLM...' : 'Register'}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  const extracted = company.extracted || null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{flag}</span>
          <h3 className="font-semibold text-sm">{company.name}</h3>
        </div>
        <button onClick={onDelete} className="text-slate-600 hover:text-red-400 text-xs transition">remove</button>
      </div>

      <span className="inline-block text-xs px-2 py-0.5 bg-slate-800 rounded text-slate-400 mb-3">{company.country}</span>

      {extracted && (
        <div className="space-y-2 text-xs">
          {extracted.capabilities?.length > 0 && (
            <div>
              <span className="text-green-400 font-medium">Capabilities</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {extracted.capabilities.map((c, i) => (
                  <span key={i} className="px-2 py-0.5 bg-green-900/30 text-green-300 rounded">{c}</span>
                ))}
              </div>
            </div>
          )}
          {extracted.needs?.length > 0 && (
            <div>
              <span className="text-amber-400 font-medium">Needs</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {extracted.needs.map((n, i) => (
                  <span key={i} className="px-2 py-0.5 bg-amber-900/30 text-amber-300 rounded">{n}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {company.encrypted && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-600">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
          Encrypted & ready for PSI
        </div>
      )}
    </div>
  );
}
