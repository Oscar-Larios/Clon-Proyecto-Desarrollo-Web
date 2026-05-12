const express = require('express');
const cors = require('cors');
const tournamentsRouter = require('./routes/tournaments');
const playersRouter = require('./routes/players');
const bracketsRouter = require('./routes/brackets');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/tournaments', tournamentsRouter);
app.use('/api/players', playersRouter);
app.use('/api/brackets', bracketsRouter);

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`🎾 Tennis API corriendo en puerto ${PORT}`);
});
