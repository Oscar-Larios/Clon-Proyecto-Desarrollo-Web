import { useState, useRef } from 'react';
import { useApp } from '../hooks/useApp';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function formatDate(val) {
  if (!val) return 'Sin fecha';
  const [y, m, d] = val.split('-');
  return `${d}/${m}/${y}`;
}

function PlayerRow({ playerId, score, winnerId, players }) {
  const player = players.find(p => p.id === playerId);
  const name = player ? player.name : 'BYE / Pendiente';
  const isWinner = playerId && playerId === winnerId;
  return (
    <div className={`player-row ${isWinner ? 'winner' : ''}`}>
      <span>{name}</span>
      <span className="score-pill">{score ?? '-'}</span>
    </div>
  );
}

function MatchCard({ bracket, match, players, onEdit }) {
  const canEdit = match.player1Id && match.player2Id;
  return (
    <div className={`match-card ${match.status === 'Finalizado' ? 'finished' : ''} ${!canEdit ? 'pending-next' : ''}`}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span className="small fw-bold text-muted">Partido {match.position}</span>
        <span className={`badge text-bg-${match.status === 'Finalizado' ? 'success' : 'warning'}`}>
          {match.bye ? 'BYE' : match.status}
        </span>
      </div>
      <PlayerRow playerId={match.player1Id} score={match.player1Score} winnerId={match.winnerId} players={players} />
      <PlayerRow playerId={match.player2Id} score={match.player2Score} winnerId={match.winnerId} players={players} />
      {canEdit
        ? <button className="btn btn-sm btn-outline-success w-100 mt-3" onClick={() => onEdit(bracket, match)}>Editar resultado</button>
        : <div className="small text-muted mt-3">Esperando rival...</div>}
    </div>
  );
}

function ScoreModal({ bracket, match, players, onClose, onSave }) {
  const p1 = players.find(p => p.id === match.player1Id);
  const p2 = players.find(p => p.id === match.player2Id);
  const [s1, setS1] = useState(match.player1Score ?? '');
  const [s2, setS2] = useState(match.player2Score ?? '');
  const { showToast } = useApp();

  async function handleSubmit(e) {
    e.preventDefault();
    if (Number(s1) === Number(s2)) { showToast('El resultado no puede quedar empatado.', 'danger'); return; }
    await onSave(bracket.id, match.id, { player1Score: Number(s1), player2Score: Number(s2) });
    onClose();
  }

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <form className="modal-content" onSubmit={handleSubmit}>
          <div className="modal-header">
            <h2 className="modal-title fs-5">Editar resultado</h2>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">{p1?.name || 'Jugador 1'}</label>
              <input type="number" min="0" className="form-control" required value={s1}
                onChange={e => setS1(e.target.value)} />
            </div>
            <div className="mb-3">
              <label className="form-label">{p2?.name || 'Jugador 2'}</label>
              <input type="number" min="0" className="form-control" required value={s2}
                onChange={e => setS2(e.target.value)} />
            </div>
            <div className="alert alert-info mb-0">
              El ganador se calcula con el puntaje más alto y avanza automáticamente a la siguiente ronda.
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-success">Guardar resultado</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Brackets() {
  const { tournaments, players, brackets, generateBrackets, updateScore, showToast } = useApp();
  const [selectedTournamentId, setSelectedTournamentId] = useState('');
  const [scoreTarget, setScoreTarget] = useState(null); // { bracket, match }
  const exportRef = useRef(null);

  const tournament = tournaments.find(t => t.id === selectedTournamentId);
  const tournamentBrackets = brackets.filter(b => b.tournamentId === selectedTournamentId);
  const tournamentPlayers = players.filter(p => p.tournamentId === selectedTournamentId);

  async function handleGenerate() {
    if (!selectedTournamentId) { showToast('Primero crea y selecciona un torneo.', 'warning'); return; }
    if (tournamentPlayers.length < 2) { showToast('Necesitas al menos dos jugadores en el torneo.', 'warning'); return; }
    if (tournamentBrackets.length > 0 && !confirm('Esto reemplazará los brackets y resultados existentes. ¿Continuar?')) return;
    try { await generateBrackets(selectedTournamentId); } catch (err) { showToast(err.message, 'danger'); }
  }

  async function handleExportPdf() {
    if (!tournament) { showToast('Selecciona un torneo para exportar.', 'warning'); return; }
    const area = exportRef.current;
    const { default: JsPDF } = await import('jspdf');
    const canvas = await html2canvas(area, { scale: 2, backgroundColor: '#ffffff' });
    const image = canvas.toDataURL('image/png');
    const pdf = new JsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 10;
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.setFontSize(16);
    pdf.text(`Torneo: ${tournament.name}`, margin, 12);
    pdf.setFontSize(10);
    pdf.text(`Lugar: ${tournament.place} | Fecha: ${formatDate(tournament.date)} | Estado: ${tournament.status}`, margin, 18);
    pdf.addImage(image, 'PNG', margin, 24, imgWidth, imgHeight);
    pdf.save(`${tournament.name.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.pdf`);
    showToast('PDF generado correctamente.');
  }

  async function handleScoreSave(bracketId, matchId, scores) {
    try { await updateScore(bracketId, matchId, scores); }
    catch (err) { showToast(err.message, 'danger'); }
  }

  return (
    <section id="brackets" className="mb-5">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Competencia</p>
          <h2>Brackets y resultados</h2>
        </div>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-lg-5">
              <label className="form-label">Torneo</label>
              <select className="form-select" value={selectedTournamentId}
                onChange={e => setSelectedTournamentId(e.target.value)}>
                <option value="">Selecciona un torneo</option>
                {tournaments.map(t => <option key={t.id} value={t.id}>{t.name} — {formatDate(t.date)}</option>)}
              </select>
            </div>
            <div className="col-lg-7 d-flex flex-wrap gap-2">
              <button className="btn btn-success" onClick={handleGenerate}>Generar / regenerar bracket</button>
              <button className="btn btn-outline-primary" onClick={handleExportPdf}>Exportar PDF</button>
              <button className="btn btn-outline-secondary" onClick={() => window.print()}>Imprimir</button>
            </div>
          </div>
        </div>
      </div>

      <div ref={exportRef}>
        {tournament && (
          <div className="card shadow-sm mb-3">
            <div className="card-body d-flex flex-wrap justify-content-between gap-3">
              <div>
                <h3 className="h4 mb-1">{tournament.name}</h3>
                <div className="text-muted">{tournament.place} · {formatDate(tournament.date)} · {tournament.status}</div>
                <div>{tournament.description}</div>
              </div>
              <div className="text-lg-end">
                <span className="badge text-bg-success fs-6">{tournamentPlayers.length} jugadores</span>
              </div>
            </div>
          </div>
        )}

        {!tournament ? (
          <div className="empty-state">Crea un torneo para generar brackets.</div>
        ) : tournamentBrackets.length === 0 ? (
          <div className="empty-state">
            <h3 className="h5">Aún no hay brackets generados</h3>
            <p className="mb-0">Presiona "Generar / regenerar bracket" para crear los emparejamientos por sexo y nivel.</p>
          </div>
        ) : (
          tournamentBrackets.map(bracket => (
            <article key={bracket.id} className="bracket-group">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <div>
                  <h3 className="h4 mb-1">{bracket.groupKey}</h3>
                  <div className="text-muted">
                    Campeón: <strong>
                      {bracket.championId
                        ? (players.find(p => p.id === bracket.championId)?.name || 'Desconocido')
                        : 'Por definirse'}
                    </strong>
                  </div>
                </div>
                <span className="badge text-bg-primary">{bracket.rounds.length} rondas</span>
              </div>
              <div className="bracket-scroll">
                <div className="bracket-board">
                  {bracket.rounds.map(round => (
                    <div key={round.roundNumber} className="round-column">
                      <h4 className="h6 fw-bold text-center mb-3">{round.name}</h4>
                      {round.matches.map(match => (
                        <MatchCard key={match.id} bracket={bracket} match={match} players={players}
                          onEdit={(b, m) => setScoreTarget({ bracket: b, match: m })} />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {scoreTarget && (
        <ScoreModal
          bracket={scoreTarget.bracket}
          match={scoreTarget.match}
          players={players}
          onClose={() => setScoreTarget(null)}
          onSave={handleScoreSave}
        />
      )}
    </section>
  );
}
