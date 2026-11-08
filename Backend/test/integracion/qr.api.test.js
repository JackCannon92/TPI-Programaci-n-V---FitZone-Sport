'use strict';

/**
 * Tests de integración (Supertest) de los QR (ADR-016).
 *
 * Se arman los routers reales de canchas, acceso, clases y pagos con sus
 * servicios reales; solo la persistencia va en memoria, así no hace falta
 * base de datos.
 */
const express = require('express');
const request = require('supertest');

const { crearCanchasRouter } = require('../../src/modules/canchas/canchas.routes');
const { crearCanchasController } = require('../../src/modules/canchas/canchas.controller');
const { crearAccesoRouter } = require('../../src/modules/acceso/acceso.routes');
const { crearAccesoController } = require('../../src/modules/acceso/acceso.controller');
const { crearPagosRouter } = require('../../src/modules/pagos/pagos.routes');
const { crearPagosController } = require('../../src/modules/pagos/pagos.controller');
const { crearPagosService } = require('../../src/modules/pagos/pagos.service');
const { crearPasarelaMock } = require('../../src/modules/pagos/pasarela-mock');
const { manejarErrores } = require('../../src/core/errorHandler');
const {
  CANCHA, SOCIO, EXTERNO, crearCanchasDePrueba, crearAccesoDePrueba,
  usuariosServiceFalso, pagoModelFalso, loggerMudo,
} = require('../dobles/fitzone');

const MINUTO = 60 * 1000;
const enDiezMinutos = () => new Date(Math.floor(Date.now() / MINUTO) * MINUTO + 10 * MINUTO).toISOString();
const TARJETA_OK = { numero: '4111111111111111', titular: 'Prueba', vencimiento: '12/30', cvv: '123' };

let app;
let acceso;

beforeEach(() => {
  const { servicio: canchas } = crearCanchasDePrueba();
  acceso = crearAccesoDePrueba({ canchasService: canchas });
  const pagos = crearPagosService({
    PagoModel: pagoModelFalso(),
    canchasService: canchas,
    usuariosService: usuariosServiceFalso,
    sedesService: { obtenerSede: async () => ({ nombre: 'Sede Centro' }) },
    pasarela: crearPasarelaMock(),
  });

  app = express();
  app.use(express.json());
  app.use('/api/canchas', crearCanchasRouter(crearCanchasController(canchas)));
  app.use('/api/acceso', crearAccesoRouter(crearAccesoController(acceso.servicio)));
  app.use('/api/pagos', crearPagosRouter(crearPagosController(pagos)));
  app.use(manejarErrores({ logger: loggerMudo }));
});

/** Reserva un turno que empieza en 10 minutos y lo paga. Devuelve { reserva, pago }. */
async function reservarYPagar(usuario) {
  const reserva = (await request(app).post('/api/canchas/reservas')
    .send({ canchaId: CANCHA.id, usuarioId: usuario.id, fechaHoraInicio: enDiezMinutos() })).body;
  const pago = (await request(app).post('/api/pagos')
    .send({ reservaId: reserva.id, usuarioId: usuario.id, tarjeta: TARJETA_OK })).body;
  return { reserva, pago };
}

describe('QR 1 · Reserva de cancha', () => {
  test('externo: paga, obtiene el QR de su reserva y entra a la sede', async () => {
    const { reserva } = await reservarYPagar(EXTERNO);

    const qr = await request(app).get(`/api/canchas/reservas/${reserva.id}/qr`);
    expect(qr.status).toBe(200);
    expect(qr.body.svg).toMatch(/^<svg/);

    const ingreso = await request(app).post('/api/acceso/ingreso-reserva').send({ token: qr.body.token, sedeId: CANCHA.sedeId });
    expect(ingreso.status).toBe(201);
    expect(ingreso.body).toMatchObject({ reservaId: reserva.id, usuario: { tipo: 'CLIENTE_EXTERNO' } });
  });

  test('una reserva sin pagar no tiene QR (409)', async () => {
    const reserva = (await request(app).post('/api/canchas/reservas')
      .send({ canchaId: CANCHA.id, usuarioId: EXTERNO.id, fechaHoraInicio: enDiezMinutos() })).body;
    expect((await request(app).get(`/api/canchas/reservas/${reserva.id}/qr`)).status).toBe(409);
  });

  test('sin token el ingreso responde 400 (validación)', async () => {
    const res = await request(app).post('/api/acceso/ingreso-reserva').send({ sedeId: CANCHA.sedeId });
    expect(res.status).toBe(400);
  });
});

describe('QR 2 · Acceso sin conexión', () => {
  test('un socio obtiene el QR y el torno lo valida', async () => {
    const qr = await request(app).get(`/api/acceso/qr-offline/${SOCIO.id}`);
    expect(qr.status).toBe(200);

    const validacion = await request(app).post('/api/acceso/validar-offline').send({ token: qr.body.token });
    expect(validacion.status).toBe(200);
    expect(validacion.body).toMatchObject({ valido: true, usuarioId: SOCIO.id });
  });

  test('un token inventado no es válido', async () => {
    const res = await request(app).post('/api/acceso/validar-offline').send({ token: 'abc.def' });
    expect(res.body).toEqual({ valido: false, motivo: 'INVALIDO' });
  });

  test('un cliente externo no tiene QR sin conexión (403)', async () => {
    expect((await request(app).get(`/api/acceso/qr-offline/${EXTERNO.id}`)).status).toBe(403);
  });

  test('la clave pública para los tornos se publica en PEM', async () => {
    const res = await request(app).get('/api/acceso/clave-publica');
    expect(res.status).toBe(200);
    expect(res.body.algoritmo).toBe('Ed25519');
    expect(res.body.clavePublica).toMatch(/BEGIN PUBLIC KEY/);
  });
});

describe('QR 4 · Comprobante', () => {
  test('el comprobante PDF se descarga con sus QR', async () => {
    const { pago } = await reservarYPagar(SOCIO);
    const res = await request(app).get(`/api/pagos/${pago.id}/comprobante`).buffer(true).parse((r, cb) => {
      const partes = [];
      r.on('data', (c) => partes.push(c));
      r.on('end', () => cb(null, Buffer.concat(partes)));
    });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/);
    expect(res.body.subarray(0, 5).toString()).toBe('%PDF-');
  });

  test('un link de verificación inventado responde valido: false', async () => {
    const res = await request(app).get('/api/pagos/verificar/no.firmado');
    expect(res.status).toBe(200);
    expect(res.body.valido).toBe(false);
  });
});
