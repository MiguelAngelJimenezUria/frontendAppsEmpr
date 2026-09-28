import { useState, useEffect } from 'react';
import * as api from '../api';

const estadoClass = (e) => {
  const map = { Abierto: 'estado-abierto', EnProceso: 'estado-enproceso', Resuelto: 'estado-resuelto', Cerrado: 'estado-cerrado' };
  return map[e] || '';
};
const prioClass = (p) => {
  const map = { Critica: 'prio-critica', Alta: 'prio-alta', Media: 'prio-media', Baja: 'prio-baja' };
  return map[p] || '';
};

export default function TicketDetalle({ ticketId, onBack }) {
  const [ticket, setTicket] = useState(null);
  const [seguimientos, setSeguimientos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reporteLoading, setReporteLoading] = useState(false);
  const [comentario, setComentario] = useState('');
  const [comentarioError, setComentarioError] = useState('');
  const [comentarioLoading, setComentarioLoading] = useState(false);

  const currentUser = api.getCurrentUser();
  const puedeComentar = currentUser?.rol === 'Tecnico' || currentUser?.rol === 'Administrador';

  const loadSeguimientos = () =>
    api.getMisSeguimientos()
      .then((segs) => setSeguimientos((Array.isArray(segs) ? segs : []).filter((s) => s.ticketId === ticketId)))
      .catch(() => {});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    Promise.all([
      api.getTicket(ticketId),
      api.getMisSeguimientos().catch(() => []),
      api.getUsuarios().catch(() => []),
    ])
      .then(([t, segs, users]) => {
        if (cancelled) return;
        setTicket(t);
        setSeguimientos((Array.isArray(segs) ? segs : []).filter((s) => s.ticketId === ticketId));
        setUsuarios(Array.isArray(users) ? users : []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ticketId]);

  const findUsuario = (id) => usuarios.find((u) => u.id === id);
  const cliente = ticket ? findUsuario(ticket.clienteId) : null;
  const tecnico = ticket ? findUsuario(ticket.tecnicoId) : null;

  const handleReporte = async () => {
    setReporteLoading(true);
    setError('');
    try {
      await api.getTicketReporte(ticketId);
    } catch (err) {
      setError(err.message);
    } finally {
      setReporteLoading(false);
    }
  };

  const handleAddComentario = async (e) => {
    e.preventDefault();
    setComentarioError('');

    if (!comentario.trim()) {
      setComentarioError('Escribe un comentario.');
      return;
    }
    if (currentUser?.id == null) {
      setComentarioError('No se pudo determinar tu ID de usuario a partir de la sesión. Vuelve a iniciar sesión.');
      return;
    }

    setComentarioLoading(true);
    try {
      await api.createSeguimiento({
        ticketId,
        usuarioId: currentUser.id,
        comentario: comentario.trim(),
      });
      setComentario('');
      await loadSeguimientos();
    } catch (err) {
      setComentarioError(err.message);
    } finally {
      setComentarioLoading(false);
    }
  };

  return (
    <div className="section">
      <h2>Detalle del Ticket</h2>
      <div className="btn-row" style={{ marginBottom: '1rem' }}>
        <button className="btn-secondary" onClick={onBack}>← Volver a la lista</button>
      </div>

      {loading && <p>Cargando...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && ticket && (
        <div className="card">
          <div className="ticket-creado-detalle">
            <div className="detalle-row">
              <span className="detalle-label">Título</span>
              <span>#{ticket.id} — {ticket.titulo}</span>
            </div>
            <div className="detalle-row">
              <span className="detalle-label">Descripción</span>
              <span>{ticket.descripcion || '—'}</span>
            </div>
            <div className="detalle-row">
              <span className="detalle-label">Estado</span>
              <span className={`badge ${estadoClass(ticket.estado)}`}>{ticket.estado}</span>
            </div>
            <div className="detalle-row">
              <span className="detalle-label">Prioridad</span>
              <span className={`badge ${prioClass(ticket.prioridad)}`}>{ticket.prioridad}</span>
            </div>
            <div className="detalle-row">
              <span className="detalle-label">Cliente</span>
              <span>{cliente ? `${cliente.nombre} ${cliente.apellido ?? ''}`.trim() : (ticket.clienteId ?? '—')}</span>
            </div>
            <div className="detalle-row">
              <span className="detalle-label">Técnico</span>
              <span>{tecnico ? `${tecnico.nombre} ${tecnico.apellido ?? ''}`.trim() : (ticket.tecnicoId ?? 'Sin asignar')}</span>
            </div>
            <div className="detalle-row">
              <span className="detalle-label">Creado</span>
              <span>{ticket.fechaCreacion ? new Date(ticket.fechaCreacion).toLocaleString('es-PE') : '—'}</span>
            </div>
            <div className="detalle-row">
              <span className="detalle-label">Cierre</span>
              <span>{ticket.fechaCierre ? new Date(ticket.fechaCierre).toLocaleString('es-PE') : '—'}</span>
            </div>
          </div>
          <div className="btn-row">
            <button onClick={handleReporte} disabled={reporteLoading}>
              {reporteLoading ? 'Descargando...' : 'Descargar reporte'}
            </button>
          </div>
        </div>
      )}

      {!loading && ticket && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h3>Seguimientos</h3>
          {seguimientos.length === 0 && <p className="empty-msg">Sin seguimientos registrados.</p>}
          {seguimientos.length > 0 && (
            <div className="reporte-seguimientos">
              {seguimientos.map((s) => {
                const autor = findUsuario(s.usuarioId);
                return (
                  <div key={s.id} className="seguimiento-item">
                    <div className="seguimiento-meta">
                      <span>{autor ? `${autor.nombre} ${autor.apellido ?? ''}`.trim() : s.usuarioId}</span>
                      <span>{s.fecha ? new Date(s.fecha).toLocaleString('es-PE') : ''}</span>
                    </div>
                    <p>{s.comentario}</p>
                  </div>
                );
              })}
            </div>
          )}

          {puedeComentar && (
            <form className="field" style={{ marginTop: '1rem' }} onSubmit={handleAddComentario}>
              <label>Agregar comentario</label>
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Escribe una actualización para este ticket..."
                rows={3}
              />
              {comentarioError && <p className="error">{comentarioError}</p>}
              <div className="btn-row">
                <button type="submit" className="btn-primary" disabled={comentarioLoading}>
                  {comentarioLoading ? 'Enviando...' : 'Agregar comentario'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
