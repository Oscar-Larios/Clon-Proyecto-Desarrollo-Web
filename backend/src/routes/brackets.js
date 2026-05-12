const express = require('express');
const { v4: uuidv4 } = require('uuid');
const store = require('../store');

const router = express.Router();

// ──────────────────────────────────────────────
// Bracket generation helpers (ported from app.js)
// ──────────────────────────────────────────────

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function nextPowerOfTwo(n) {
  return 2 ** Math.ceil(Math.log2(n));
}

function getRoundName(roundNumber, totalRounds) {
  if (roundNumber === totalRounds) return 'Final';
  if (roundNumber === totalRounds - 1) return 'Semifinal';
  if (roundNumber === totalRounds - 2) return 'Cuartos';
  return `Ronda ${roundNumber}`;
}

function findMatch(bracket, matchId) {
  return bracket.rounds.flatMap(r => r.matches).find(m => m.id === matchId);
}

function advanceWinner(bracket, match, winnerId) {
  if (!match.nextMatchId) {
    bracket.championId = winnerId;
    return;
  }
  const nextMatch = findMatch(bracket, match.nextMatchId);
  if (nextMatch) nextMatch[match.nextSlot] = winnerId;
}

function resolveAutomaticByes(bracket) {
  let changed = true;
  while (changed) {
    changed = false;
    bracket.rounds.forEach(round => {
      round.matches.forEach(match => {
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

function createBracket(tournamentId, groupKey, players) {
  const shuffled = shuffle(players);
  const size = nextPowerOfTwo(shuffled.length);
  const slots = [...shuffled.map(p => p.id), ...Array(size - shuffled.length).fill(null)];
  const totalRounds = Math.log2(size);
  const rounds = [];

  for (let r = 1; r <= totalRounds; r++) {
    const matchCount = size / 2 ** r;
    rounds.push({
      roundNumber: r,
      name: getRoundName(r, totalRounds),
      matches: Array.from({ length: matchCount }, (_, i) => ({
        id: uuidv4(),
        roundNumber: r,
        position: i + 1,
        player1Id: r === 1 ? slots[i * 2] : null,
        player2Id: r === 1 ? slots[i * 2 + 1] : null,
        player1Score: null,
        player2Score: null,
        winnerId: null,
        status: 'Pendiente',
        bye: false,
        nextMatchId: null,
        nextSlot: null
      }))
    });
  }

  const bracket = {
    id: uuidv4(),
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

function groupPlayers(players) {
  return players.reduce((groups, player) => {
    const key = `${player.gender} - ${player.level}`;
    groups[key] = groups[key] || [];
    groups[key].push(player);
    return groups;
  }, {});
}

function clearDownstream(bracket, match) {
  let current = match;
  let prevWinnerId = match.winnerId;

  while (current.nextMatchId) {
    const next = findMatch(bracket, current.nextMatchId);
    if (!next) break;
    if (prevWinnerId && next[current.nextSlot] === prevWinnerId) {
      next[current.nextSlot] = null;
    }
    prevWinnerId = next.winnerId;
    next.player1Score = null;
    next.player2Score = null;
    next.winnerId = null;
    next.status = 'Pendiente';
    next.bye = false;
    current = next;
  }
  bracket.championId = null;
}

// ──────────────────────────────────────────────
// Routes
// ──────────────────────────────────────────────

// GET all brackets (optional ?tournamentId= filter)
router.get('/', (req, res) => {
  const { tournamentId } = req.query;
  const brackets = tournamentId
    ? store.brackets.filter(b => b.tournamentId === tournamentId)
    : store.brackets;
  res.json(brackets);
});

// POST generate brackets for a tournament (replaces existing)
router.post('/generate', (req, res) => {
  const { tournamentId } = req.body;
  if (!tournamentId) return res.status(400).json({ error: 'tournamentId es requerido' });

  const tournament = store.tournaments.find(t => t.id === tournamentId);
  if (!tournament) return res.status(404).json({ error: 'Torneo no encontrado' });

  const players = store.players.filter(p => p.tournamentId === tournamentId);
  if (players.length < 2) {
    return res.status(400).json({ error: 'Se necesitan al menos 2 jugadores en el torneo' });
  }

  // Remove old brackets for this tournament
  store.brackets = store.brackets.filter(b => b.tournamentId !== tournamentId);

  const grouped = groupPlayers(players);
  const newBrackets = [];
  Object.entries(grouped).forEach(([groupKey, groupPlayers]) => {
    if (groupPlayers.length >= 2) {
      newBrackets.push(createBracket(tournamentId, groupKey, groupPlayers));
    }
  });

  store.brackets.push(...newBrackets);
  res.status(201).json(newBrackets);
});

// PUT update match score
router.put('/:bracketId/matches/:matchId/score', (req, res) => {
  const bracket = store.brackets.find(b => b.id === req.params.bracketId);
  if (!bracket) return res.status(404).json({ error: 'Bracket no encontrado' });

  const match = findMatch(bracket, req.params.matchId);
  if (!match) return res.status(404).json({ error: 'Partido no encontrado' });
  if (!match.player1Id || !match.player2Id) {
    return res.status(400).json({ error: 'El partido no tiene dos jugadores asignados aún' });
  }

  const { player1Score, player2Score } = req.body;
  if (player1Score === undefined || player2Score === undefined) {
    return res.status(400).json({ error: 'player1Score y player2Score son requeridos' });
  }
  if (Number(player1Score) === Number(player2Score)) {
    return res.status(400).json({ error: 'El resultado no puede quedar empatado' });
  }

  clearDownstream(bracket, match);
  match.player1Score = Number(player1Score);
  match.player2Score = Number(player2Score);
  match.winnerId = match.player1Score > match.player2Score ? match.player1Id : match.player2Id;
  match.status = 'Finalizado';
  match.bye = false;
  advanceWinner(bracket, match, match.winnerId);
  resolveAutomaticByes(bracket);

  res.json(bracket);
});

// DELETE all brackets for a tournament
router.delete('/', (req, res) => {
  const { tournamentId } = req.query;
  if (!tournamentId) return res.status(400).json({ error: 'tournamentId es requerido' });
  store.brackets = store.brackets.filter(b => b.tournamentId !== tournamentId);
  res.json({ message: 'Brackets eliminados' });
});

module.exports = router;
