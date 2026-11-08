'use strict';

/**
 * QR firmados (ADR-016): la pieza común de los QR de reserva, asistencia y comprobante.
 */
const { firmarQr, verificarQr, qrSvg, qrPng, TiposQr, MotivosQr } = require('../../src/common/qr-firmado');

const AHORA = new Date(2030, 4, 15, 18, 0).getTime();
const UNA_HORA = 60 * 60 * 1000;

describe('firmarQr / verificarQr', () => {
  test('un QR recién firmado se valida y devuelve sus datos', () => {
    const token = firmarQr(TiposQr.RESERVA_CANCHA, { reservaId: 'r1' }, { desde: AHORA - UNA_HORA, hasta: AHORA + UNA_HORA });
    const resultado = verificarQr(token, TiposQr.RESERVA_CANCHA, AHORA);
    expect(resultado.ok).toBe(true);
    expect(resultado.datos).toMatchObject({ t: TiposQr.RESERVA_CANCHA, reservaId: 'r1' });
  });

  test('si alguien modifica los datos, la firma deja de coincidir', () => {
    const token = firmarQr(TiposQr.COMPROBANTE, { pagoId: 'p1', monto: 1000 });
    const [, firma] = token.split('.');
    const cuerpoTrucho = Buffer.from(JSON.stringify({ t: TiposQr.COMPROBANTE, pagoId: 'p1', monto: 1 })).toString('base64url');
    expect(verificarQr(`${cuerpoTrucho}.${firma}`, TiposQr.COMPROBANTE)).toEqual({ ok: false, motivo: MotivosQr.INVALIDO });
  });

  test('un QR de un tipo no sirve como QR de otro tipo', () => {
    const token = firmarQr(TiposQr.RESERVA_CANCHA, { reservaId: 'r1' });
    expect(verificarQr(token, TiposQr.ASISTENCIA_CLASE)).toEqual({ ok: false, motivo: MotivosQr.INVALIDO });
  });

  test('respeta la ventana de validez: antes de tiempo y vencido', () => {
    const token = firmarQr(TiposQr.ASISTENCIA_CLASE, {}, { desde: AHORA, hasta: AHORA + UNA_HORA });
    expect(verificarQr(token, TiposQr.ASISTENCIA_CLASE, AHORA - 1).motivo).toBe(MotivosQr.TODAVIA_NO_VALE);
    expect(verificarQr(token, TiposQr.ASISTENCIA_CLASE, AHORA + UNA_HORA + 1).motivo).toBe(MotivosQr.VENCIDO);
    expect(verificarQr(token, TiposQr.ASISTENCIA_CLASE, AHORA + 1).ok).toBe(true);
  });

  test.each([undefined, '', 'sin-punto', 'a.b.c', '%%%.%%%'])('un token mal formado (%p) se rechaza', (token) => {
    expect(verificarQr(token, TiposQr.COMPROBANTE).ok).toBe(false);
  });

  test('genera la imagen del QR en SVG y en PNG', async () => {
    const token = firmarQr(TiposQr.COMPROBANTE, { pagoId: 'p1' });
    expect(await qrSvg(token)).toMatch(/^<svg/);
    const png = await qrPng(token);
    expect(png.subarray(1, 4).toString()).toBe('PNG');
  });
});
