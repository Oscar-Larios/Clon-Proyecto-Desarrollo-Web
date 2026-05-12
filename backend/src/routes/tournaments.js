const express = require('express');
const { v4: uuidv4 } = require('uuid');
const store = require('../store');

const router = express.Router();

function normalizeText(value) {
  return String(value).trim().toLowerCase().replace(/\s+/g, ' ');
}

// GET all tournaments
router.get('/', (req, res) => {
  res.json(store.tournaments);
});

// GET single tournament
router.get('/:id', (req, res) => {
  const tournament = store.tournaments.find(t => t.id === req.params.id);
  if (!tournament) return res.status(404).json({ error: 'Torneo no encontrado' });
  res.json(tournament);
});

// POST create tournament
router.post('/', (req, res) => {
  const { name, place, date, status = 'Pendiente', description = '' } = req.body;
  if (!name || !place || !date) {
    return res.status(400).json({ error: 'Nombre, lugar y fecha son requeridos' });
  }

  const duplicate = store.tournaments.some(t =>
    normalizeText(t.name) === normalizeText(name) && t.date === date
  );
  if (duplicate) {
    return res.status(409).json({ error: 'Ya existe un torneo con el mismo nombre y fecha' });
  }

  const now = new Date().toISOString();
  const tournament = {
    id: uuidv4(),
    name: name.trim(),
    place: place.trim(),
    date,
    status,
    description: description.trim(),
    createdAt: now,
    updatedAt: now
  };
  store.tournaments.push(tournament);
  res.status(201).json(tournament);
});

// PUT update tournament
router.put('/:id', (req, res) => {
  const index = store.tournaments.findIndex(t => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Torneo no encontrado' });

  const { name, place, date, status, description } = req.body;
  const existing = store.tournaments[index];

  const duplicate = store.tournaments.some(t =>
    t.id !== req.params.id &&
    normalizeText(t.name) === normalizeText(name || existing.name) &&
    (date || existing.date) === t.date
  );
  if (duplicate) {
    return res.status(409).json({ error: 'Ya existe un torneo con el mismo nombre y fecha' });
  }

  store.tournaments[index] = {
    ...existing,
    name: (name || existing.name).trim(),
    place: (place || existing.place).trim(),
    date: date || existing.date,
    status: status || existing.status,
    description: description !== undefined ? description.trim() : existing.description,
    updatedAt: new Date().toISOString()
  };
  res.json(store.tournaments[index]);
});

// DELETE tournament (cascades players + brackets)
router.delete('/:id', (req, res) => {
  const id = req.params.id;
  const exists = store.tournaments.some(t => t.id === id);
  if (!exists) return res.status(404).json({ error: 'Torneo no encontrado' });

  store.tournaments = store.tournaments.filter(t => t.id !== id);
  store.players = store.players.filter(p => p.tournamentId !== id);
  store.brackets = store.brackets.filter(b => b.tournamentId !== id);
  res.json({ message: 'Torneo eliminado correctamente' });
});

module.exports = router;
