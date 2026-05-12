# 🎾 Tennis Bracket Manager

Aplicación fullstack para organizar torneos de tenis. Frontend en **React + Vite** (desplegado en GitHub Pages), backend en **Express + Node.js** (desplegado en Render).

---

## Estructura del proyecto

```
tennis-bracket-manager/
├── backend/                  # API REST (Express)
│   └── src/
│       ├── index.js
│       ├── store/index.js    # Estado en memoria (swappable por DB)
│       └── routes/
│           ├── tournaments.js
│           ├── players.js
│           └── brackets.js
├── frontend/                 # React + Vite
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── styles.css
│       ├── utils/api.js      # Cliente HTTP centralizado
│       ├── hooks/useApp.jsx  # Estado global (Context + useReducer)
│       └── components/
│           ├── Dashboard.jsx
│           ├── Tournaments.jsx
│           ├── Players.jsx
│           ├── Brackets.jsx
│           ├── Ranking.jsx
│           └── Toast.jsx
├── .github/workflows/
│   └── deploy-frontend.yml   # CI/CD → GitHub Pages
└── render.yaml               # Deploy automático en Render
```

---

## Despliegue paso a paso

### 1. Backend en Render

1. Sube el proyecto a un repositorio de GitHub.
2. Ve a [render.com](https://render.com) → **New → Blueprint** y apunta al repositorio (Render detectará `render.yaml` automáticamente).
   - O usa **New → Web Service**, selecciona el repo, `Root directory = backend`, `Build = npm install`, `Start = npm start`.
3. En el dashboard de Render, agrega la variable de entorno:
   - `FRONTEND_URL` = `https://TU_USUARIO.github.io` (restringe CORS)
4. Copia la URL pública del servicio, p. ej.: `https://tennis-bracket-api.onrender.com`

> **Nota:** El plan gratuito de Render duerme el servicio tras 15 min de inactividad y **los datos en memoria se pierden** al reiniciar. Para persistencia, conecta una base de datos (ver sección "Persistencia" abajo).

---

### 2. Frontend en GitHub Pages

#### Variables necesarias

| Variable | Dónde configurar | Valor ejemplo |
|---|---|---|
| `VITE_API_URL` | GitHub Secret | `https://tennis-bracket-api.onrender.com` |
| `VITE_BASE_PATH` | GitHub Variable (opcional) | `/tennis-bracket-manager/` |

#### Pasos

1. En GitHub → **Settings → Secrets and variables → Actions**:
   - Agrega el **secret** `VITE_API_URL` con la URL de Render.
   - Agrega la **variable** `VITE_BASE_PATH` con `/nombre-del-repo/` (si el repo no se llama igual que el usuario).
2. En GitHub → **Settings → Pages**:
   - Source: **GitHub Actions**
3. Haz un push a `main`. El workflow `.github/workflows/deploy-frontend.yml` construirá y publicará el sitio automáticamente.
4. Tu app estará en: `https://TU_USUARIO.github.io/nombre-del-repo/`

---

## Desarrollo local

```bash
# Terminal 1 – Backend
cd backend
npm install
npm run dev          # Levanta en http://localhost:3001

# Terminal 2 – Frontend
cd frontend
cp .env.example .env.local
# .env.local ya apunta a http://localhost:3001 por defecto
npm install
npm run dev          # Levanta en http://localhost:5173
```

---

## API endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/tournaments` | Lista todos los torneos |
| POST | `/api/tournaments` | Crea un torneo |
| PUT | `/api/tournaments/:id` | Actualiza un torneo |
| DELETE | `/api/tournaments/:id` | Elimina torneo + jugadores + brackets |
| GET | `/api/players?tournamentId=` | Lista jugadores (filtro opcional) |
| POST | `/api/players` | Crea jugador |
| PUT | `/api/players/:id` | Actualiza jugador |
| DELETE | `/api/players/:id` | Elimina jugador |
| GET | `/api/brackets?tournamentId=` | Lista brackets |
| POST | `/api/brackets/generate` | Genera brackets para un torneo |
| PUT | `/api/brackets/:bracketId/matches/:matchId/score` | Guarda resultado de partido |

---

## Añadir persistencia (opcional)

El store en `backend/src/store/index.js` es un objeto en memoria. Para persistir datos en Render:

### SQLite (sin costo extra)
```bash
cd backend && npm install better-sqlite3
```
Reemplaza `store/index.js` con un módulo que lea/escriba un archivo SQLite en `/tmp/tennis.db`.

### PostgreSQL (Render ofrece plan gratuito)
```bash
cd backend && npm install pg
```
Crea una instancia de Postgres en Render y conecta via `DATABASE_URL` (variable de entorno en Render).

---

## Funcionalidades

- ✅ Crear, editar y eliminar torneos
- ✅ Registrar, editar y eliminar jugadores
- ✅ Separar jugadores por sexo y nivel
- ✅ Generar brackets automáticamente por categoría
- ✅ BYE automático para participantes impares
- ✅ Capturar puntajes y avanzar ganadores
- ✅ Ranking con victorias, derrotas, diferencia de puntos, BYE y campeonatos
- ✅ Exportar bracket a PDF
- ✅ Imprimir vista del bracket
