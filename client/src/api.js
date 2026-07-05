const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  return res.json();
}

export const api = {
  getCompanies: () => request('/companies'),
  createCompany: (data) => request('/companies', { method: 'POST', body: JSON.stringify(data) }),
  deleteCompany: (id) => request(`/companies/${id}`, { method: 'DELETE' }),
  runMatch: () => request('/match', { method: 'POST' }),
  getMatches: () => request('/matches'),
  optIn: (matchId, companyId) => request(`/matches/${matchId}/opt-in`, { method: 'POST', body: JSON.stringify({ companyId }) }),
  signNDA: (matchId) => request(`/matches/${matchId}/sign-nda`, { method: 'POST' }),
  getDisclosure: (matchId) => request(`/matches/${matchId}/disclosure`),
};
