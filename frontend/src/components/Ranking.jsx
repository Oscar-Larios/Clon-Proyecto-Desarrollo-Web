import { useState } from 'react';
import { useApp } from '../hooks/useApp';

function calculateRanking(players, brackets) {
  const ranking = new Map();
  players.forEach(player => {
    ranking.set(player.id, {
      player,
      played: 0, wins: 0, losses: 0,
      pointsFor: 0, pointsAgainst: 0,
      byes: 0, championships: 0
    });
  });

  brackets.forEach(bracket => {
    if (bracket.championId && ranking.has(bracket.championId)) {
      ranking.get(bracket.championId).championships += 1;
    }
    bracket.rounds.flatMap(r => r.matches).forEach(match => {
      if (match.status !== 'Finalizado' || !match.winnerId) return;
      if (match.bye) {
        const winner = ranking.get(match.winnerId);
        if (winner) winner.byes += 1;
        return;
      }
      const p1 = ranking.get(match.player1Id);
      const p2 = ranking.get(match.player2Id);
      if (!p1 || !p2) return;
      p1.played++; p2.played++;
      p1.pointsFor += match.player1Score || 0;
      p1.pointsAgainst += match.player2Score || 0;
      p2.pointsFor += match.player2Score || 0;
      p2.pointsAgainst += match.player1Score || 0;
      if (match.winnerId === match.player1Id) { p1.wins++; p2.losses++; }
      else { p2.wins++; p1.losses++; }
    });
  });

  return [...ranking.values()].map(entry => ({
    ...entry,
    difference: entry.pointsFor - entry.pointsAgainst,
    rankingPoints: entry.wins * 3 + entry.losses + entry.championships * 5 + entry.byes
  })).sort((a, b) =>
    b.rankingPoints - a.rankingPoints ||
    b.wins - a.wins ||
    b.difference - a.difference ||
    a.losses - b.losses ||
    a.player.name.localeCompare(b.player.name)
  );
}

export default function Ranking() {
  const { tournaments, players, brackets } = useApp();
  const [filter, setFilter] = useState('all');

  const ranking = calculateRanking(players, brackets)
    .filter(entry => filter === 'all' || entry.player.tournamentId === filter);

  const getTournamentName = (id) => tournaments.find(t => t.id === id)?.name || 'Sin torneo';

  return (
    <section id="ranking" className="mb-5">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Desempeño</p>
          <h2>Ranking</h2>
        </div>
      </div>
      <div className="card shadow-sm">
        <div className="card-body">
          <div className="row g-3 mb-3">
            <div className="col-md-5">
              <label className="form-label">Filtrar por torneo</label>
              <select className="form-select" value={filter} onChange={e => setFilter(e.target.value)}>
                <option value="all">Todos los torneos</option>
                {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>#</th><th>Jugador</th><th>Torneo</th><th>Sexo / Nivel</th>
                  <th>PJ</th><th>PG</th><th>PP</th><th>PF</th><th>PC</th><th>Dif.</th><th>Puntos</th>
                </tr>
              </thead>
              <tbody>
                {ranking.length === 0
                  ? <tr><td colSpan="11" className="text-center text-muted py-4">No hay datos de ranking.</td></tr>
                  : ranking.map((entry, i) => (
                    <tr key={entry.player.id}>
                      <td className="fw-bold">{i + 1}</td>
                      <td>{entry.player.name}</td>
                      <td>{getTournamentName(entry.player.tournamentId)}</td>
                      <td>
                        <span className="badge badge-gender">{entry.player.gender}</span>{' '}
                        <span className="badge badge-level">{entry.player.level}</span>
                      </td>
                      <td>{entry.played}</td>
                      <td>{entry.wins}</td>
                      <td>{entry.losses}</td>
                      <td>{entry.pointsFor}</td>
                      <td>{entry.pointsAgainst}</td>
                      <td>{entry.difference}</td>
                      <td><strong>{entry.rankingPoints}</strong></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
