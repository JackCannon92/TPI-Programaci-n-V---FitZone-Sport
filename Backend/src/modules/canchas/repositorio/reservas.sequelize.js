'use strict';

/**
 * ADAPTADOR Sequelize del repositorio de Reservas de cancha.
 * Contrato: ver reservas.puerto.js.
 *
 * Es el único archivo del módulo de canchas que conoce a ReservaCanchaModel,
 * a Op y a los errores propios de Sequelize.
 */
const { Op } = require('sequelize');
const { ESTADOS_QUE_OCUPAN, TurnoYaReservadoError } = require('./reservas.puerto');

/** Fila del ORM → objeto plano del dominio. */
function aDominio(fila) {
  if (!fila) return null;
  return {
    id: fila.id,
    canchaId: fila.canchaId,
    usuarioId: fila.usuarioId,
    fechaHoraInicio: new Date(fila.fechaHoraInicio),
    fechaHoraFin: new Date(fila.fechaHoraFin),
    precioFinal: Number(fila.precioFinal),
    detallePrecio: fila.detallePrecio,
    estado: fila.estado,
    createdAt: fila.createdAt,
    updatedAt: fila.updatedAt,
  };
}

/** Traduce la violación del índice único (RN-02) al error del dominio. */
function traducirErrorRn02(error, canchaId, fechaHoraInicio) {
  if (error && error.name === 'SequelizeUniqueConstraintError') {
    return new TurnoYaReservadoError(canchaId, fechaHoraInicio);
  }
  return error;
}

/** @returns {import('./reservas.puerto').ReservasRepository} */
function crearReservasRepositorySequelize({ ReservaCanchaModel }) {
  async function porId(id) {
    return aDominio(await ReservaCanchaModel.findByPk(id));
  }

  async function deUsuario(usuarioId) {
    const filas = await ReservaCanchaModel.findAll({
      where: { usuarioId },
      order: [['fechaHoraInicio', 'DESC']],
    });
    return filas.map(aDominio);
  }

  async function turnosOcupados(canchaId, desde, hasta) {
    const filas = await ReservaCanchaModel.findAll({
      attributes: ['fechaHoraInicio'],
      where: {
        canchaId,
        fechaHoraInicio: { [Op.between]: [desde, hasta] },
        estado: { [Op.in]: ESTADOS_QUE_OCUPAN },
      },
    });
    return filas.map((f) => new Date(f.fechaHoraInicio));
  }

  async function registrar(datos) {
    try {
      return aDominio(await ReservaCanchaModel.create(datos));
    } catch (error) {
      throw traducirErrorRn02(error, datos.canchaId, datos.fechaHoraInicio);
    }
  }

  async function cambiarEstado(id, estado) {
    const actual = await ReservaCanchaModel.findByPk(id);
    if (!actual) return null;
    try {
      actual.estado = estado;
      await actual.save();
      return aDominio(actual);
    } catch (error) {
      // Ej.: reactivar una reserva cancelada cuyo turno ya tomó otro socio.
      throw traducirErrorRn02(error, actual.canchaId, actual.fechaHoraInicio);
    }
  }

  return { porId, deUsuario, turnosOcupados, registrar, cambiarEstado };
}

module.exports = { crearReservasRepositorySequelize };
