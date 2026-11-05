'use strict';

/**
 * QR 4 · QR de verificación del comprobante (ADR-010).
 */
const { crearPagosService } = require('../../src/modules/pagos/pagos.service');
const { crearPasarelaMock } = require('../../src/modules/pagos/pasarela-mock');
const { firmarQr, TiposQr } = require('../../src/common/qr-firmado');
const { CANCHA, SOCIO, crearCanchasDePrueba, usuariosServiceFalso, pagoModelFalso } = require('../dobles/fitzone');

const TARJETA_OK = { numero: '4111111111111111', titular: 'Socio', vencimiento: '12/30', cvv: '123' };

async function crearEscenario() {
  const { servicio: canchasService } = crearCanchasDePrueba();
  const PagoModel = pagoModelFalso();
  const pagos = crearPagosService({
    PagoModel, canchasService, usuariosService: usuariosServiceFalso,
    sedesService: { obtenerSede: async () => ({ nombre: 'Sede Centro' }) },
    pasarela: crearPasarelaMock(),
  });
  const reserva = await canchasService.reservar({ canchaId: CANCHA.id, usuarioId: SOCIO.id, fechaHoraInicio: new Date(2030, 4, 15, 19, 0) });
  const pago = await pagos.pagarReserva({ reservaId: reserva.id, usuarioId: SOCIO.id, tarjeta: TARJETA_OK });
  return { pagos, pago, PagoModel };
}

describe('QR de verificación del comprobante', () => {
  test('el comprobante PDF se genera con sus QR', async () => {
    const { pagos, pago } = await crearEscenario();
    const pdf = await pagos.comprobantePdf(pago.id);
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pdf.length).toBeGreaterThan(3000); // incluye las dos imágenes de los QR
  });

  test('un comprobante auténtico se verifica con su monto y su cancha', async () => {
    const { pagos, pago } = await crearEscenario();
    const token = firmarQr(TiposQr.COMPROBANTE, { pagoId: pago.id, monto: Number(pago.monto) });
    const resultado = await pagos.verificarComprobante(token);
    expect(resultado).toMatchObject({ valido: true, comprobante: { pagoId: pago.id, monto: 1020, cancha: CANCHA.nombre } });
  });

  test('si el monto del QR no coincide con el cobrado, no es válido', async () => {
    const { pagos, pago } = await crearEscenario();
    const token = firmarQr(TiposQr.COMPROBANTE, { pagoId: pago.id, monto: 1 });
    expect(await pagos.verificarComprobante(token)).toMatchObject({ valido: false });
  });

  test('un QR inventado no es válido', async () => {
    const { pagos } = await crearEscenario();
    expect(await pagos.verificarComprobante('no.firmado')).toMatchObject({ valido: false });
  });
});
