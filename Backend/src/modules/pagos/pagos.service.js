'use strict';

const { generarComprobantePdf } = require('./comprobante-pdf');
const { AppError } = require('../../common/app-error');
const { EstadoPago, EstadoReservaCancha } = require('../../common/enums');

// Inyectamos PagoModel
function crearPagosService({ PagoModel, canchasService, usuariosService, sedesService, pasarela }) {
  
  async function pagarReserva({ reservaId, usuarioId, tarjeta }) {
    const reserva = await canchasService.obtenerReserva(reservaId);
    if (reserva.usuarioId !== usuarioId) throw new AppError('La reserva no pertenece a este usuario.', 403);
    if (reserva.estado === EstadoReservaCancha.CONFIRMADA) throw new AppError('La reserva ya esta paga.', 409);
    if (reserva.estado === EstadoReservaCancha.CANCELADA) throw new AppError('La reserva esta cancelada.', 409);

    const monto = Number(reserva.precioFinal);
    const resultado = await pasarela.cobrar({ monto, tarjeta });

    const pago = await PagoModel.create({
      reservaCanchaId: reserva.id,
      usuarioId,
      monto,
      estado: resultado.aprobado ? EstadoPago.APROBADO : EstadoPago.RECHAZADO,
      tokenPasarela: resultado.token,
      ultimos4: resultado.ultimos4 || null,
      motivoRechazo: resultado.aprobado ? null : resultado.motivo,
    });

    if (!resultado.aprobado) {
      throw new AppError(`Pago rechazado: ${resultado.motivo}`, 402);
    }

    await canchasService.confirmarReserva(reserva.id);
    

    return pago;
  }

  async function obtenerPago(id) {
    const p = await PagoModel.findByPk(id);
    if (!p) throw new AppError(`Pago ${id} no encontrado.`, 404);
    return p;
  }

  async function comprobantePdf(pagoId) {
    const pago = await obtenerPago(pagoId);
    if (pago.estado !== EstadoPago.APROBADO) throw new AppError('Solo se emite comprobante de pagos aprobados.', 409);
    const reserva = await canchasService.obtenerReserva(pago.reservaCanchaId);
    const cancha = await canchasService.obtenerCancha(reserva.canchaId);
    const sede = await sedesService.obtenerSede(cancha.sedeId);
    const usuario = await usuariosService.obtenerUsuario(pago.usuarioId);
    return generarComprobantePdf({ pago, reserva, cancha, sede, usuario });
  }

  function pagosDeUsuario(usuarioId) {
    return PagoModel.findAll({ where: { usuarioId }, order: [['createdAt', 'DESC']] });
  }

  return { pagarReserva, obtenerPago, comprobantePdf, pagosDeUsuario };
}

module.exports = { crearPagosService };