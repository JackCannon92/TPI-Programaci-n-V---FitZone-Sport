'use strict';

/**
 * PUERTO del repositorio de Reservas de cancha — patrón REPOSITORY (Fowler, PoEAA).
 *
 * Lo define el dominio según lo que necesita, y habla el idioma del negocio:
 * "turnos ocupados", "registrar una reserva", nunca findAll, where u Op.between.
 * Ninguna firma menciona Sequelize, SQL ni transacciones.
 *
 * Hay dos implementaciones (adaptadores) de este mismo contrato:
 *   - reservas.sequelize.js → la real, contra PostgreSQL / Supabase.
 *   - reservas.memoria.js   → un Map en memoria, para probar el dominio sin base.
 *
 * Qué devuelve: objetos planos del dominio (no instancias del ORM). Por eso
 * nadie fuera del adaptador puede hacer reserva.save(): los cambios pasan por
 * el repositorio.
 *
 * @typedef {Object} Reserva
 * @property {string} id
 * @property {string} canchaId
 * @property {string} usuarioId
 * @property {Date}   fechaHoraInicio
 * @property {Date}   fechaHoraFin
 * @property {number} precioFinal
 * @property {{ concepto: string, monto: number }[]} detallePrecio
 * @property {'PENDIENTE_PAGO'|'CONFIRMADA'|'CANCELADA'} estado
 *
 * @typedef {Object} ReservasRepository
 * @property {(id: string) => Promise<Reserva|null>} porId
 * @property {(usuarioId: string) => Promise<Reserva[]>} deUsuario
 * @property {(canchaId: string, desde: Date, hasta: Date) => Promise<Date[]>} turnosOcupados
 *           Inicios de los turnos que ocupan la cancha (pendientes de pago o confirmados).
 * @property {(datos: Omit<Reserva, 'id'|'estado'>) => Promise<Reserva>} registrar
 *           Lanza TurnoYaReservadoError si el turno ya está tomado (RN-02).
 * @property {(id: string, estado: string) => Promise<Reserva|null>} cambiarEstado
 */

const { AppError } = require('../../../common/app-error');
const { EstadoReservaCancha } = require('../../../common/enums');

/** Estados que bloquean el turno (los mismos del índice único parcial de la base). */
const ESTADOS_QUE_OCUPAN = Object.freeze([
  EstadoReservaCancha.PENDIENTE_PAGO,
  EstadoReservaCancha.CONFIRMADA,
]);

/**
 * RN-02 dicho en el idioma del dominio. Quien gana la carrera entre dos socios
 * lo decide la base (índice único uq_reserva_cancha_turno_activo); el
 * repositorio solo traduce el error de infraestructura a este.
 */
class TurnoYaReservadoError extends AppError {
  constructor(canchaId, fechaHoraInicio) {
    super('Ese turno acaba de ser reservado por otro usuario (RN-02).', 409);
    this.name = 'TurnoYaReservadoError';
    this.canchaId = canchaId;
    this.fechaHoraInicio = fechaHoraInicio;
  }
}

module.exports = { ESTADOS_QUE_OCUPAN, TurnoYaReservadoError };
