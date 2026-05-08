const STORAGE_KEYS = {
  tournaments: 'tennis_tournaments',
  players: 'tennis_players',
  brackets: 'tennis_brackets',
  theme: 'tennis_theme'
};

const state = {
  tournaments: loadData(STORAGE_KEYS.tournaments),
  players: loadData(STORAGE_KEYS.players),
  brackets: loadData(STORAGE_KEYS.brackets),
  theme: localStorage.getItem(STORAGE_KEYS.theme) || 'light',
  scoreModal: null
};

const LEVELS = ['Principiante', 'Intermedio', 'Avanzado'];
const GENDERS = ['Femenino', 'Masculino'];

function loadData(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    console.warn(`No se pudo leer ${key}`, error);
    return [];
  }
}

function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function persistAll() {
  saveData(STORAGE_KEYS.tournaments, state.tournaments);
  saveData(STORAGE_KEYS.players, state.players);
  saveData(STORAGE_KEYS.brackets, state.brackets);
}

function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeText(value) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function byId(id) {
  return document.getElementById(id);
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatDate(dateValue) {
  if (!dateValue) return 'Sin fecha';
  const [year, month, day] = dateValue.split('-');
  return `${day}/${month}/${year}`;
}

function getTournament(id) {
  return state.tournaments.find((tournament) => tournament.id === id);
}

function getPlayer(id) {
  return state.players.find((player) => player.id === id);
}

function getPlayerName(id) {
  return getPlayer(id)?.name || 'Pendiente';
}

function showToast(message, variant = 'success') {
  const toastEl = byId('appToast');
  toastEl.className = `toast align-items-center text-bg-${variant} border-0`;
  byId('toastMessage').textContent = message;
  bootstrap.Toast.getOrCreateInstance(toastEl).show();
}


function applyTheme(theme) {
  const nextTheme = theme === 'dark' ? 'dark' : 'light';
  const isDark = nextTheme === 'dark';
  document.documentElement.setAttribute('data-bs-theme', nextTheme);
  byId('themeToggleBtn').setAttribute('aria-label', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
  byId('themeToggleBtn').setAttribute('aria-pressed', String(isDark));
  byId('themeToggleIcon').textContent = isDark ? '☀️' : '🌙';
  byId('themeToggleText').textContent = isDark ? 'Modo claro' : 'Modo oscuro';
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem(STORAGE_KEYS.theme, state.theme);
  applyTheme(state.theme);
  showToast(`Modo ${state.theme === 'dark' ? 'oscuro' : 'claro'} activado.`);
}

function initializeApp() {
  applyTheme(state.theme);
  state.scoreModal = new bootstrap.Modal(byId('scoreModal'));
  bindEvents();
  renderAll();
}

function bindEvents() {
  byId('tournamentForm').addEventListener('submit', handleTournamentSubmit);
  byId('cancelTournamentEditBtn').addEventListener('click', resetTournamentForm);
  byId('playerForm').addEventListener('submit', handlePlayerSubmit);
  byId('cancelPlayerEditBtn').addEventListener('click', resetPlayerForm);
  byId('playersFilterTournament').addEventListener('change', renderPlayersTable);
  byId('bracketTournament').addEventListener('change', renderBracketsSection);
  byId('rankingTournament').addEventListener('change', renderRanking);
  byId('generateBracketBtn').addEventListener('click', handleGenerateBrackets);
  byId('scoreForm').addEventListener('submit', handleScoreSubmit);
  byId('exportPdfBtn').addEventListener('click', exportTournamentPdf);
  byId('printBtn').addEventListener('click', () => window.print());
  byId('resetDemoBtn').addEventListener('click', resetAllData);
  byId('themeToggleBtn').addEventListener('click', toggleTheme);
}

function renderAll() {
  renderTournamentOptions();
  renderStats();
  renderTournamentsTable();
  renderPlayersTable();
  renderBracketsSection();
  renderRanking();
}

function renderStats() {
  const active = state.tournaments.filter((tournament) => tournament.status === 'En curso').length;
  const finished = state.tournaments.filter((tournament) => tournament.status === 'Finalizado').length;
  const matches = state.brackets.flatMap((bracket) => bracket.rounds.flatMap((round) => round.matches));
  const finishedMatches = matches.filter((match) => match.status === 'Finalizado').length;

  const stats = [
    { label: 'Torneos', value: state.tournaments.length, icon: '🏆' },
    { label: 'Jugadores', value: state.players.length, icon: '👟' },
    { label: 'Torneos en curso', value: active, icon: '🎾' },
    { label: 'Partidos finalizados', value: finishedMatches, icon: '✅' },
    { label: 'Torneos finalizados', value: finished, icon: '🏁' }
  ];

  byId('statsCards').innerHTML = stats.map((item) => `
    <div class="col-sm-6 col-xl">
      <div class="card stat-card shadow-sm h-100">
        <div class="card-body">
          <div class="fs-2">${item.icon}</div>
          <div class="stat-value">${item.value}</div>
          <div class="text-muted fw-semibold">${item.label}</div>
        </div>
      </div>
    </div>
  `).join('');
}

function handleTournamentSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return;
  }

  const id = byId('tournamentId').value;
  const tournamentData = {
    name: byId('tournamentName').value.trim(),
    place: byId('tournamentPlace').value.trim(),
    date: byId('tournamentDate').value,
    status: byId('tournamentStatus').value,
    description: byId('tournamentDescription').value.trim()
  };

  const duplicate = state.tournaments.some((tournament) =>
    tournament.id !== id &&
    normalizeText(tournament.name) === normalizeText(tournamentData.name) &&
    tournament.date === tournamentData.date
  );

  if (duplicate) {
    showToast('Ya existe un torneo con el mismo nombre y fecha.', 'danger');
    return;
  }

  if (id) {
    const index = state.tournaments.findIndex((tournament) => tournament.id === id);
    state.tournaments[index] = { ...state.tournaments[index], ...tournamentData, updatedAt: new Date().toISOString() };
    showToast('Torneo actualizado correctamente.');
  } else {
    state.tournaments.push({
      id: generateId('tournament'),
      ...tournamentData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    showToast('Torneo creado correctamente.');
  }

  persistAll();
  resetTournamentForm();
  renderAll();
}

function resetTournamentForm() {
  byId('tournamentForm').reset();
  byId('tournamentForm').classList.remove('was-validated');
  byId('tournamentId').value = '';
  byId('tournamentStatus').value = 'Pendiente';
  byId('tournamentFormTitle').textContent = 'Nuevo torneo';
}

function editTournament(id) {
  const tournament = getTournament(id);
  if (!tournament) return;
  byId('tournamentId').value = tournament.id;
  byId('tournamentName').value = tournament.name;
  byId('tournamentPlace').value = tournament.place;
  byId('tournamentDate').value = tournament.date;
  byId('tournamentStatus').value = tournament.status;
  byId('tournamentDescription').value = tournament.description || '';
  byId('tournamentFormTitle').textContent = 'Editar torneo';
  location.hash = '#torneos';
}

function deleteTournament(id) {
  const tournament = getTournament(id);
  if (!tournament) return;
  if (!confirm(`¿Eliminar el torneo "${tournament.name}"? También se eliminarán sus jugadores y brackets.`)) return;
  state.tournaments = state.tournaments.filter((item) => item.id !== id);
  state.players = state.players.filter((player) => player.tournamentId !== id);
  state.brackets = state.brackets.filter((bracket) => bracket.tournamentId !== id);
  persistAll();
  showToast('Torneo eliminado correctamente.');
  renderAll();
}

function renderTournamentsTable() {
  byId('tournamentCountBadge').textContent = `${state.tournaments.length} torneos`;
  const rows = state.tournaments.map((tournament) => {
    const playerCount = state.players.filter((player) => player.tournamentId === tournament.id).length;
    return `
      <tr>
        <td><strong>${escapeHtml(tournament.name)}</strong><div class="small text-muted">${escapeHtml(tournament.description || 'Sin descripción')}</div></td>
        <td>${escapeHtml(tournament.place)}</td>
        <td>${formatDate(tournament.date)}</td>
        <td><span class="badge text-bg-${statusColor(tournament.status)}">${tournament.status}</span></td>
        <td>${playerCount}</td>
        <td class="text-end">
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary" onclick="editTournament('${tournament.id}')">Editar</button>
            <button class="btn btn-outline-danger" onclick="deleteTournament('${tournament.id}')">Eliminar</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
  byId('tournamentsTable').innerHTML = rows || '<tr><td colspan="6" class="text-center text-muted py-4">Aún no hay torneos registrados.</td></tr>';
}

function statusColor(status) {
  if (status === 'En curso') return 'success';
  if (status === 'Finalizado') return 'secondary';
  return 'warning';
}

function renderTournamentOptions() {
  const options = state.tournaments.map((tournament) => `<option value="${tournament.id}">${escapeHtml(tournament.name)} - ${formatDate(tournament.date)}</option>`).join('');
  const empty = '<option value="">Sin torneos disponibles</option>';
  const all = '<option value="all">Todos los torneos</option>';

  byId('playerTournament').innerHTML = options || empty;
  byId('bracketTournament').innerHTML = options || empty;
  byId('playersFilterTournament').innerHTML = `${all}${options}`;
  byId('rankingTournament').innerHTML = `${all}${options}`;
}

function handlePlayerSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.checkValidity() || !byId('playerTournament').value) {
    form.classList.add('was-validated');
    return;
  }

  const id = byId('playerId').value;
  const playerData = {
    name: byId('playerName').value.trim(),
    tournamentId: byId('playerTournament').value,
    gender: byId('playerGender').value,
    level: byId('playerLevel').value
  };

  const duplicate = state.players.some((player) =>
    player.id !== id &&
    player.tournamentId === playerData.tournamentId &&
    normalizeText(player.name) === normalizeText(playerData.name)
  );

  if (duplicate) {
    showToast('Ya existe un jugador con ese nombre en el torneo seleccionado.', 'danger');
    return;
  }

  if (id) {
    const previous = getPlayer(id);
    const index = state.players.findIndex((player) => player.id === id);
    state.players[index] = { ...state.players[index], ...playerData, updatedAt: new Date().toISOString() };
    if (previous.tournamentId !== playerData.tournamentId || previous.gender !== playerData.gender || previous.level !== playerData.level) {
      removePlayerFromBrackets(id);
    }
    showToast('Jugador actualizado correctamente.');
  } else {
    state.players.push({
      id: generateId('player'),
      ...playerData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    showToast('Jugador registrado correctamente.');
  }

  persistAll();
  resetPlayerForm();
  renderAll();
}

function resetPlayerForm() {
  byId('playerForm').reset();
  byId('playerForm').classList.remove('was-validated');
  byId('playerId').value = '';
  byId('playerFormTitle').textContent = 'Nuevo jugador';
  renderTournamentOptions();
}

function editPlayer(id) {
  const player = getPlayer(id);
  if (!player) return;
  byId('playerId').value = player.id;
  byId('playerName').value = player.name;
  byId('playerTournament').value = player.tournamentId;
  byId('playerGender').value = player.gender;
  byId('playerLevel').value = player.level;
  byId('playerFormTitle').textContent = 'Editar jugador';
  location.hash = '#jugadores';
}

function deletePlayer(id) {
  const player = getPlayer(id);
  if (!player) return;
  if (!confirm(`¿Eliminar al jugador "${player.name}"? Si está en un bracket, se limpiará su posición.`)) return;
  state.players = state.players.filter((item) => item.id !== id);
  removePlayerFromBrackets(id);
  persistAll();
  showToast('Jugador eliminado correctamente.');
  renderAll();
}

function removePlayerFromBrackets(playerId) {
  state.brackets.forEach((bracket) => {
    bracket.rounds.forEach((round) => {
      round.matches.forEach((match) => {
        if (match.player1Id === playerId) match.player1Id = null;
        if (match.player2Id === playerId) match.player2Id = null;
        if (match.winnerId === playerId) match.winnerId = null;
        match.status = match.winnerId ? match.status : 'Pendiente';
      });
    });
  });
}

function renderPlayersTable() {
  const filter = byId('playersFilterTournament').value || 'all';
  const players = state.players.filter((player) => filter === 'all' || player.tournamentId === filter);
  const rows = players.map((player) => `
    <tr>
      <td><strong>${escapeHtml(player.name)}</strong></td>
      <td>${escapeHtml(getTournament(player.tournamentId)?.name || 'Sin torneo')}</td>
      <td><span class="badge badge-gender">${player.gender}</span></td>
      <td><span class="badge badge-level">${player.level}</span></td>
      <td class="text-end">
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-primary" onclick="editPlayer('${player.id}')">Editar</button>
          <button class="btn btn-outline-danger" onclick="deletePlayer('${player.id}')">Eliminar</button>
        </div>
      </td>
    </tr>
  `).join('');
  byId('playersTable').innerHTML = rows || '<tr><td colspan="5" class="text-center text-muted py-4">No hay jugadores para mostrar.</td></tr>';
}

function handleGenerateBrackets() {
  const tournamentId = byId('bracketTournament').value;
  if (!tournamentId) {
    showToast('Primero crea y selecciona un torneo.', 'warning');
    return;
  }

  const tournamentPlayers = state.players.filter((player) => player.tournamentId === tournamentId);
  if (tournamentPlayers.length < 2) {
    showToast('Necesitas al menos dos jugadores en el torneo.', 'warning');
    return;
  }

  if (state.brackets.some((bracket) => bracket.tournamentId === tournamentId) && !confirm('Esto reemplazará los brackets y resultados existentes de este torneo. ¿Continuar?')) {
    return;
  }

  state.brackets = state.brackets.filter((bracket) => bracket.tournamentId !== tournamentId);
  const grouped = groupPlayers(tournamentPlayers);
  Object.entries(grouped).forEach(([groupKey, players]) => {
    if (players.length >= 2) {
      state.brackets.push(createBracket(tournamentId, groupKey, players));
    }
  });

  persistAll();
  showToast('Brackets generados correctamente.');
  renderAll();
}

function groupPlayers(players) {
  return players.reduce((groups, player) => {
    const key = `${player.gender} - ${player.level}`;
    groups[key] = groups[key] || [];
    groups[key].push(player);
    return groups;
  }, {});
}

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function nextPowerOfTwo(number) {
  return 2 ** Math.ceil(Math.log2(number));
}

function createBracket(tournamentId, groupKey, players) {
  const shuffled = shuffle(players);
  const size = nextPowerOfTwo(shuffled.length);
  const slots = [...shuffled.map((player) => player.id), ...Array(size - shuffled.length).fill(null)];
  const totalRounds = Math.log2(size);
  const rounds = [];

  for (let roundNumber = 1; roundNumber <= totalRounds; roundNumber += 1) {
    const matchCount = size / 2 ** roundNumber;
    rounds.push({
      roundNumber,
      name: getRoundName(roundNumber, totalRounds),
      matches: Array.from({ length: matchCount }, (_, index) => ({
        id: generateId('match'),
        roundNumber,
        position: index + 1,
        player1Id: roundNumber === 1 ? slots[index * 2] : null,
        player2Id: roundNumber === 1 ? slots[index * 2 + 1] : null,
        player1Score: null,
        player2Score: null,
        winnerId: null,
        status: 'Pendiente',
        bye: false
      }))
    });
  }

  const bracket = {
    id: generateId('bracket'),
    tournamentId,
    groupKey,
    rounds,
    championId: null,
    createdAt: new Date().toISOString()
  };

  linkMatches(bracket);
  resolveAutomaticByes(bracket);
  return bracket;
}

function getRoundName(roundNumber, totalRounds) {
  if (roundNumber === totalRounds) return 'Final';
  if (roundNumber === totalRounds - 1) return 'Semifinal';
  if (roundNumber === totalRounds - 2) return 'Cuartos';
  return `Ronda ${roundNumber}`;
}

function linkMatches(bracket) {
  bracket.rounds.forEach((round, roundIndex) => {
    const nextRound = bracket.rounds[roundIndex + 1];
    round.matches.forEach((match, index) => {
      const nextMatch = nextRound?.matches[Math.floor(index / 2)];
      match.nextMatchId = nextMatch?.id || null;
      match.nextSlot = index % 2 === 0 ? 'player1Id' : 'player2Id';
    });
  });
}

function resolveAutomaticByes(bracket) {
  let changed = true;
  while (changed) {
    changed = false;
    bracket.rounds.forEach((round) => {
      round.matches.forEach((match) => {
        if (match.status === 'Finalizado') return;
        const hasOne = Boolean(match.player1Id) !== Boolean(match.player2Id);
        if (hasOne) {
          const winnerId = match.player1Id || match.player2Id;
          match.winnerId = winnerId;
          match.status = 'Finalizado';
          match.bye = true;
          match.player1Score = match.player1Id ? 1 : 0;
          match.player2Score = match.player2Id ? 1 : 0;
          advanceWinner(bracket, match, winnerId);
          changed = true;
        }
      });
    });
  }
}

function advanceWinner(bracket, match, winnerId) {
  if (!match.nextMatchId) {
    bracket.championId = winnerId;
    return;
  }
  const nextMatch = findMatch(bracket, match.nextMatchId);
  if (!nextMatch) return;
  nextMatch[match.nextSlot] = winnerId;
}

function findMatch(bracket, matchId) {
  return bracket.rounds.flatMap((round) => round.matches).find((match) => match.id === matchId);
}

function renderBracketsSection() {
  const tournamentId = byId('bracketTournament').value;
  const tournament = getTournament(tournamentId);
  if (!tournament) {
    byId('selectedTournamentSummary').innerHTML = '';
    byId('bracketsContainer').innerHTML = '<div class="empty-state">Crea un torneo para generar brackets.</div>';
    return;
  }

  const tournamentPlayers = state.players.filter((player) => player.tournamentId === tournamentId);
  byId('selectedTournamentSummary').innerHTML = `
    <div class="card shadow-sm">
      <div class="card-body d-flex flex-wrap justify-content-between gap-3">
        <div>
          <h3 class="h4 mb-1">${escapeHtml(tournament.name)}</h3>
          <div class="text-muted">${escapeHtml(tournament.place)} · ${formatDate(tournament.date)} · ${tournament.status}</div>
          <div>${escapeHtml(tournament.description || '')}</div>
        </div>
        <div class="text-lg-end">
          <span class="badge text-bg-success fs-6">${tournamentPlayers.length} jugadores</span>
        </div>
      </div>
    </div>
  `;

  const brackets = state.brackets.filter((bracket) => bracket.tournamentId === tournamentId);
  if (!brackets.length) {
    const grouped = groupPlayers(tournamentPlayers);
    const unavailableGroups = Object.entries(grouped).filter(([, players]) => players.length < 2);
    byId('bracketsContainer').innerHTML = `
      <div class="empty-state">
        <h3 class="h5">Aún no hay brackets generados</h3>
        <p class="mb-2">Presiona “Generar / regenerar bracket” para crear los emparejamientos por sexo y nivel.</p>
        ${unavailableGroups.length ? `<p class="small mb-0">Grupos con menos de dos jugadores: ${unavailableGroups.map(([key]) => escapeHtml(key)).join(', ')}</p>` : ''}
      </div>
    `;
    return;
  }

  byId('bracketsContainer').innerHTML = brackets.map(renderBracket).join('');
}

function renderBracket(bracket) {
  return `
    <article class="bracket-group">
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h3 class="h4 mb-1">${escapeHtml(bracket.groupKey)}</h3>
          <div class="text-muted">Campeón: <strong>${bracket.championId ? escapeHtml(getPlayerName(bracket.championId)) : 'Por definirse'}</strong></div>
        </div>
        <span class="badge text-bg-primary">${bracket.rounds.length} rondas</span>
      </div>
      <div class="bracket-scroll">
        <div class="bracket-board">
          ${bracket.rounds.map((round) => `
            <div class="round-column">
              <h4 class="h6 fw-bold text-center mb-3">${round.name}</h4>
              ${round.matches.map((match) => renderMatch(bracket, match)).join('')}
            </div>
          `).join('')}
        </div>
      </div>
    </article>
  `;
}

function renderMatch(bracket, match) {
  const canEdit = match.player1Id && match.player2Id;
  const pendingClass = !canEdit ? 'pending-next' : '';
  return `
    <div class="match-card ${match.status === 'Finalizado' ? 'finished' : ''} ${pendingClass}">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <span class="small fw-bold text-muted">Partido ${match.position}</span>
        <span class="badge text-bg-${match.status === 'Finalizado' ? 'success' : 'warning'}">${match.bye ? 'BYE' : match.status}</span>
      </div>
      ${renderPlayerRow(match.player1Id, match.player1Score, match.winnerId)}
      ${renderPlayerRow(match.player2Id, match.player2Score, match.winnerId)}
      ${canEdit ? `<button class="btn btn-sm btn-outline-success w-100 mt-3" onclick="openScoreModal('${bracket.id}', '${match.id}')">Editar resultado</button>` : '<div class="small text-muted mt-3">Esperando rival...</div>'}
    </div>
  `;
}

function renderPlayerRow(playerId, score, winnerId) {
  const isWinner = playerId && playerId === winnerId;
  return `
    <div class="player-row ${isWinner ? 'winner' : ''}">
      <span>${playerId ? escapeHtml(getPlayerName(playerId)) : 'BYE / Pendiente'}</span>
      <span class="score-pill">${score ?? '-'}</span>
    </div>
  `;
}

function openScoreModal(bracketId, matchId) {
  const bracket = state.brackets.find((item) => item.id === bracketId);
  const match = bracket ? findMatch(bracket, matchId) : null;
  if (!match || !match.player1Id || !match.player2Id) return;

  byId('scoreBracketId').value = bracketId;
  byId('scoreMatchId').value = matchId;
  byId('scorePlayer1Label').textContent = getPlayerName(match.player1Id);
  byId('scorePlayer2Label').textContent = getPlayerName(match.player2Id);
  byId('scorePlayer1').value = match.player1Score ?? '';
  byId('scorePlayer2').value = match.player2Score ?? '';
  state.scoreModal.show();
}

function handleScoreSubmit(event) {
  event.preventDefault();
  const bracket = state.brackets.find((item) => item.id === byId('scoreBracketId').value);
  const match = bracket ? findMatch(bracket, byId('scoreMatchId').value) : null;
  if (!match) return;

  const player1Score = Number(byId('scorePlayer1').value);
  const player2Score = Number(byId('scorePlayer2').value);
  if (player1Score === player2Score) {
    showToast('El resultado no puede quedar empatado.', 'danger');
    return;
  }

  clearDownstream(bracket, match);
  match.player1Score = player1Score;
  match.player2Score = player2Score;
  match.winnerId = player1Score > player2Score ? match.player1Id : match.player2Id;
  match.status = 'Finalizado';
  match.bye = false;
  advanceWinner(bracket, match, match.winnerId);
  resolveAutomaticByes(bracket);
  persistAll();
  state.scoreModal.hide();
  showToast('Resultado guardado y ganador avanzado.');
  renderAll();
}

function clearDownstream(bracket, match) {
  let currentMatch = match;
  let previousWinnerId = match.winnerId;

  while (currentMatch.nextMatchId) {
    const nextMatch = findMatch(bracket, currentMatch.nextMatchId);
    if (!nextMatch) break;

    if (previousWinnerId && nextMatch[currentMatch.nextSlot] === previousWinnerId) {
      nextMatch[currentMatch.nextSlot] = null;
    }

    previousWinnerId = nextMatch.winnerId;
    nextMatch.player1Score = null;
    nextMatch.player2Score = null;
    nextMatch.winnerId = null;
    nextMatch.status = 'Pendiente';
    nextMatch.bye = false;
    currentMatch = nextMatch;
  }

  bracket.championId = null;
}

function calculateRanking() {
  const ranking = new Map();
  state.players.forEach((player) => {
    ranking.set(player.id, {
      player,
      played: 0,
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      byes: 0,
      championships: 0,
      rankingPoints: 0
    });
  });

  state.brackets.forEach((bracket) => {
    if (bracket.championId && ranking.has(bracket.championId)) {
      ranking.get(bracket.championId).championships += 1;
    }
    bracket.rounds.flatMap((round) => round.matches).forEach((match) => {
      if (match.status !== 'Finalizado' || !match.winnerId) return;
      if (match.bye) {
        const winner = ranking.get(match.winnerId);
        if (winner) winner.byes += 1;
        return;
      }
      const player1 = ranking.get(match.player1Id);
      const player2 = ranking.get(match.player2Id);
      if (!player1 || !player2) return;
      player1.played += 1;
      player2.played += 1;
      player1.pointsFor += match.player1Score || 0;
      player1.pointsAgainst += match.player2Score || 0;
      player2.pointsFor += match.player2Score || 0;
      player2.pointsAgainst += match.player1Score || 0;
      if (match.winnerId === match.player1Id) {
        player1.wins += 1;
        player2.losses += 1;
      } else {
        player2.wins += 1;
        player1.losses += 1;
      }
    });
  });

  return [...ranking.values()].map((entry) => ({
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

function renderRanking() {
  const filter = byId('rankingTournament').value || 'all';
  const ranking = calculateRanking().filter((entry) => filter === 'all' || entry.player.tournamentId === filter);
  byId('rankingTable').innerHTML = ranking.map((entry, index) => `
    <tr>
      <td class="fw-bold">${index + 1}</td>
      <td>${escapeHtml(entry.player.name)}</td>
      <td>${escapeHtml(getTournament(entry.player.tournamentId)?.name || 'Sin torneo')}</td>
      <td><span class="badge badge-gender">${entry.player.gender}</span> <span class="badge badge-level">${entry.player.level}</span></td>
      <td>${entry.played}</td>
      <td>${entry.wins}</td>
      <td>${entry.losses}</td>
      <td>${entry.pointsFor}</td>
      <td>${entry.pointsAgainst}</td>
      <td>${entry.difference}</td>
      <td><strong>${entry.rankingPoints}</strong></td>
    </tr>
  `).join('') || '<tr><td colspan="11" class="text-center text-muted py-4">No hay datos de ranking.</td></tr>';
}

async function exportTournamentPdf() {
  const tournamentId = byId('bracketTournament').value;
  const tournament = getTournament(tournamentId);
  if (!tournament) {
    showToast('Selecciona un torneo para exportar.', 'warning');
    return;
  }

  const area = byId('bracketExportArea');
  const { jsPDF } = window.jspdf;
  const canvas = await html2canvas(area, { scale: 2, backgroundColor: '#ffffff' });
  const image = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const imageWidth = pageWidth - margin * 2;
  const imageHeight = (canvas.height * imageWidth) / canvas.width;

  pdf.setFontSize(16);
  pdf.text(`Torneo: ${tournament.name}`, margin, 12);
  pdf.setFontSize(10);
  pdf.text(`Lugar: ${tournament.place} | Fecha: ${formatDate(tournament.date)} | Estado: ${tournament.status}`, margin, 18);

  let heightLeft = imageHeight;
  let position = 24;
  pdf.addImage(image, 'PNG', margin, position, imageWidth, imageHeight);
  heightLeft -= pageHeight - position;

  while (heightLeft > 0) {
    pdf.addPage();
    position = heightLeft - imageHeight + margin;
    pdf.addImage(image, 'PNG', margin, position, imageWidth, imageHeight);
    heightLeft -= pageHeight - margin;
  }

  const filename = `${tournament.name.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}-${tournament.date || 'torneo'}.pdf`;
  pdf.save(filename);
  showToast('PDF generado correctamente.');
}

function resetAllData() {
  if (!confirm('¿Seguro que quieres borrar todos los torneos, jugadores, brackets y resultados guardados en este navegador?')) return;
  state.tournaments = [];
  state.players = [];
  state.brackets = [];
  persistAll();
  renderAll();
  showToast('Todos los datos fueron eliminados.');
}

window.editTournament = editTournament;
window.deleteTournament = deleteTournament;
window.editPlayer = editPlayer;
window.deletePlayer = deletePlayer;
window.openScoreModal = openScoreModal;

document.addEventListener('DOMContentLoaded', initializeApp);
