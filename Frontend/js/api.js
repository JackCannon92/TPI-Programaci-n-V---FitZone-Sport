'use strict';

/**
 * Cliente de la API de FitZone Sports.
 * Todas las pantallas hablan con el backend a través de este archivo
 * (capa de servicio del frontend): si cambia una ruta, se cambia acá.
 * Cambiá API_BASE_URL si el backend corre en otro host o puerto.
 */
const API_BASE_URL = 'http://localhost:3000/api';

async function apiFetch(path, opciones = {}) {
  let resp;
  try {
    resp = await fetch(`${API_BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...opciones,
    });
  } catch (_) {
    const error = new Error('No hay conexión con el servidor. Revisá que el backend esté corriendo (npm start).');
    error.status = 0;
    throw error;
  }

  let cuerpo = null;
  try {
    cuerpo = await resp.json();
  } catch (_) {
    // respuesta sin JSON (ej. 204 No Content)
  }

  if (!resp.ok) {
    let mensaje = (cuerpo && (cuerpo.error || cuerpo.mensaje)) || `Error HTTP ${resp.status}`;
    if (cuerpo && Array.isArray(cuerpo.detalles) && cuerpo.detalles.length) {
      mensaje += `: ${cuerpo.detalles.map((d) => `${d.path || d.param || ''} ${d.msg || ''}`.trim()).join(', ')}`;
    }
    const error = new Error(mensaje);
    error.status = resp.status;
    error.detalle = cuerpo;
    throw error;
  }
  return cuerpo;
}

const post = (path, body) => apiFetch(path, { method: 'POST', body: JSON.stringify(body || {}) });
const patch = (path, body) => apiFetch(path, { method: 'PATCH', body: JSON.stringify(body || {}) });

const api = {
  // Usuarios y membresías
  listarUsuarios: () => apiFetch('/usuarios'),
  obtenerUsuario: (id) => apiFetch(`/usuarios/${id}`),
  registrarUsuario: (usuario, membresia) => post('/usuarios', { usuario, membresia }),
  obtenerMembresia: (usuarioId) => apiFetch(`/membresias/${usuarioId}`),

  // Sedes
  listarSedes: () => apiFetch('/sedes'),
  crearSede: (datos) => post('/sedes', datos),

  // Canchas (RF-09 a RF-12)
  canchasDeSede: (sedeId) => apiFetch(`/canchas/sede/${sedeId}`),
  obtenerCancha: (id) => apiFetch(`/canchas/${id}`),
  crearCancha: (datos) => post('/canchas', datos),
  cambiarEstadoCancha: (id, estado) => patch(`/canchas/${id}/estado`, { estado }),
  disponibilidad: (canchaId, fecha) => apiFetch(`/canchas/${canchaId}/disponibilidad?fecha=${fecha}`),
  cotizar: (canchaId, usuarioId, inicioISO) =>
    apiFetch(`/canchas/${canchaId}/precio?usuarioId=${usuarioId}&inicio=${encodeURIComponent(inicioISO)}`),
  reservarCancha: (canchaId, usuarioId, fechaHoraInicio) => post('/canchas/reservas', { canchaId, usuarioId, fechaHoraInicio }),
  reservasCanchaDeUsuario: (usuarioId) => apiFetch(`/canchas/reservas/usuario/${usuarioId}`),
  cancelarReservaCancha: (id) => patch(`/canchas/reservas/${id}/cancelar`),
  qrReservaCancha: (id) => apiFetch(`/canchas/reservas/${id}/qr`),

  // Pagos (RF-13, RF-14)
  pagarReserva: (reservaId, usuarioId, tarjeta) => post('/pagos', { reservaId, usuarioId, tarjeta }),
  pagosDeUsuario: (usuarioId) => apiFetch(`/pagos/usuario/${usuarioId}`),
  urlComprobante: (pagoId) => `${API_BASE_URL}/pagos/${pagoId}/comprobante`,

  // Clases (RF-06 a RF-08)
  listarClases: (sedeId) => apiFetch(`/clases${sedeId ? `?sedeId=${sedeId}` : ''}`),
  obtenerClase: (id) => apiFetch(`/clases/${id}`),
  crearClase: (datos) => post('/clases', datos),
  reservarClase: (claseId, usuarioId) => post('/clases/reservas', { claseId, usuarioId }),
  reservasClaseDeUsuario: (usuarioId) => apiFetch(`/clases/reservas/usuario/${usuarioId}`),
  cancelarReservaClase: (id) => patch(`/clases/reservas/${id}/cancelar`),
  anotarListaEspera: (claseId, usuarioId) => post('/clases/lista-espera', { claseId, usuarioId }),
  listaEspera: (claseId) => apiFetch(`/clases/${claseId}/lista-espera`),
  qrAsistencia: (reservaId) => apiFetch(`/clases/reservas/${reservaId}/qr`),
  registrarAsistencia: (token) => post('/clases/asistencia', { token }),

  // Acceso (RF-04, RF-05 y QR del ADR-010)
  qrSocio: (usuarioId) => apiFetch(`/acceso/qr/${usuarioId}`),
  qrOffline: (usuarioId) => apiFetch(`/acceso/qr-offline/${usuarioId}`),
  ingreso: (token, sedeId) => post('/acceso/ingreso', { token, sedeId }),
  ingresoConReserva: (token, sedeId) => post('/acceso/ingreso-reserva', { token, sedeId }),
  egreso: (usuarioId, sedeId) => post('/acceso/egreso', { usuarioId, sedeId }),
  validarOffline: (token) => post('/acceso/validar-offline', { token }),
  aforoSede: (sedeId) => apiFetch(`/acceso/aforo/${sedeId}`),
  presentes: (sedeId) => apiFetch(`/acceso/presentes/${sedeId}`),

  // Verificación pública del comprobante (QR 4): el QR trae la URL completa.
  verificarUrl: async (url) => {
    const resp = await fetch(url);
    return resp.json();
  },
};
