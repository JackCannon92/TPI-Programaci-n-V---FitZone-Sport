'use strict';

const { AppError } = require('../../common/app-error');
const { EstadoCancha, EstadoReservaCancha } = require('../../common/enums');
const { Op } = require('sequelize');

const HORA_APERTURA = 8;
const HORA_CIERRE = 23;

// Inyectamos directamente los Modelos
function crearCanchasService({ CanchaModel, ReservaCanchaModel, usuariosService, sedesService }) {
  
  async function crearCancha(datos) {
    await sedesService.obtenerSede(datos.sedeId);
    return CanchaModel.create(datos);
  }

  async function obtenerCancha(id) {
    const cancha = await CanchaModel.findByPk(id);
    if (!cancha) throw new AppError(`Cancha ${id} no encontrada.`, 404);
    return cancha;
  }

  function listarPorSede(sedeId) {
    return CanchaModel.findAll({ where: { sedeId } });
  }

  async function cambiarEstado(id, estado) {
    const cancha = await obtenerCancha(id);
    cancha.estado = estado;
    await cancha.save();
    return cancha;
  }

  async function disponibilidad(canchaId, fechaISO) {
    const cancha = await obtenerCancha(canchaId);
    const dia = new Date(`${fechaISO}T00:00:00`);
    if (Number.isNaN(dia.getTime())) throw new AppError('Fecha invalida (YYYY-MM-DD).', 400);
    
    const desde = new Date(dia); desde.setHours(HORA_APERTURA, 0, 0, 0);
    const hasta = new Date(dia); hasta.setHours(HORA_CIERRE, 0, 0, 0);
    
    // Consulta directa a Sequelize en lugar del Repository
    const reservasOcupadas = await ReservaCanchaModel.findAll({
      where: {
        canchaId,
        fechaHoraInicio: { [Op.between]: [desde, hasta] },
        estado: { [Op.in]: [EstadoReservaCancha.PENDIENTE_PAGO, EstadoReservaCancha.CONFIRMADA] }
      }
    });
    const ocupados = new Set(reservasOcupadas.map(r => new Date(r.fechaHoraInicio).toISOString()));
    
    const ahora = Date.now();
    const slots = [];
    for (let h = HORA_APERTURA; h < HORA_CIERRE; h += 1) {
      const inicio = new Date(dia); inicio.setHours(h, 0, 0, 0);
      slots.push({
        inicio: inicio.toISOString(),
        hora: `${String(h).padStart(2, '0')}:00`,
        disponible: cancha.estado === EstadoCancha.DISPONIBLE && !ocupados.has(inicio.toISOString()) && inicio.getTime() > ahora,
        pico: h >= 19 && h < 21,
      });
    }
    return { cancha: { id: cancha.id, nombre: cancha.nombre, precioHora: Number(cancha.precioHora) }, fecha: fechaISO, slots };
  }

  // MOCK DIRECTO (Sin Strategy)
  async function cotizar({ canchaId, usuarioId, fechaHoraInicio }) {
    const cancha = await obtenerCancha(canchaId);
    return {
      precioFinal: Number(cancha.precioHora),
      detalle: [{ concepto: 'Precio base', monto: Number(cancha.precioHora) }]
    };
  }

  async function reservar({ canchaId, usuarioId, fechaHoraInicio }) {
    const cancha = await obtenerCancha(canchaId);
    if (cancha.estado !== EstadoCancha.DISPONIBLE) {
      throw new AppError('La cancha esta en mantenimiento.', 409);
    }
    const inicio = new Date(fechaHoraInicio);
    const fin = new Date(inicio.getTime() + 60 * 60 * 1000);
    
    const { precioFinal, detalle } = await cotizar({ canchaId, usuarioId, fechaHoraInicio: inicio });

    try {
      return await ReservaCanchaModel.create({
        canchaId, usuarioId, fechaHoraInicio: inicio, fechaHoraFin: fin, precioFinal, detallePrecio: detalle
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new AppError('Ese turno acaba de ser reservado por otro usuario.', 409);
      }
      throw error;
    }
  }

  async function obtenerReserva(id) {
    const r = await ReservaCanchaModel.findByPk(id);
    if (!r) throw new AppError(`Reserva ${id} no encontrada.`, 404);
    return r;
  }

  function reservasDeUsuario(usuarioId) {
    return ReservaCanchaModel.findAll({ where: { usuarioId } });
  }

  async function cancelarReserva(id) {
    const r = await obtenerReserva(id);
    if (r.estado === EstadoReservaCancha.CANCELADA) return r;
    r.estado = EstadoReservaCancha.CANCELADA;
    await r.save();
    return r;
  }
  async function confirmarReserva(reservaId) {
    // Busca la reserva por su ID
    const reserva = await ReservaCanchaModel.findByPk(reservaId); 
    
    // Si no existe, lanzamos error
    if (!reserva) {
      throw new AppError('Reserva de cancha no encontrada.', 404);
    }

    // Actualizamos el estado a CONFIRMADA
    reserva.estado = EstadoReservaCancha.CONFIRMADA; // (o el nombre que tenga tu Enum)
    await reserva.save();
    
    return reserva;
  }
  return {
    crearCancha, obtenerCancha, listarPorSede, cambiarEstado, disponibilidad,
    cotizar, reservar, obtenerReserva, reservasDeUsuario, cancelarReserva,confirmarReserva
  };
}

module.exports = { crearCanchasService };