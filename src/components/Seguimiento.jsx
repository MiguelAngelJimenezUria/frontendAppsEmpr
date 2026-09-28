import { useState, useEffect } from 'react';
import * as api from '../api';

const EMPTY = { ticketId: '', usuarioId: '', comentario: '' };

export default function Seguimiento() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [tickets, setTickets] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  const load = async () => {
    setError('');
    try {
      const data = await api.getMisSeguimientos();
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
    api.getMisTickets().then((d) => setTickets(Array.isArray(d) ? d : [])).catch(() => {});
    api.getUsuarios().then((d) => setUsuarios(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');

    const ticketIdNum = Number(form.ticketId);
    if (form.ticketId === '' || Number.isNaN(ticketIdNum)) {
      setError('Selecciona un ticket válido.');
      return;
    }
    const usuarioIdNum = Number(form.usuarioId);
    if (form.usuarioId === '' || Number.isNaN(usuarioIdNum)) {
      setError('Selecciona un usuario válido.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        ticketId: ticketIdNum,
        usuarioId: usuarioIdNum,
      };
      if (editId) {
        await api.updateSeguimiento(editId, { id: editId, ...payload });
        setMsg('Seguimiento actualizado correctamente.');
      } else {
        await api.createSeguimiento(payload);
        setMsg('Seguimiento creado correctamente.');
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

  const handleEdit = (s) => {
    setEditId(s.id);
    setMsg('');
    setError('');
    setForm({
      ticketId: s.ticketId ?? '',
      usuarioId: s.usuarioId ?? '',
      comentario: s.comentario || '',
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este seguimiento?')) return;
    setError('');
    try {
      await api.deleteSeguimiento(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancel = () => {
    setEditId(null);
    setForm(EMPTY);
    setError('');
    setMsg('');
  };

  // El backend puede nombrar el id del recurso de distintas formas según el endpoint
  const getId = (obj) => obj.id ?? obj.usuarioId ?? obj.ticketId ?? obj.Id ?? obj.ID ?? '';

  return (
    <div className="section">
      <h2>Seguimiento</h2>
      <div className="layout-cols">
        <form className="card" onSubmit={handleSubmit}>
          <h3>{editId ? `Editar Seguimiento #${editId}` : 'Nuevo Seguimiento'}</h3>
          <div className="field">
            <label>Ticket</label>
            {tickets.length > 0 ? (
              <select
                value={form.ticketId}
                onChange={(e) => setForm({ ...form, ticketId: e.target.value })}
                required
              >
                <option value="">— Seleccionar ticket —</option>
                {tickets.map((t) => (
                  <option key={getId(t)} value={getId(t)}>
                    #{t.id} — {t.titulo} ({t.estado})
                  </option>
                ))}
              </select>
            ) : (
              <input type="number" min="1" value={form.ticketId} onChange={(e) => setForm({ ...form, ticketId: e.target.value })} required />
            )}
          </div>
          <div className="field">
            <label>Usuario</label>
            {usuarios.length > 0 ? (
              <select
                value={form.usuarioId}
                onChange={(e) => setForm({ ...form, usuarioId: e.target.value })}
                required
              >
                <option value="">— Seleccionar usuario —</option>
                {usuarios.map((u) => (
                  <option key={getId(u)} value={getId(u)}>
                    {u.nombre} {u.apellido} ({u.rol})
                  </option>
                ))}
              </select>
            ) : (
              <input type="number" min="1" value={form.usuarioId} onChange={(e) => setForm({ ...form, usuarioId: e.target.value })} required />
            )}
          </div>
          <div className="field">
            <label>Comentario</label>
            <textarea value={form.comentario} onChange={(e) => setForm({ ...form, comentario: e.target.value })} rows={5} required />
          </div>
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
          <h3>Lista de Seguimientos</h3>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Ticket</th>
                <th>Usuario</th>
                <th>Comentario</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => {
                const tk = tickets.find((t) => t.id === s.ticketId);
                const us = usuarios.find((u) => u.id === s.usuarioId);
                return (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td>{tk ? `#${tk.id} ${tk.titulo}` : s.ticketId}</td>
                    <td>{us ? `${us.nombre} ${us.apellido}` : s.usuarioId}</td>
                    <td className="comentario-cell">{s.comentario}</td>
                    <td>{s.fecha ? new Date(s.fecha).toLocaleString('es-PE') : '—'}</td>
                    <td>
                      <button onClick={() => handleEdit(s)}>Editar</button>
                      <button className="danger" onClick={() => handleDelete(s.id)}>Eliminar</button>
                    </td>
                  </tr>
                );
              })}
              {list.length === 0 && (
                <tr><td colSpan={6} className="empty">Sin registros</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
