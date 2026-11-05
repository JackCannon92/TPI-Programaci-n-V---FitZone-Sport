'use strict';

/**
 * QR 2 · Acceso sin conexión (ADR-010).
 * El torno valida con la clave PÚBLICA y sin tocar la base de datos.
 */
const crypto = require('crypto');
const { emitirQrOffline, validarQrOffline, clavePublicaPem, HORAS_DE_VALIDEZ } = require('../../src/modules/acceso/qr-offline');
const { crearAccesoDePrueba, crearCanchasDePrueba, SOCIO, EXTERNO } = require('../dobles/fitzone');

const AHORA = new Date(2030, 4, 15, 9, 0).getTime();
const SOCIO_OFFLINE = { usuarioId: SOCIO.id, nombre: 'Socio Prueba', venceMembresia: '2030-12-31' };

describe('QR sin conexión: emisión y validación', () => {
  test('el torno lo valida solo con la clave pública (en PEM, como se instalaría)', () => {
    const { token } = emitirQrOffline(SOCIO_OFFLINE, AHORA);
    const claveDelTorno = crypto.createPublicKey(clavePublicaPem());
    const resultado = validarQrOffline(token, { clavePublica: claveDelTorno, ahora: AHORA + 1000 });
    expect(resultado).toMatchObject({ valido: true, usuarioId: SOCIO.id, nombre: 'Socio Prueba', venceMembresia: '2030-12-31' });
  });

  test('vale 24 horas desde que se emite', () => {
    const { token, validoHasta } = emitirQrOffline(SOCIO_OFFLINE, AHORA);
    expect(validoHasta.getTime()).toBe(AHORA + HORAS_DE_VALIDEZ * 3600 * 1000);
    expect(validarQrOffline(token, { ahora: validoHasta.getTime() - 1 }).valido).toBe(true);
    expect(validarQrOffline(token, { ahora: validoHasta.getTime() + 1 })).toEqual({ valido: false, motivo: 'VENCIDO' });
  });

  test('si la membresía vence antes de las 24 horas, el QR vence con ella', () => {
    const { validoHasta } = emitirQrOffline({ ...SOCIO_OFFLINE, venceMembresia: '2030-05-15' }, AHORA);
    expect(validoHasta).toEqual(new Date(2030, 4, 15, 23, 59, 59, 999));
  });

  test('un QR modificado se rechaza', () => {
    const { token } = emitirQrOffline(SOCIO_OFFLINE, AHORA);
    const [, firma] = token.split('.');
    const otroSocio = Buffer.from(JSON.stringify({ t: 'ACCESO_OFFLINE', usuarioId: 'otro', exp: AHORA * 2 })).toString('base64url');
    expect(validarQrOffline(`${otroSocio}.${firma}`, { ahora: AHORA })).toEqual({ valido: false, motivo: 'INVALIDO' });
  });

  test('un QR firmado con otra clave privada (falsificado) se rechaza', () => {
    const { privateKey } = crypto.generateKeyPairSync('ed25519');
    const cuerpo = Buffer.from(JSON.stringify({ t: 'ACCESO_OFFLINE', usuarioId: SOCIO.id, exp: AHORA * 2 })).toString('base64url');
    const firmaTrucha = crypto.sign(null, Buffer.from(cuerpo), privateKey).toString('base64url');
    expect(validarQrOffline(`${cuerpo}.${firmaTrucha}`, { ahora: AHORA }).valido).toBe(false);
  });
});

describe('QR sin conexión: servicio de acceso', () => {
  const { servicio: canchasService } = crearCanchasDePrueba();

  test('un socio activo obtiene su QR sin conexión', async () => {
    const { servicio } = crearAccesoDePrueba({ canchasService });
    const qr = await servicio.generarQrOffline(SOCIO.id);
    expect(qr.svg).toMatch(/^<svg/);
    expect(servicio.validarQrOffline(qr.token)).toMatchObject({ valido: true, usuarioId: SOCIO.id });
  });

  test('un cliente externo no puede tener QR sin conexión (403)', async () => {
    const { servicio } = crearAccesoDePrueba({ canchasService });
    await expect(servicio.generarQrOffline(EXTERNO.id)).rejects.toMatchObject({ status: 403 });
  });

  test('validar no consulta la base de datos', () => {
    const { servicio, RegistroAccesoModel } = crearAccesoDePrueba({ canchasService });
    const espias = ['findOne', 'count', 'create'].map((m) => jest.spyOn(RegistroAccesoModel, m));
    const { token } = emitirQrOffline(SOCIO_OFFLINE);
    expect(servicio.validarQrOffline(token).valido).toBe(true);
    espias.forEach((espia) => expect(espia).not.toHaveBeenCalled());
  });
});
