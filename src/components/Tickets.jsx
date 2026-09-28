import { useState, useEffect } from 'react';
import * as api from '../api';
import TicketDetalle from './TicketDetalle';

const EMPTY = {
  titulo: '',
  descripcion: '',
  clienteId: '',
  tecnicoId: '',
  estado: 'Abierto',
  prioridad: 'Media',
  fechaCierre: '',
};

const toInputDt = (iso) => (iso ? iso.slice(0, 16) : '');

export default function Tickets() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [reporteLoadingId, setReporteLoadingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [detailId, setDetailId] = useState(null);
  const [usuarios, setUsuarios] = useState([]);

  const currentUser = api.getCurrentUser();
  const isAdmin = currentUser?.rol === 'Administrador';

  const load = async () => {
    setError('');
    try {
      const data = await api.getMisTickets();
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
    api.getUsuarios().then((d) => setUsuarios(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const findUsuario = (id) => usuarios.find((u) => u.id === id);
  const tecnicos = usuarios.filter((u) => (u.rol === 'Tecnico' || u.rol === 'Administrador') && u.activo !== false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');

    const clienteIdNum = Number(form.clienteId);
    if (form.clienteId === '' || Number.isNaN(clienteIdNum)) {
      setError('Ingresa un ID de cliente válido.');
      return;
    }
    let tecnicoIdNum = null;
    if (form.tecnicoId !== '') {
      tecnicoIdNum = Number(form.tecnicoId);
      if (Number.isNaN(tecnicoIdNum)) {
        setError('Ingresa un ID de técnico válido.');
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        titulo: form.titulo,
        descripcion: form.descripcion,
        clienteId: clienteIdNum,
        tecnicoId: tecnicoIdNum,
        estado: form.estado,
        prioridad: form.prioridad,
      };
      if (editId) {
        await api.updateTicket(editId, {
          id: editId,
          ...payload,
          fechaCierre: form.fechaCierre ? new Date(form.fechaCierre).toISOString() : null,
        });
        setMsg('Ticket actualizado correctamente.');
      } else {
        await api.createTicket(payload);
        setMsg('Ticket creado correctamente.');
      }
      setForm(EMPTY);
      setEditId(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (t) => {
    setEditId(t.id);
    setMsg('');
    setError('');
    setForm({
      titulo: t.titulo || '',
      descripcion: t.descripcion || '',
      clienteId: t.clienteId ?? '',
      tecnicoId: t.tecnicoId ?? '',
      estado: t.estado || 'Abierto',
      prioridad: t.prioridad || 'Media',
      fechaCierre: toInputDt(t.fechaCierre),
    });
  };

  const handleEstadoChange = (e) => {
    const newEstado = e.target.value;
    const updates = { ...form, estado: newEstado };
    if (newEstado === 'Cerrado' && !form.fechaCierre) {
      updates.fechaCierre = new Date().toISOString().slice(0, 16);
    }
    setForm(updates);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este ticket?')) return;
    setError('');
    try {
      await api.deleteTicket(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReporte = async (id) => {
    setError('');
    setMsg('');
    setReporteLoadingId(id);
    try {
      await api.getTicketReporte(id);
      setMsg(`Reporte del ticket #${id} descargado.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setReporteLoadingId(null);
    }
  };

  const handleCancel = () => {
    setEditId(null);
    setForm(EMPTY);
    setError('');
    setMsg('');
  };

  const estadoClass = (e) => {
    const map = { Abierto: 'estado-abierto', EnProceso: 'estado-enproceso', Resuelto: 'estado-resuelto', Cerrado: 'estado-cerrado' };
    return map[e] || '';
  };
  const prioClass = (p) => {
    const map = { Critica: 'prio-critica', Alta: 'prio-alta', Media: 'prio-media', Baja: 'prio-baja' };
    return map[p] || '';
  };

  if (detailId) {
    return <TicketDetalle ticketId={detailId} onBack={() => setDetailId(null)} />;
  }

  return (
    <div className="section">
      <h2>Tickets</h2>
      <div className="layout-cols">
        <form className="card" onSubmit={handleSubmit}>
          <h3>{editId ? `Editar Ticket #${editId}` : 'Nuevo Ticket'}</h3>
          <div className="field">
            <label>Título</label>
            <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} required />
          </div>
          <div className="field">
            <label>Descripción</label>
            <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={3} />
          </div>
          <div className="field">
            <label>Cliente ID</label>
            <input type="number" min="1" value={form.clienteId} onChange={(e) => setForm({ ...form, clienteId: e.target.value })} required />
          </div>
          <div className="field">
            <label>Técnico asignado <span className="hint">(opcional)</span></label>
            {isAdmin ? (
              tecnicos.length > 0 ? (
                <select value={form.tecnicoId} onChange={(e) => setForm({ ...form, tecnicoId: e.target.value })}>
                  <option value="">— Sin asignar —</option>
                  {tecnicos.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre} {u.apellido} ({u.rol})
                    </option>
                  ))}
                </select>
              ) : (
                <input type="number" min="1" value={form.tecnicoId} onChange={(e) => setForm({ ...form, tecnicoId: e.target.value })} placeholder="ID del técnico" />
              )
            ) : (
              <input
                value={form.tecnicoId ? (findUsuario(Number(form.tecnicoId))?.nombre ?? `#${form.tecnicoId}`) : 'Sin asignar'}
                disabled
              />
            )}
          </div>
          <div className="field">
            <label>Estado</label>
            <select value={form.estado} onChange={handleEstadoChange}>
              <option value="Abierto">Abierto</option>
              <option value="EnProceso">En Proceso</option>
              <option value="Resuelto">Resuelto</option>
              <option value="Cerrado">Cerrado</option>
            </select>
          </div>
          <div className="field">
            <label>Prioridad</label>
            <select value={form.prioridad} onChange={(e) => setForm({ ...form, prioridad: e.target.value })}>
              <option value="Critica">Crítica</option>
              <option value="Alta">Alta</option>
              <option value="Media">Media</option>
              <option value="Baja">Baja</option>
            </select>
          </div>
          {editId && (
            <div className="field">
              <label>Fecha de cierre <span className="hint">(se auto-completa al cerrar)</span></label>
              <input
                type="datetime-local"
                value={form.fechaCierre}
                onChange={(e) => setForm({ ...form, fechaCierre: e.target.value })}
              />
            </div>
          )}
          {error && <p className="error">{error}</p>}
          {msg && <p className="success">{msg}</p>}
          <div className="btn-row">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : editId ? 'Actualizar' : 'Crear'}
            </button>
            {editId && (
              <button type="button" className="btn-secondary" onClick={handleCancel}>
                Cancelar
              </button>
            )}
          </div>
        </form>

        <div className="card table-wrap">
          <h3>Lista de Tickets</h3>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Título</th>
                <th>Estado</th>
                <th>Prioridad</th>
                <th>Cliente</th>
                <th>Técnico</th>
                <th>Creado</th>
                <th>Cierre</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.titulo}</td>
                  <td><span className={`badge ${estadoClass(t.estado)}`}>{t.estado}</span></td>
                  <td><span className={`badge ${prioClass(t.prioridad)}`}>{t.prioridad}</span></td>
                  <td>{t.clienteId}</td>
                  <td>{t.tecnicoId != null ? (findUsuario(t.tecnicoId)?.nombre ?? `#${t.tecnicoId}`) : '—'}</td>
                  <td>{t.fechaCreacion ? new Date(t.fechaCreacion).toLocaleDateString('es-PE') : '—'}</td>
                  <td>{t.fechaCierre ? new Date(t.fechaCierre).toLocaleDateString('es-PE') : '—'}</td>
                  <td>
                    <button onClick={() => setDetailId(t.id)}>Ver</button>
                    <button onClick={() => handleReporte(t.id)} disabled={reporteLoadingId === t.id}>
                      {reporteLoadingId === t.id ? 'Descargando...' : 'Reporte'}
                    </button>
                    <button onClick={() => handleEdit(t)}>Editar</button>
                    <button className="danger" onClick={() => handleDelete(t.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr><td colSpan={9} className="empty">Sin registros</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

