// Set VITE_API_URL in your .env or GitHub Actions secrets
// e.g. VITE_API_URL=https://tennis-api.onrender.com
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || 'Error desconocido');
  }
  return res.json();
}

export const api = {
  // Tournaments
  getTournaments: () => request('/api/tournaments'),
  createTournament: (data) => request('/api/tournaments', { method: 'POST', body: JSON.stringify(data) }),
  updateTournament: (id, data) => request(`/api/tournaments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTournament: (id) => request(`/api/tournaments/${id}`, { method: 'DELETE' }),

  // Players
  getPlayers: (tournamentId) => request(`/api/players${tournamentId ? `?tournamentId=${tournamentId}` : ''}`),
  createPlayer: (data) => request('/api/players', { method: 'POST', body: JSON.stringify(data) }),
  updatePlayer: (id, data) => request(`/api/players/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePlayer: (id) => request(`/api/players/${id}`, { method: 'DELETE' }),

  // Brackets
  getBrackets: (tournamentId) => request(`/api/brackets${tournamentId ? `?tournamentId=${tournamentId}` : ''}`),
  generateBrackets: (tournamentId) => request('/api/brackets/generate', { method: 'POST', body: JSON.stringify({ tournamentId }) }),
  updateScore: (bracketId, matchId, scores) =>
    request(`/api/brackets/${bracketId}/matches/${matchId}/score`, { method: 'PUT', body: JSON.stringify(scores) }),
};
