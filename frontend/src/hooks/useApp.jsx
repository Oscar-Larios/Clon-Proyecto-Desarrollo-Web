import { createContext, useContext, useReducer, useCallback } from 'react';
import { api } from '../utils/api';

const AppContext = createContext(null);

const initialState = {
  tournaments: [],
  players: [],
  brackets: [],
  loading: false,
  error: null,
  toast: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, loading: action.payload };
    case 'SET_ERROR': return { ...state, error: action.payload };
    case 'SET_TOAST': return { ...state, toast: action.payload };
    case 'SET_TOURNAMENTS': return { ...state, tournaments: action.payload };
    case 'SET_PLAYERS': return { ...state, players: action.payload };
    case 'SET_BRACKETS': return { ...state, brackets: action.payload };
    default: return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const showToast = useCallback((message, variant = 'success') => {
    dispatch({ type: 'SET_TOAST', payload: { message, variant } });
    setTimeout(() => dispatch({ type: 'SET_TOAST', payload: null }), 3500);
  }, []);

  const loadAll = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const [tournaments, players, brackets] = await Promise.all([
        api.getTournaments(),
        api.getPlayers(),
        api.getBrackets(),
      ]);
      dispatch({ type: 'SET_TOURNAMENTS', payload: tournaments });
      dispatch({ type: 'SET_PLAYERS', payload: players });
      dispatch({ type: 'SET_BRACKETS', payload: brackets });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Tournaments
  const createTournament = useCallback(async (data) => {
    const tournament = await api.createTournament(data);
    dispatch({ type: 'SET_TOURNAMENTS', payload: [...state.tournaments, tournament] });
    showToast('Torneo creado correctamente.');
    return tournament;
  }, [state.tournaments, showToast]);

  const updateTournament = useCallback(async (id, data) => {
    const updated = await api.updateTournament(id, data);
    dispatch({ type: 'SET_TOURNAMENTS', payload: state.tournaments.map(t => t.id === id ? updated : t) });
    showToast('Torneo actualizado correctamente.');
    return updated;
  }, [state.tournaments, showToast]);

  const deleteTournament = useCallback(async (id) => {
    await api.deleteTournament(id);
    dispatch({ type: 'SET_TOURNAMENTS', payload: state.tournaments.filter(t => t.id !== id) });
    dispatch({ type: 'SET_PLAYERS', payload: state.players.filter(p => p.tournamentId !== id) });
    dispatch({ type: 'SET_BRACKETS', payload: state.brackets.filter(b => b.tournamentId !== id) });
    showToast('Torneo eliminado correctamente.');
  }, [state.tournaments, state.players, state.brackets, showToast]);

  // Players
  const createPlayer = useCallback(async (data) => {
    const player = await api.createPlayer(data);
    dispatch({ type: 'SET_PLAYERS', payload: [...state.players, player] });
    showToast('Jugador registrado correctamente.');
    return player;
  }, [state.players, showToast]);

  const updatePlayer = useCallback(async (id, data) => {
    const updated = await api.updatePlayer(id, data);
    dispatch({ type: 'SET_PLAYERS', payload: state.players.map(p => p.id === id ? updated : p) });
    // Reload brackets in case category changed
    const brackets = await api.getBrackets();
    dispatch({ type: 'SET_BRACKETS', payload: brackets });
    showToast('Jugador actualizado correctamente.');
    return updated;
  }, [state.players, showToast]);

  const deletePlayer = useCallback(async (id) => {
    await api.deletePlayer(id);
    dispatch({ type: 'SET_PLAYERS', payload: state.players.filter(p => p.id !== id) });
    const brackets = await api.getBrackets();
    dispatch({ type: 'SET_BRACKETS', payload: brackets });
    showToast('Jugador eliminado correctamente.');
  }, [state.players, showToast]);

  // Brackets
  const generateBrackets = useCallback(async (tournamentId) => {
    const newBrackets = await api.generateBrackets(tournamentId);
    dispatch({
      type: 'SET_BRACKETS',
      payload: [...state.brackets.filter(b => b.tournamentId !== tournamentId), ...newBrackets]
    });
    showToast('Brackets generados correctamente.');
  }, [state.brackets, showToast]);

  const updateScore = useCallback(async (bracketId, matchId, scores) => {
    const updatedBracket = await api.updateScore(bracketId, matchId, scores);
    dispatch({
      type: 'SET_BRACKETS',
      payload: state.brackets.map(b => b.id === bracketId ? updatedBracket : b)
    });
    showToast('Resultado guardado y ganador avanzado.');
    return updatedBracket;
  }, [state.brackets, showToast]);

  const resetAll = useCallback(async () => {
    // Reset in memory on server isn't supported via a single endpoint here,
    // so we delete all tournaments (cascade deletes everything)
    for (const t of state.tournaments) {
      await api.deleteTournament(t.id);
    }
    dispatch({ type: 'SET_TOURNAMENTS', payload: [] });
    dispatch({ type: 'SET_PLAYERS', payload: [] });
    dispatch({ type: 'SET_BRACKETS', payload: [] });
    showToast('Todos los datos fueron eliminados.');
  }, [state.tournaments, showToast]);

  return (
    <AppContext.Provider value={{
      ...state,
      loadAll,
      showToast,
      createTournament,
      updateTournament,
      deleteTournament,
      createPlayer,
      updatePlayer,
      deletePlayer,
      generateBrackets,
      updateScore,
      resetAll,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
