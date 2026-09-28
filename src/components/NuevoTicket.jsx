import { useState, useEffect } from 'react';
import * as api from '../api';

const EMPTY = {
  titulo: '',
  descripcion: '',
  estado: 'Abierto',
  prioridad: 'Media',
};

// El backend puede nombrar el id del usuario de distintas formas según el endpoint
const getUserId = (u) => u?.id ?? u?.usuarioId ?? u?.Id ?? u?.ID ?? u?.userId ?? null;

export default function NuevoTicket({ onGoToTickets }) {
  const [form, setForm] = useState(EMPTY);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);

  const currentUser = api.getCurrentUser();
  const isCliente = currentUser?.rol === 'Cliente';

  // Se guarda el índice del array seleccionado (siempre único), no el id crudo del backend
  const [clienteSel, setClienteSel] = useState('');
  const [tecnicoSel, setTecnicoSel] = useState('');
  const [clienteIdManual, setClienteIdManual] = useState('');
  const [tecnicoIdManual, setTecnicoIdManual] = useState('');

  useEffect(() => {
    if (isCliente) {
      // Un cliente no necesita ver la lista de usuarios: el ticket se crea para sí mismo
      setLoadingUsers(false);
      return;
    }
    api.getUsuarios()
      .then((data) => setUsuarios(Array.isArray(data) ? data : []))
      .catch(() => setUsuarios([]))
      .finally(() => setLoadingUsers(false));
  }, [isCliente]);

  const clientes = usuarios.filter((u) => u.rol === 'Cliente' && u.activo !== false);
  const tecnicos = usuarios.filter((u) => (u.rol === 'Tecnico' || u.rol === 'Administrador') && u.activo !== false);

  const resetSelections = () => {
    setClienteSel('');
    setTecnicoSel('');
    setClienteIdManual('');
    setTecnicoIdManual('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Resolver clienteId: un cliente logueado crea el ticket para sí mismo
    let clienteIdNum;
    let tecnicoIdNum = null;
    if (isCliente) {
      clienteIdNum = currentUser?.id;
      if (clienteIdNum == null || Number.isNaN(Number(clienteIdNum))) {
        setError('No se pudo determinar tu ID de usuario a partir de la sesión. Vuelve a iniciar sesión.');
        return;
      }
      clienteIdNum = Number(clienteIdNum);
    } else if (clientes.length > 0) {
      if (clienteSel === '') {
        setError('Selecciona un cliente.');
        return;
      }
      const clienteObj = clientes[Number(clienteSel)];
      const rawId = getUserId(clienteObj);
      clienteIdNum = Number(rawId);
      if (rawId == null || Number.isNaN(clienteIdNum)) {
        setError('No se pudo obtener el ID del cliente seleccionado (revisa la respuesta de /api/Usuario).');
        return;
      }
    } else {
      clienteIdNum = Number(clienteIdManual);
      if (clienteIdManual === '' || Number.isNaN(clienteIdNum)) {
        setError('Ingresa un ID de cliente válido.');
        return;
      }
    }

    // Resolver tecnicoId (opcional): un cliente no elige técnico, el ticket queda sin asignar
    if (!isCliente) {
      if (tecnicos.length > 0) {
        if (tecnicoSel !== '') {
          const tecnicoObj = tecnicos[Number(tecnicoSel)];
          const rawId = getUserId(tecnicoObj);
          tecnicoIdNum = Number(rawId);
          if (rawId == null || Number.isNaN(tecnicoIdNum)) {
            setError('No se pudo obtener el ID del técnico seleccionado (revisa la respuesta de /api/Usuario).');
            return;
          }
        }
      } else if (tecnicoIdManual !== '') {
        tecnicoIdNum = Number(tecnicoIdManual);
        if (Number.isNaN(tecnicoIdNum)) {
          setError('Ingresa un ID de técnico válido.');
          return;
        }
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
      const result = await api.createTicket(payload);
      setCreated(result);
      setForm(EMPTY);
      resetSelections();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNuevo = () => setCreated(null);

  if (created) {
    return (
      <div className="section">
        <h2>Nuevo Ticket</h2>
        <div className="ticket-creado-wrap">
          <div className="card ticket-creado-card">
            <div className="ticket-creado-icon">✅</div>
            <h3>Ticket creado exitosamente</h3>
            {created.id && (
              <p className="ticket-creado-id">Ticket <strong>#{created.id}</strong></p>
            )}
            <div className="ticket-creado-detalle">
              <div className="detalle-row">
                <span className="detalle-label">Título</span>
                <span>{created.titulo}</span>
              </div>
              {created.descripcion && (
                <div className="detalle-row">
                  <span className="detalle-label">Descripción</span>
                  <span>{created.descripcion}</span>
                </div>
              )}
              <div className="detalle-row">
                <span className="detalle-label">Estado</span>
                <span className={`badge estado-abierto`}>{created.estado ?? 'Abierto'}</span>
              </div>
              <div className="detalle-row">
                <span className="detalle-label">Prioridad</span>
                <span className={`badge prio-${(created.prioridad ?? 'Media').toLowerCase()}`}>
                  {created.prioridad ?? 'Media'}
                </span>
              </div>
            </div>
            <div className="btn-row ticket-creado-btns">
              <button className="btn-primary" onClick={handleNuevo}>
                Crear otro ticket
              </button>
              <button className="btn-secondary" onClick={onGoToTickets}>
                Ver todos los tickets
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <h2>Nuevo Ticket</h2>
      <div className="nuevo-ticket-wrap">
        <form className="card nuevo-ticket-card" onSubmit={handleSubmit}>
          <div className="nuevo-ticket-grid">
            {/* Título */}
            <div className="field nuevo-ticket-full">
              <label>Título <span className="req">*</span></label>
              <input
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Describe brevemente el problema"
                required
              />
            </div>

            {/* Descripción */}
            <div className="field nuevo-ticket-full">
              <label>Descripción</label>
              <textarea
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Detalla el problema, pasos para reproducirlo, etc."
                rows={5}
              />
            </div>

            {/* Cliente */}
            {isCliente ? (
              <div className="field">
                <label>Cliente</label>
                <input value={`${currentUser?.nombre ?? 'Tú'} (tú)`} disabled />
              </div>
            ) : (
              <div className="field">
                <label>Cliente <span className="req">*</span></label>
                {loadingUsers ? (
                  <select disabled><option>Cargando...</option></select>
                ) : clientes.length > 0 ? (
                  <select
                    value={clienteSel}
                    onChange={(e) => setClienteSel(e.target.value)}
                    required
                  >
                    <option value="">— Seleccionar cliente —</option>
                    {clientes.map((u, idx) => (
                      <option key={idx} value={idx}>
                        {u.nombre} {u.apellido} ({u.correo})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    min="1"
                    value={clienteIdManual}
                    onChange={(e) => setClienteIdManual(e.target.value)}
                    placeholder="ID del cliente"
                    required
                  />
                )}
              </div>
            )}

            {/* Técnico */}
            {!isCliente && (
              <div className="field">
                <label>Técnico asignado <span className="hint">(opcional)</span></label>
                {loadingUsers ? (
                  <select disabled><option>Cargando...</option></select>
                ) : tecnicos.length > 0 ? (
                  <select
                    value={tecnicoSel}
                    onChange={(e) => setTecnicoSel(e.target.value)}
                  >
                    <option value="">— Sin asignar —</option>
                    {tecnicos.map((u, idx) => (
                      <option key={idx} value={idx}>
                        {u.nombre} {u.apellido} ({u.rol})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    min="1"
                    value={tecnicoIdManual}
                    onChange={(e) => setTecnicoIdManual(e.target.value)}
                    placeholder="ID del técnico"
                  />
                )}
              </div>
            )}

            {/* Estado: un cliente no puede elegirlo, todo ticket nuevo nace 'Abierto' */}
            {!isCliente && (
              <div className="field">
                <label>Estado</label>
                <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
                  <option value="Abierto">Abierto</option>
                  <option value="EnProceso">En Proceso</option>
                  <option value="Resuelto">Resuelto</option>
                  <option value="Cerrado">Cerrado</option>
                </select>
              </div>
            )}

            {/* Prioridad */}
            <div className="field">
              <label>Prioridad</label>
              <div className="prio-options">
                {['Critica', 'Alta', 'Media', 'Baja'].map((p) => (
                  <label key={p} className={`prio-option ${form.prioridad === p ? 'selected' : ''} prio-opt-${p.toLowerCase()}`}>
                    <input
                      type="radio"
                      name="prioridad"
                      value={p}
                      checked={form.prioridad === p}
                      onChange={() => setForm({ ...form, prioridad: p })}
                    />
                    {p}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {error && <p className="error">{error}</p>}

          <div className="btn-row nuevo-ticket-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creando ticket...' : '🎫 Crear Ticket'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => { setForm(EMPTY); resetSelections(); }}
              disabled={loading}
            >
              Limpiar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

