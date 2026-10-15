'use strict';

/**
 * Cliente mínimo contra la API de FitZone Sports (backend de Franco).
 * Cambiá API_BASE_URL si el backend corre en otro host/puerto.
 */
const API_BASE_URL = 'http://localhost:3000/api';

async function apiFetch(path, opciones = {}) {
  const resp = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opciones,
  });

  let cuerpo = null;
  try {
    cuerpo = await resp.json();
  } catch (_) {
    // respuesta sin JSON (ej. 204 No Content)
  }

  if (!resp.ok) {
    const mensaje = (cuerpo && (cuerpo.error || cuerpo.mensaje)) || `Error HTTP ${resp.status}`;
    const error = new Error(mensaje);
    error.status = resp.status;
    error.detalle = cuerpo;
    throw error;
  }
  return cuerpo;
}

const api = {
  listarUsuarios: () => apiFetch('/usuarios'),
  obtenerUsuario: (id) => apiFetch(`/usuarios/${id}`),
  registrarUsuario: (usuario, membresia) =>
    apiFetch('/usuarios', { method: 'POST', body: JSON.stringify({ usuario, membresia }) }),
  obtenerMembresia: (usuarioId) => apiFetch(`/membresias/${usuarioId}`),
  listarSedes: () => apiFetch('/sedes'),
  aforoSede: (sedeId) => apiFetch(`/acceso/aforo/${sedeId}`),
};
