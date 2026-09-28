import { useState } from 'react';
import * as api from '../api';

export default function Login({ onLogin, onGoToRegistro }) {
  const [form, setForm] = useState({ correo: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api.login(form.correo, form.password);
      // El backend puede devolver { token }, { Token }, { accessToken } o el token directo
      const token =
        data?.token || data?.Token || data?.accessToken || data?.AccessToken;
      if (typeof token === 'string' && token.length > 0) {
        localStorage.setItem('token', token);
        onLogin(token);
      } else {
        setError('No se recibió token. Verifica tus credenciales.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>🎫 Mesa de Ayuda</h2>
        <p className="login-subtitle">Iniciar Sesión</p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Correo</label>
            <input
              type="email"
              value={form.correo}
              onChange={(e) => setForm({ ...form, correo: e.target.value })}
              placeholder="usuario@ejemplo.com"
              required
            />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn-primary btn-full" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="auth-switch">
          ¿No tienes cuenta?{' '}
          <button type="button" className="link-btn" onClick={onGoToRegistro}>
            Crear cuenta
          </button>
        </p>
      </div>
    </div>
  );
}
