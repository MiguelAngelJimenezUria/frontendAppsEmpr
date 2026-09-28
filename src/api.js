// Cambia esta URL a la de tu backend
const BASE_URL = 'https://localhost:7232';

function getHeaders() {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

// Decodifica el payload de un JWT (sin validar la firma, solo lectura en cliente)
export function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// Obtiene los datos del usuario logueado (nombre y rol) a partir del token guardado
export function getCurrentUser() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  const payload = parseJwt(token);
  if (!payload) return null;

  const nombre =
    payload.nombre ||
    payload.name ||
    payload.unique_name ||
    payload.given_name ||
    payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
    payload.email ||
    payload.sub ||
    null;

  const rol =
    payload.rol ||
    payload.role ||
    payload.roles ||
    payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
    null;

  const idRaw =
    payload.usuarioId ??
    payload.id ??
    payload.nameid ??
    payload.sub ??
    payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ??
    null;
  const id = idRaw != null && !Number.isNaN(Number(idRaw)) ? Number(idRaw) : null;

  return { id, nombre, rol };
}

async function request(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: getHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `${res.status} ${res.statusText}`);
  }
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  return camelizeKeys(data);
}

// El backend devuelve algunas respuestas en snake_case (ej. usuario_id, fecha_creacion).
// Convertimos recursivamente todas las claves a camelCase para que los componentes
// puedan usar siempre el mismo formato (u.usuarioId, t.fechaCreacion, etc.).
function snakeToCamel(str) {
  return str.replace(/_([a-zA-Z0-9])/g, (_, c) => c.toUpperCase());
}

function camelizeKeys(value) {
  if (Array.isArray(value)) return value.map(camelizeKeys);
  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [snakeToCamel(k), camelizeKeys(v)])
    );
  }
  return value;
}

// Cada entidad expone su clave primaria con un nombre distinto (usuarioId, ticketId,
// seguimientoId). Alias a `id` para que los componentes puedan usarlo de forma uniforme.
function withId(obj, key) {
  if (obj && typeof obj === 'object' && obj.id === undefined && obj[key] !== undefined) {
    return { ...obj, id: obj[key] };
  }
  return obj;
}

function withIdList(list, key) {
  return Array.isArray(list) ? list.map((item) => withId(item, key)) : list;
}

// Auth
export const login = (correo, password) =>
  request('POST', '/api/Auth/login', { correo, password });

// Usuarios
export const getUsuarios = () =>
  request('GET', '/api/Usuario').then((data) => withIdList(data, 'usuarioId'));
export const getUsuario = (id) =>
  request('GET', `/api/Usuario/${id}`).then((u) => withId(u, 'usuarioId'));
export const createUsuario = (data) =>
  request('POST', '/api/Usuario', data).then((u) => withId(u, 'usuarioId'));
export const updateUsuario = (id, data) =>
  request('PUT', `/api/Usuario/${id}`, data).then((u) => withId(u, 'usuarioId'));
export const deleteUsuario = (id) => request('DELETE', `/api/Usuario/${id}`);

// Tickets
export const getTickets = () =>
  request('GET', '/api/Ticket').then((data) => withIdList(data, 'ticketId'));
// Devuelve los tickets según el rol del usuario logueado (clientes ven los suyos,
// técnicos ven los asignados, administradores ven todos).
export const getMisTickets = () =>
  request('GET', '/api/Ticket/mis-tickets').then((data) => withIdList(data, 'ticketId'));
export const getTicket = (id) =>
  request('GET', `/api/Ticket/${id}`).then((t) => withId(t, 'ticketId'));
export const createTicket = (data) =>
  request('POST', '/api/Ticket', data).then((t) => withId(t, 'ticketId'));
export const updateTicket = (id, data) =>
  request('PUT', `/api/Ticket/${id}`, data).then((t) => withId(t, 'ticketId'));
export const deleteTicket = (id) => request('DELETE', `/api/Ticket/${id}`);

// El reporte se descarga como PDF (application/pdf), no como JSON.
export async function getTicketReporte(id) {
  const res = await fetch(`${BASE_URL}/api/Ticket/${id}/reporte`, {
    method: 'GET',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `${res.status} ${res.statusText}`);
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ticket_${id}_reporte.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

// Seguimiento
export const getSeguimientos = () =>
  request('GET', '/api/Seguimiento').then((data) => withIdList(data, 'seguimientoId'));
// Devuelve los seguimientos de los tickets del usuario logueado (clientes ven los de
// sus propios tickets, técnicos ven los de los tickets que tienen asignados).
export const getMisSeguimientos = () =>
  request('GET', '/api/Seguimiento/mis-seguimientos').then((data) => withIdList(data, 'seguimientoId'));
export const getSeguimiento = (id) =>
  request('GET', `/api/Seguimiento/${id}`).then((s) => withId(s, 'seguimientoId'));
export const createSeguimiento = (data) =>
  request('POST', '/api/Seguimiento', data).then((s) => withId(s, 'seguimientoId'));
export const updateSeguimiento = (id, data) =>
  request('PUT', `/api/Seguimiento/${id}`, data).then((s) => withId(s, 'seguimientoId'));
export const deleteSeguimiento = (id) => request('DELETE', `/api/Seguimiento/${id}`);

