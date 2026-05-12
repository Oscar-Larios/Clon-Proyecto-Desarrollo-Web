import { useEffect } from 'react';
import { AppProvider, useApp } from './hooks/useApp';
import Dashboard from './components/Dashboard';
import Tournaments from './components/Tournaments';
import Players from './components/Players';
import Brackets from './components/Brackets';
import Ranking from './components/Ranking';
import Toast from './components/Toast';

function AppShell() {
  const { loadAll, loading, error } = useApp();

  useEffect(() => { loadAll(); }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-success mb-3" />
          <div className="fw-semibold text-muted">Conectando con el servidor...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="text-center p-4">
          <div className="fs-1 mb-2">⚠️</div>
          <h2 className="h4">No se pudo conectar al servidor</h2>
          <p className="text-muted">{error}</p>
          <p className="small text-muted">Asegúrate de que el backend en Render esté activo y que <code>VITE_API_URL</code> apunte a la URL correcta.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark app-navbar sticky-top">
        <div className="container-fluid">
          <a className="navbar-brand fw-bold" href="#">🎾 Tennis Bracket Manager</a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNavbar">
            <span className="navbar-toggler-icon" />
          </button>
          <div className="collapse navbar-collapse" id="mainNavbar">
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
              {['#dashboard', '#torneos', '#jugadores', '#brackets', '#ranking'].map((href) => (
                <li key={href} className="nav-item">
                  <a className="nav-link" href={href}>
                    {{ '#dashboard': 'Dashboard', '#torneos': 'Torneos', '#jugadores': 'Jugadores', '#brackets': 'Brackets', '#ranking': 'Ranking' }[href]}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </nav>
      <main className="container-fluid py-4">
        <Dashboard />
        <Tournaments />
        <Players />
        <Brackets />
        <Ranking />
      </main>
      <Toast />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
