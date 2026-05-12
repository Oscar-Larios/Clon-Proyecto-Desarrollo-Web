const express = require('express');
const { v4: uuidv4 } = require('uuid');
const store = require('../store');

const router = express.Router();

function normalizeText(value) {
  return String(value).trim().toLowerCase().replace(/\s+/g, ' ');
}

function removePlayerFromBrackets(playerId) {
  store.brackets.forEach(bracket => {
    bracket.rounds.forEach(round => {
      round.matches.forEach(match => {
        if (match.player1Id === playerId) match.player1Id = null;
        if (match.player2Id === playerId) match.player2Id = null;
        if (match.winnerId === playerId) match.winnerId = null;
        if (!match.winnerId) match.status = 'Pendiente';
      });
    });
  });
}

// GET all players (optional ?tournamentId= filter)
router.get('/', (req, res) => {
  const { tournamentId } = req.query;
  const players = tournamentId
    ? store.players.filter(p => p.tournamentId === tournamentId)
    : store.players;
  res.json(players);
});

// GET single player
router.get('/:id', (req, res) => {
  const player = store.players.find(p => p.id === req.params.id);
  if (!player) return res.status(404).json({ error: 'Jugador no encontrado' });
  res.json(player);
});

// POST create player
router.post('/', (req, res) => {
  const { name, tournamentId, gender, level } = req.body;
  if (!name || !tournamentId || !gender || !level) {
    return res.status(400).json({ error: 'Nombre, torneo, sexo y nivel son requeridos' });
  }

  const tournamentExists = store.tournaments.some(t => t.id === tournamentId);
  if (!tournamentExists) return res.status(404).json({ error: 'Torneo no encontrado' });

  const duplicate = store.players.some(p =>
    p.tournamentId === tournamentId &&
    normalizeText(p.name) === normalizeText(name)
  );
  if (duplicate) {
    return res.status(409).json({ error: 'Ya existe un jugador con ese nombre en este torneo' });
  }

  const now = new Date().toISOString();
  const player = {
    id: uuidv4(),
    name: name.trim(),
    tournamentId,
    gender,
    level,
    createdAt: now,
    updatedAt: now
  };
  store.players.push(player);
  res.status(201).json(player);
});

// PUT update player
router.put('/:id', (req, res) => {
  const index = store.players.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Jugador no encontrado' });

  const { name, tournamentId, gender, level } = req.body;
  const existing = store.players[index];
  const newTournamentId = tournamentId || existing.tournamentId;

  const duplicate = store.players.some(p =>
    p.id !== req.params.id &&
    p.tournamentId === newTournamentId &&
    normalizeText(p.name) === normalizeText(name || existing.name)
  );
  if (duplicate) {
    return res.status(409).json({ error: 'Ya existe un jugador con ese nombre en este torneo' });
  }

  const categoryChanged =
    newTournamentId !== existing.tournamentId ||
    (gender && gender !== existing.gender) ||
    (level && level !== existing.level);

  if (categoryChanged) removePlayerFromBrackets(req.params.id);

  store.players[index] = {
    ...existing,
    name: (name || existing.name).trim(),
    tournamentId: newTournamentId,
    gender: gender || existing.gender,
    level: level || existing.level,
    updatedAt: new Date().toISOString()
  };
  res.json(store.players[index]);
});

// DELETE player
router.delete('/:id', (req, res) => {
  const exists = store.players.some(p => p.id === req.params.id);
  if (!exists) return res.status(404).json({ error: 'Jugador no encontrado' });

  removePlayerFromBrackets(req.params.id);
  store.players = store.players.filter(p => p.id !== req.params.id);
  res.json({ message: 'Jugador eliminado correctamente' });
});

module.exports = router;
