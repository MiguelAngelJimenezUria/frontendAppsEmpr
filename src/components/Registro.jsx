import { useState } from 'react';
import * as api from '../api';

const EMPTY = {
  nombre: '',
  apellido: '',
  correo: '',
  passwordHash: '',
  confirmar: '',
};

export default function Registro({ onGoToLogin }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.passwordHash.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (form.passwordHash !== form.confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await api.createUsuario({
        nombre: form.nombre,
        apellido: form.apellido,
        correo: form.correo,
        passwordHash: form.passwordHash,
        rol: 'Cliente',
        activo: true,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="login-container">
        <div className="login-card registro-success">
          <div className="registro-success-icon">🎉</div>
          <h2>¡Cuenta creada!</h2>
          <p className="login-subtitle">Tu cuenta fue registrada exitosamente.</p>
          <button className="btn-primary btn-full" onClick={onGoToLogin}>
            Iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card login-card--wide">
        <h2>🎫 Mesa de Ayuda</h2>
        <p className="login-subtitle">Crear cuenta</p>

        <form onSubmit={handleSubmit}>
          <div className="registro-grid">
            <div className="field">
              <label>Nombre</label>
              <input
                value={form.nombre}
                onChange={set('nombre')}
                placeholder="Juan"
                required
              />
            </div>
            <div className="field">
              <label>Apellido</label>
              <input
                value={form.apellido}
                onChange={set('apellido')}
                placeholder="Pérez"
                required
              />
            </div>
          </div>

          <div className="field">
            <label>Correo electrónico</label>
            <input
              type="email"
              value={form.correo}
              onChange={set('correo')}
              placeholder="usuario@ejemplo.com"
              required
            />
          </div>

          <div className="registro-grid">
            <div className="field">
              <label>Contraseña</label>
              <input
                type="password"
                value={form.passwordHash}
                onChange={set('passwordHash')}
                placeholder="Mín. 6 caracteres"
                required
              />
            </div>
            <div className="field">
              <label>Confirmar contraseña</label>
              <input
                type="password"
                value={form.confirmar}
                onChange={set('confirmar')}
                placeholder="Repite la contraseña"
                required
              />
            </div>
          </div>

          {error && <p className="error">{error}</p>}

          <button type="submit" className="btn-primary btn-full" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="auth-switch">
          ¿Ya tienes cuenta?{' '}
          <button type="button" className="link-btn" onClick={onGoToLogin}>
            Iniciar sesión
          </button>
        </p>
      </div>
    </div>
  );
}
