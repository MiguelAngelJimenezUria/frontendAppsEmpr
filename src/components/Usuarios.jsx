import { useState, useEffect } from 'react';
import * as api from '../api';

const EMPTY = {
  nombre: '',
  apellido: '',
  correo: '',
  passwordHash: '',
  rol: 'Cliente',
  activo: true,
};

export default function Usuarios() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = async () => {
    setError('');
    try {
      const data = await api.getUsuarios();
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMsg('');
    try {
      if (editId) {
        await api.updateUsuario(editId, { id: editId, ...form });
        setMsg('Usuario actualizado correctamente.');
      } else {
        await api.createUsuario(form);
        setMsg('Usuario creado correctamente.');
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

  const handleEdit = (u) => {
    setEditId(u.id);
    setMsg('');
    setError('');
    setForm({
      nombre: u.nombre || '',
      apellido: u.apellido || '',
      correo: u.correo || '',
      passwordHash: '',
      rol: u.rol || 'Cliente',
      activo: u.activo ?? true,
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este usuario?')) return;
    setError('');
    try {
      await api.deleteUsuario(id);
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

  return (
    <div className="section">
      <h2>Usuarios</h2>
      <div className="layout-cols">
        <form className="card" onSubmit={handleSubmit}>
          <h3>{editId ? `Editar Usuario #${editId}` : 'Nuevo Usuario'}</h3>
          <div className="field">
            <label>Nombre</label>
            <input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          </div>
          <div className="field">
            <label>Apellido</label>
            <input value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} required />
          </div>
          <div className="field">
            <label>Correo</label>
            <input type="email" value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} required />
          </div>
          <div className="field">
            <label>Contraseña {editId && <span className="hint">(dejar vacío = no cambiar)</span>}</label>
            <input
              type="password"
              value={form.passwordHash}
              onChange={(e) => setForm({ ...form, passwordHash: e.target.value })}
              required={!editId}
            />
          </div>
          <div className="field">
            <label>Rol</label>
            <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
              <option value="Administrador">Administrador</option>
              <option value="Tecnico">Tecnico</option>
              <option value="Cliente">Cliente</option>
            </select>
          </div>
          <div className="field check">
            <label>
              <input
                type="checkbox"
                checked={form.activo}
                onChange={(e) => setForm({ ...form, activo: e.target.checked })}
              />
              Activo
            </label>
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
          <h3>Lista de Usuarios</h3>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Activo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.nombre} {u.apellido}</td>
                  <td>{u.correo}</td>
                  <td><span className="badge rol">{u.rol}</span></td>
                  <td>{u.activo ? '✓' : '✗'}</td>
                  <td>
                    <button onClick={() => handleEdit(u)}>Editar</button>
                    <button className="danger" onClick={() => handleDelete(u.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
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
