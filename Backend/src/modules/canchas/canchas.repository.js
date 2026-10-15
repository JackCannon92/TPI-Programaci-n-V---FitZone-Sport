'use strict';

const { Op, UniqueConstraintError } = require('sequelize');
const { Cancha } = require('./cancha.model');
const { ReservaCancha } = require('./reserva-cancha.model');
const { EstadoReservaCancha } = require('../../common/enums');

/**
 * Patron Repository (ADR-003) — BookingRepository.
 *
 * Unico lugar del modulo Canchas que habla con Sequelize. El service trabaja
 * contra estas funciones (findCancha, turnosOcupados, crearReserva, ...) y no
 * contra los modelos: si mañana se cambia de ORM o de motor, se toca este
 * archivo y nada mas. Ademas permite testear el service con un repository
 * en memoria, sin base de datos.
 */
function crearBookingRepository() {
  function findCancha(id) {
    return Cancha.findByPk(id);
  }

  function findCanchasPorSede(sedeId) {
    return Cancha.findAll({ where: { sedeId }, order: [['nombre', 'ASC']] });
  }

  function crearCancha(datos) {
    return Cancha.create(datos);
  }

  async function turnosOcupados(canchaId, desde, hasta) {
    const reservas = await ReservaCancha.findAll({
      where: {
        canchaId,
        fechaHoraInicio: { [Op.gte]: desde, [Op.lt]: hasta },
        estado: { [Op.in]: [EstadoReservaCancha.PENDIENTE_PAGO, EstadoReservaCancha.CONFIRMADA] },
      },
    });
    return reservas.map((r) => new Date(r.fechaHoraInicio).getTime());
  }

  /**
   * RN-02: no hace falta una transaccion explicita porque es un unico
   * INSERT atomico; quien decide el ganador es el indice unico parcial
   * `uq_reserva_cancha_turno_activo` de la base de datos. Si dos requests
   * llegan en el mismo segundo, la segunda insercion viola la unicidad y
   * devolvemos `null` para que el service responda 409.
   */
  async function crearReserva(datos) {
    try {
      return await ReservaCancha.create(datos);
    } catch (e) {
      if (e instanceof UniqueConstraintError) return null;
      throw e;
    }
  }

  function findReserva(id) {
    return ReservaCancha.findByPk(id);
  }

  function findReservasPorUsuario(usuarioId) {
    return ReservaCancha.findAll({ where: { usuarioId }, order: [['fechaHoraInicio', 'DESC']] });
  }

  async function actualizarEstadoReserva(id, estado) {
    const r = await ReservaCancha.findByPk(id);
    if (!r) return null;
    r.estado = estado;
    await r.save();
    return r;
  }

  return {
    findCancha, findCanchasPorSede, crearCancha,
    turnosOcupados, crearReserva, findReserva, findReservasPorUsuario, actualizarEstadoReserva,
  };
}

module.exports = { crearBookingRepository };
