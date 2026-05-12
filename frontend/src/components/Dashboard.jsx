import { useApp } from '../hooks/useApp';

export default function Dashboard() {
  const { tournaments, players, brackets } = useApp();

  const active = tournaments.filter(t => t.status === 'En curso').length;
  const finished = tournaments.filter(t => t.status === 'Finalizado').length;
  const finishedMatches = brackets
    .flatMap(b => b.rounds.flatMap(r => r.matches))
    .filter(m => m.status === 'Finalizado').length;

  const stats = [
    { label: 'Torneos', value: tournaments.length, icon: '🏆' },
    { label: 'Jugadores', value: players.length, icon: '👟' },
    { label: 'Torneos en curso', value: active, icon: '🎾' },
    { label: 'Partidos finalizados', value: finishedMatches, icon: '✅' },
    { label: 'Torneos finalizados', value: finished, icon: '🏁' },
  ];

  return (
    <section id="dashboard" className="mb-5">
      <div className="hero-card p-4 p-lg-5 mb-4">
        <div className="row align-items-center g-4">
          <div className="col-lg-8">
            <p className="text-uppercase text-lime fw-bold mb-2">Organizador de torneos</p>
            <h1 className="display-5 fw-bold mb-3">Gestiona torneos de tenis de principio a fin</h1>
            <p className="lead mb-0">
              Registra torneos y jugadores, genera emparejamientos por sexo y nivel, captura puntajes,
              avanza ganadores automáticamente, consulta ranking y exporta el cuadro a PDF.
            </p>
          </div>
          <div className="col-lg-4">
            <div className="quick-card">
              <h2 className="h5">Acciones rápidas</h2>
              <div className="d-grid gap-2">
                <a className="btn btn-light" href="#torneos">Crear torneo</a>
                <a className="btn btn-outline-light" href="#jugadores">Registrar jugador</a>
                <a className="btn btn-outline-light" href="#brackets">Generar bracket</a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="row g-3">
        {stats.map(item => (
          <div key={item.label} className="col-sm-6 col-xl">
            <div className="card stat-card shadow-sm h-100">
              <div className="card-body">
                <div className="fs-2">{item.icon}</div>
                <div className="stat-value">{item.value}</div>
                <div className="text-muted fw-semibold">{item.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
