'use strict';

// Tipos de canchas permitidos en la BD
const TipoCancha = {
    FUTBOL: 'FUTBOL',
    PADEL: 'PADEL',
    TENIS: 'TENIS',
    BASQUET: 'BASQUET'
};

// Estados posibles físicos de la cancha (RF-12)
const EstadoCancha = {
    DISPONIBLE: 'DISPONIBLE',
    MANTENIMIENTO: 'MANTENIMIENTO',
    INACTIVA: 'INACTIVA'
};

// Estados del ciclo de vida de la reserva
const EstadoReservaCancha = {
    PENDIENTE_PAGO: 'PENDIENTE_PAGO',
    CONFIRMADA: 'CONFIRMADA',
    CANCELADA: 'CANCELADA'
};

const EstadoPago = {
    APROBADO: 'APROBADO',
    RECHAZADO: 'RECHAZADO'
};
/** RF-07 — Ciclo de vida de una reserva de clase. */
const EstadoReservaClase = Object.freeze({
  CONFIRMADA: 'CONFIRMADA',
  CANCELADA: 'CANCELADA',
});

module.exports = {
    TipoCancha,
    EstadoCancha,
    EstadoReservaCancha,
    EstadoPago,
    EstadoReservaClase
};