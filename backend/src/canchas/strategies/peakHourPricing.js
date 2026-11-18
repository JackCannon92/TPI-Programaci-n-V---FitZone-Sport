'use strict';

/**
 * RF-11 · Estrategia: recargo por horario pico.
 *
 * El horario pico es de 19:00 a 21:00 (el turno de las 21:00 ya no es pico).
 * esHorarioPico también la usa la grilla de disponibilidad, así la regla vive
 * en un solo lugar: antes el 19/21 estaba escrito a mano en canchas.service.
 *
 * La hora se toma del reloj del servidor, igual que el resto del módulo de
 * canchas (la grilla arma los turnos con setHours).
 */
const HORA_PICO_DESDE = 19;
const HORA_PICO_HASTA = 21;
const RECARGO_PICO = 0.20;

function esHorarioPico(fecha) {
  const hora = new Date(fecha).getHours();
  return hora >= HORA_PICO_DESDE && hora < HORA_PICO_HASTA;
}

function crearRecargoHorarioPico({ porcentaje = RECARGO_PICO } = {}) {
  return {
    nombre: `Recargo horario pico (${Math.round(porcentaje * 100)}%)`,
    aplica: (ctx) => esHorarioPico(ctx.inicio),
    aplicar: (precio) => precio * (1 + porcentaje),
  };
}

module.exports = { crearRecargoHorarioPico, esHorarioPico, RECARGO_PICO };
