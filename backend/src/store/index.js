// Simple in-memory store. On Render free tier, data resets on restart.
// Swap this module for a DB adapter (SQLite, Postgres, etc.) without touching routes.

const store = {
  tournaments: [],
  players: [],
  brackets: []
};

module.exports = store;
