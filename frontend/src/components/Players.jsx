import { useState } from 'react';
import { useApp } from '../hooks/useApp';

const empty = { name: '', tournamentId: '', gender: '', level: '' };

export default function Players() {
  const { tournaments, players, createPlayer, updatePlayer, deletePlayer, showToast } = useApp();
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [validated, setValidated] = useState(false);
  const [filter, setFilter] = useState('all');

  function reset() {
    setForm(empty);
    setEditId(null);
    setValidated(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!e.currentTarget.checkValidity() || !form.tournamentId || !form.gender || !form.level) {
      setValidated(true);
      return;
    }
    try {
      if (editId) {
        await updatePlayer(editId, form);
      } else {
        await createPlayer(form);
      }
      reset();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }

  function handleEdit(p) {
    setForm({ name: p.name, tournamentId: p.tournamentId, gender: p.gender, level: p.level });
    setEditId(p.id);
    location.hash = '#jugadores';
  }

  async function handleDelete(p) {
    if (!confirm(`¿Eliminar al jugador "${p.name}"?`)) return;
    try { await deletePlayer(p.id); } catch (err) { showToast(err.message, 'danger'); }
  }

  const getTournamentName = (id) => tournaments.find(t => t.id === id)?.name || 'Sin torneo';
  const filtered = filter === 'all' ? players : players.filter(p => p.tournamentId === filter);

  return (
    <section id="jugadores" className="mb-5">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Inscripciones</p>
          <h2>Jugadores</h2>
        </div>
      </div>
      <div className="row g-4">
        <div className="col-lg-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h3 className="h5 mb-3">{editId ? 'Editar jugador' : 'Nuevo jugador'}</h3>
              <form className={`needs-validation ${validated ? 'was-validated' : ''}`} noValidate onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Nombre completo</label>
                  <input className="form-control" required placeholder="Ana López"
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  <div className="invalid-feedback">Captura el nombre del jugador.</div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Torneo</label>
                  <select className="form-select" required value={form.tournamentId}
                    onChange={e => setForm(f => ({ ...f, tournamentId: e.target.value }))}>
                    <option value="">Selecciona un torneo</option>
                    {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <div className="invalid-feedback">Selecciona un torneo.</div>
                </div>
                <div className="row g-2">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Sexo</label>
                    <select className="form-select" required value={form.gender}
                      onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                      <option value="">Selecciona</option>
                      <option>Femenino</option>
                      <option>Masculino</option>
                    </select>
                    <div className="invalid-feedback">Selecciona el sexo.</div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Nivel</label>
                    <select className="form-select" required value={form.level}
                      onChange={e => setForm(f => ({ ...f, level: e.target.value }))}>
                      <option value="">Selecciona</option>
                      <option>Principiante</option>
                      <option>Intermedio</option>
                      <option>Avanzado</option>
                    </select>
                    <div className="invalid-feedback">Selecciona el nivel.</div>
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-success flex-grow-1" type="submit">Guardar jugador</button>
                  <button className="btn btn-outline-secondary" type="button" onClick={reset}>Limpiar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <div className="col-lg-8">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <h3 className="h5 mb-0">Listado de jugadores</h3>
                <select className="form-select form-select-sm w-auto" value={filter}
                  onChange={e => setFilter(e.target.value)}>
                  <option value="all">Todos los torneos</option>
                  {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="table-responsive">
                <table className="table table-striped table-hover align-middle">
                  <thead>
                    <tr><th>Jugador</th><th>Torneo</th><th>Sexo</th><th>Nivel</th><th className="text-end">Acciones</th></tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0
                      ? <tr><td colSpan="5" className="text-center text-muted py-4">No hay jugadores para mostrar.</td></tr>
                      : filtered.map(p => (
                        <tr key={p.id}>
                          <td><strong>{p.name}</strong></td>
                          <td>{getTournamentName(p.tournamentId)}</td>
                          <td><span className="badge badge-gender">{p.gender}</span></td>
                          <td><span className="badge badge-level">{p.level}</span></td>
                          <td className="text-end">
                            <div className="btn-group btn-group-sm">
                              <button className="btn btn-outline-primary" onClick={() => handleEdit(p)}>Editar</button>
                              <button className="btn btn-outline-danger" onClick={() => handleDelete(p)}>Eliminar</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
