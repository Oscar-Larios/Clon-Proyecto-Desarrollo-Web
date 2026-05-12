import { useState } from 'react';
import { useApp } from '../hooks/useApp';

function statusColor(status) {
  if (status === 'En curso') return 'success';
  if (status === 'Finalizado') return 'secondary';
  return 'warning';
}

function formatDate(val) {
  if (!val) return 'Sin fecha';
  const [y, m, d] = val.split('-');
  return `${d}/${m}/${y}`;
}

const empty = { name: '', place: '', date: '', status: 'Pendiente', description: '' };

export default function Tournaments() {
  const { tournaments, players, createTournament, updateTournament, deleteTournament, resetAll, showToast } = useApp();
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [validated, setValidated] = useState(false);

  function reset() {
    setForm(empty);
    setEditId(null);
    setValidated(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!e.currentTarget.checkValidity()) { setValidated(true); return; }
    try {
      if (editId) {
        await updateTournament(editId, form);
      } else {
        await createTournament(form);
      }
      reset();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }

  function handleEdit(t) {
    setForm({ name: t.name, place: t.place, date: t.date, status: t.status, description: t.description || '' });
    setEditId(t.id);
    location.hash = '#torneos';
  }

  async function handleDelete(t) {
    if (!confirm(`¿Eliminar el torneo "${t.name}"? También se eliminarán sus jugadores y brackets.`)) return;
    try { await deleteTournament(t.id); } catch (err) { showToast(err.message, 'danger'); }
  }

  async function handleReset() {
    if (!confirm('¿Seguro que quieres borrar todos los torneos, jugadores, brackets y resultados?')) return;
    try { await resetAll(); } catch (err) { showToast(err.message, 'danger'); }
  }

  return (
    <section id="torneos" className="mb-5">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Administración</p>
          <h2>Torneos</h2>
        </div>
        <button className="btn btn-outline-danger btn-sm" onClick={handleReset}>Borrar todos los datos</button>
      </div>
      <div className="row g-4">
        <div className="col-lg-4">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h3 className="h5 mb-3">{editId ? 'Editar torneo' : 'Nuevo torneo'}</h3>
              <form className={`needs-validation ${validated ? 'was-validated' : ''}`} noValidate onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Nombre</label>
                  <input className="form-control" required placeholder="Torneo Primavera"
                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  <div className="invalid-feedback">Captura el nombre del torneo.</div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Lugar</label>
                  <input className="form-control" required placeholder="Club Central"
                    value={form.place} onChange={e => setForm(f => ({ ...f, place: e.target.value }))} />
                  <div className="invalid-feedback">Captura el lugar.</div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Fecha</label>
                  <input type="date" className="form-control" required
                    value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                  <div className="invalid-feedback">Selecciona la fecha.</div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Estado</label>
                  <select className="form-select" value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option>Pendiente</option>
                    <option>En curso</option>
                    <option>Finalizado</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Descripción</label>
                  <textarea className="form-control" rows="3" placeholder="Torneo amateur por categorías"
                    value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-success flex-grow-1" type="submit">Guardar torneo</button>
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
                <h3 className="h5 mb-0">Listado de torneos</h3>
                <span className="badge text-bg-success">{tournaments.length} torneos</span>
              </div>
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Nombre</th><th>Lugar</th><th>Fecha</th><th>Estado</th><th>Jugadores</th>
                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tournaments.length === 0
                      ? <tr><td colSpan="6" className="text-center text-muted py-4">Aún no hay torneos registrados.</td></tr>
                      : tournaments.map(t => (
                        <tr key={t.id}>
                          <td>
                            <strong>{t.name}</strong>
                            <div className="small text-muted">{t.description || 'Sin descripción'}</div>
                          </td>
                          <td>{t.place}</td>
                          <td>{formatDate(t.date)}</td>
                          <td><span className={`badge text-bg-${statusColor(t.status)}`}>{t.status}</span></td>
                          <td>{players.filter(p => p.tournamentId === t.id).length}</td>
                          <td className="text-end">
                            <div className="btn-group btn-group-sm">
                              <button className="btn btn-outline-primary" onClick={() => handleEdit(t)}>Editar</button>
                              <button className="btn btn-outline-danger" onClick={() => handleDelete(t)}>Eliminar</button>
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
