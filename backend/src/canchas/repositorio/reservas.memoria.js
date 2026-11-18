'use strict';

/**
 * ADAPTADOR en memoria del repositorio de Reservas de cancha.
 * Contrato: ver reservas.puerto.js.
 *
 * Sirve para probar las reglas del dominio en milisegundos, sin base de datos
 * ni red. Imita lo que hace PostgreSQL con el índice único parcial: dos
 * reservas activas en la misma cancha y el mismo horario no pueden convivir.
 */
const { randomUUID } = require('node:crypto');
const { ESTADOS_QUE_OCUPAN, TurnoYaReservadoError } = require('./reservas.puerto');

const copiar = (reserva) => (reserva ? structuredClone(reserva) : null);

/** @returns {import('./reservas.puerto').ReservasRepository} */
function crearReservasRepositoryMemoria() {
  /** @type {Map<string, import('./reservas.puerto').Reserva>} */
  const reservas = new Map();

  function chocaConOtra(candidata) {
    return [...reservas.values()].some((r) =>
      r.id !== candidata.id &&
      r.canchaId === candidata.canchaId &&
      r.fechaHoraInicio.getTime() === candidata.fechaHoraInicio.getTime() &&
      ESTADOS_QUE_OCUPAN.includes(r.estado) &&
      ESTADOS_QUE_OCUPAN.includes(candidata.estado));
  }

  async function porId(id) {
    return copiar(reservas.get(id));
  }

  async function deUsuario(usuarioId) {
    return [...reservas.values()]
      .filter((r) => r.usuarioId === usuarioId)
      .sort((a, b) => b.fechaHoraInicio - a.fechaHoraInicio)
      .map(copiar);
  }

  async function turnosOcupados(canchaId, desde, hasta) {
    return [...reservas.values()]
      .filter((r) => r.canchaId === canchaId &&
        ESTADOS_QUE_OCUPAN.includes(r.estado) &&
        r.fechaHoraInicio >= desde && r.fechaHoraInicio <= hasta)
      .map((r) => new Date(r.fechaHoraInicio));
  }

  async function registrar(datos) {
    const nueva = {
      ...structuredClone(datos),
      id: randomUUID(),
      fechaHoraInicio: new Date(datos.fechaHoraInicio),
      fechaHoraFin: new Date(datos.fechaHoraFin),
      precioFinal: Number(datos.precioFinal),
      estado: 'PENDIENTE_PAGO',
    };
    if (chocaConOtra(nueva)) throw new TurnoYaReservadoError(nueva.canchaId, nueva.fechaHoraInicio);
    reservas.set(nueva.id, nueva);
    return copiar(nueva);
  }

  async function cambiarEstado(id, estado) {
    const actual = reservas.get(id);
    if (!actual) return null;
    const cambiada = { ...actual, estado };
    if (chocaConOtra(cambiada)) throw new TurnoYaReservadoError(actual.canchaId, actual.fechaHoraInicio);
    reservas.set(id, cambiada);
    return copiar(cambiada);
  }

  return { porId, deUsuario, turnosOcupados, registrar, cambiarEstado };
}

module.exports = { crearReservasRepositoryMemoria };
