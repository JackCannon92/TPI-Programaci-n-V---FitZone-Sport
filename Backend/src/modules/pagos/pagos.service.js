'use strict';

const { generarComprobantePdf } = require('./comprobante-pdf');
const { AppError } = require('../../common/app-error');
const { EstadoPago, EstadoReservaCancha } = require('../../common/enums');
const { firmarQr, verificarQr, qrPng, TiposQr } = require('../../common/qr-firmado');

// Dirección pública de la API, para el link del QR de verificación del comprobante.
const URL_PUBLICA = (process.env.URL_PUBLICA || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, '');

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

  /** QR 4 · Link de verificación del comprobante (ADR-016). Lleva firmados el pago y su monto. */
  function urlVerificacion(pago) {
    const token = firmarQr(TiposQr.COMPROBANTE, { pagoId: pago.id, monto: Number(pago.monto) });
    return `${URL_PUBLICA}/api/pagos/verificar/${token}`;
  }

  async function comprobantePdf(pagoId) {
    const pago = await obtenerPago(pagoId);
    if (pago.estado !== EstadoPago.APROBADO) throw new AppError('Solo se emite comprobante de pagos aprobados.', 409);
    const reserva = await canchasService.obtenerReserva(pago.reservaCanchaId);
    const cancha = await canchasService.obtenerCancha(reserva.canchaId);
    const sede = await sedesService.obtenerSede(cancha.sedeId);
    const usuario = await usuariosService.obtenerUsuario(pago.usuarioId);

    // El comprobante lleva dos QR: el de ingreso a la cancha (QR 1, si la
    // reserva sigue confirmada) y el de verificación del pago (QR 4).
    let ingreso = null;
    if (reserva.estado === EstadoReservaCancha.CONFIRMADA) {
      const qr = await canchasService.generarQrReserva(reserva.id);
      ingreso = { png: await qrPng(qr.token), validoDesde: qr.validoDesde, validoHasta: qr.validoHasta };
    }
    const url = urlVerificacion(pago);
    const verificacion = { png: await qrPng(url), url };

    return generarComprobantePdf({ pago, reserva, cancha, sede, usuario, qrs: { ingreso, verificacion } });
  }

  /**
   * QR 4 · Verificar un comprobante: confirma que el pago existe, está aprobado
   * y que el monto del comprobante es el que se cobró. Es público: lo puede
   * consultar cualquiera que escanee el QR del ticket.
   */
  async function verificarComprobante(token) {
    const resultado = verificarQr(token, TiposQr.COMPROBANTE);
    if (!resultado.ok) return { valido: false, motivo: 'El QR no corresponde a un comprobante de FitZone.' };

    const { pagoId, monto } = resultado.datos;
    const pago = await PagoModel.findByPk(pagoId);
    if (!pago) return { valido: false, motivo: 'El pago del comprobante no existe.' };
    if (pago.estado !== EstadoPago.APROBADO) return { valido: false, motivo: 'El pago no está aprobado.' };
    if (Number(pago.monto) !== monto) return { valido: false, motivo: 'El monto del comprobante no coincide con el cobrado.' };

    const reserva = await canchasService.obtenerReserva(pago.reservaCanchaId);
    const cancha = await canchasService.obtenerCancha(reserva.canchaId);
    return {
      valido: true,
      comprobante: {
        pagoId: pago.id,
        monto: Number(pago.monto),
        estado: pago.estado,
        fechaPago: pago.created_at || pago.createdAt,
        cancha: cancha.nombre,
        turno: { inicio: reserva.fechaHoraInicio, fin: reserva.fechaHoraFin },
        reservaEstado: reserva.estado,
      },
    };
  }

  function pagosDeUsuario(usuarioId) {
    return PagoModel.findAll({ where: { usuarioId }, order: [['created_at', 'DESC']] }); // el modelo nombra la columna created_at (olor O-15)
  }

  return { pagarReserva, obtenerPago, comprobantePdf, verificarComprobante, pagosDeUsuario };
}

module.exports = { crearPagosService };