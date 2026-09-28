import { useMemo, useState } from 'react';
import Login from './components/Login';
import Registro from './components/Registro';
import Usuarios from './components/Usuarios';
import Tickets from './components/Tickets';
import NuevoTicket from './components/NuevoTicket';
import Seguimiento from './components/Seguimiento';
import { getCurrentUser } from './api';
import './App.css';

const TABS = ['Nuevo Ticket', 'Tickets', 'Seguimiento', 'Usuarios'];

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [tab, setTab] = useState('Tickets');
  const [authView, setAuthView] = useState('login');

  const user = useMemo(() => (token ? getCurrentUser() : null), [token]);

  const handleLogin = (t) => setToken(t);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setAuthView('login');
  };

  if (!token) {
    if (authView === 'registro')
      return <Registro onGoToLogin={() => setAuthView('login')} />;
    return <Login onLogin={handleLogin} onGoToRegistro={() => setAuthView('registro')} />;
  }

  return (
    <div className="app">
      <header className="navbar">
        <span className="brand">🎫 Mesa de Ayuda</span>
        <nav>
          {TABS.map((t) => (
            <button
              key={t}
              className={tab === t ? 'active' : ''}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </nav>
        {user && (
          <span className="user-info">
            {user.nombre && <strong>{user.nombre}</strong>}
            {user.rol && <span className="user-role">{user.rol}</span>}
          </span>
        )}
        <button className="btn-logout" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </header>
      <main>
        {tab === 'Nuevo Ticket' && <NuevoTicket onGoToTickets={() => setTab('Tickets')} />}
        {tab === 'Tickets' && <Tickets />}
        {tab === 'Seguimiento' && <Seguimiento />}
        {tab === 'Usuarios' && <Usuarios />}
      </main>
    </div>
  );
}

export default App;

