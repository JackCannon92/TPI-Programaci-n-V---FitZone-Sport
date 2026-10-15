'use strict';

/**
 * PUERTO del repositorio de Membresías — patrón REPOSITORY (Fowler, PoEAA).
 *
 * Junto con Reserva, es uno de los dos agregados con reglas ricas (vencimiento,
 * renovación, suspensión), y por eso la cátedra pide un repositorio de dominio
 * propio para él. El resto de las entidades sigue usando los modelos directo.
 *
 * Dos implementaciones del mismo contrato:
 *   - membresias.sequelize.js → la real, contra PostgreSQL / Supabase.
 *   - membresias.memoria.js   → un Map en memoria, para los tests.
 *
 * Devuelve objetos planos con los MISMOS nombres de campo que ya devolvía la
 * API (usuario_id, fecha_vencimiento...), para no cambiar el contrato con el
 * frontend: esto es un refactoring, no un cambio funcional.
 *
 * @typedef {Object} Membresia
 * @property {string} id
 * @property {string} usuario_id
 * @property {'MENSUAL'|'TRIMESTRAL'|'ANUAL'} plan
 * @property {'ACTIVO'|'VENCIDO'|'SUSPENDIDO'} estado
 * @property {string|Date} fecha_inicio
 * @property {string|Date} fecha_vencimiento
 * @property {boolean} renovacion_automatica
 *
 * @typedef {Object} MembresiasRepository
 * @property {(usuarioId: string) => Promise<Membresia|null>} deUsuario
 * @property {(datos: Omit<Membresia, 'id'>) => Promise<Membresia>} registrar
 *           Lanza MembresiaDuplicadaError si el usuario ya tiene una.
 * @property {(membresia: Membresia) => Promise<Membresia>} guardar
 *           Persiste plan, estado, fechas y renovación de una membresía existente.
 */

const { AppError } = require('../../../common/app-error');

/** Un socio tiene una sola membresía (relación 1 a 1, índice único en usuario_id). */
class MembresiaDuplicadaError extends AppError {
  constructor(usuarioId) {
    super('El usuario ya tiene una membresía. Usá la renovación.', 409);
    this.name = 'MembresiaDuplicadaError';
    this.usuarioId = usuarioId;
  }
}

module.exports = { MembresiaDuplicadaError };
