'use strict';

/**
 * Tests de integración (Supertest) del módulo de canchas.
 *
 * Se prueba la API por HTTP de punta a punta (validadores → controlador →
 * servicio → Tarifador → repositorio → manejador de errores), con las mismas
 * piezas que usa la API real. Lo único que cambia es el repositorio: va el de
 * memoria en lugar del de Sequelize, así el test no necesita base de datos.
 */
const express = require('express');
const request = require('supertest');

const { crearCanchasRouter } = require('../../src/modules/canchas/canchas.routes');
const { crearCanchasController } = require('../../src/modules/canchas/canchas.controller');
const { manejarErrores } = require('../../src/core/errorHandler');
const { CANCHA, SOCIO, EXTERNO, crearCanchasDePrueba, loggerMudo } = require('../dobles/fitzone');

const TURNO = '2030-05-15T19:00:00';      // hora local: horario pico
const ID_INEXISTENTE = '99999999-9999-4999-8999-999999999999';

let app;

beforeEach(() => {
  const { servicio } = crearCanchasDePrueba();
  app = express();
  app.use(express.json());
  app.use('/api/canchas', crearCanchasRouter(crearCanchasController(servicio)));
  app.use(manejarErrores({ logger: loggerMudo }));
});

const reservar = (usuario, fechaHoraInicio = TURNO) => request(app)
  .post('/api/canchas/reservas')
  .send({ canchaId: CANCHA.id, usuarioId: usuario.id, fechaHoraInicio });

describe('GET /api/canchas/:id/precio — RF-11', () => {
  test('cotiza con las reglas de precio y devuelve el detalle', async () => {
    const res = await request(app)
      .get(`/api/canchas/${CANCHA.id}/precio`)
      .query({ usuarioId: SOCIO.id, inicio: '2030-05-15T20:00:00' });

    expect(res.status).toBe(200);
    expect(res.body.precioFinal).toBe(1020);
    expect(res.body.detalle.map((d) => d.concepto)).toEqual([
      'Precio base', 'Descuento socio (15%)', 'Recargo horario pico (20%)',
    ]);
  });

  test('sin fecha de inicio responde 400 (validación)', async () => {
    const res = await request(app).get(`/api/canchas/${CANCHA.id}/precio`).query({ usuarioId: SOCIO.id });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/canchas/reservas — RN-02', () => {
  test('crea la reserva (201) pendiente de pago y con el precio calculado', async () => {
    const res = await reservar(SOCIO);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ estado: 'PENDIENTE_PAGO', precioFinal: 1020, canchaId: CANCHA.id });
  });

  test('el mismo turno por segunda vez responde 409 con el mensaje de RN-02', async () => {
    await reservar(SOCIO);
    const res = await reservar(EXTERNO);
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/RN-02/);
  });

  test('un cuerpo inválido responde 400 sin llegar al servicio', async () => {
    const res = await request(app).post('/api/canchas/reservas').send({ canchaId: 'no-es-un-uuid' });
    expect(res.status).toBe(400);
    expect(res.body.detalles.length).toBeGreaterThan(0);
  });

  test('cancelar libera el turno y otro usuario lo puede reservar', async () => {
    const primera = await reservar(SOCIO);
    const cancelada = await request(app).patch(`/api/canchas/reservas/${primera.body.id}/cancelar`);
    expect(cancelada.status).toBe(200);
    expect(cancelada.body.estado).toBe('CANCELADA');

    const segunda = await reservar(EXTERNO);
    expect(segunda.status).toBe(201);
    expect(segunda.body.precioFinal).toBe(1200);
  });
});

describe('Consultas de reservas y disponibilidad', () => {
  test('una reserva inexistente responde 404', async () => {
    const res = await request(app).get(`/api/canchas/reservas/${ID_INEXISTENTE}`);
    expect(res.status).toBe(404);
  });

  test('la disponibilidad marca ocupado el turno reservado', async () => {
    await reservar(SOCIO);
    const res = await request(app).get(`/api/canchas/${CANCHA.id}/disponibilidad`).query({ fecha: '2030-05-15' });
    expect(res.status).toBe(200);
    const slot = (hora) => res.body.slots.find((s) => s.hora === hora);
    expect(slot('19:00')).toMatchObject({ disponible: false, pico: true });
    expect(slot('18:00')).toMatchObject({ disponible: true, pico: false });
  });

  test('las reservas de un usuario se listan por su id', async () => {
    await reservar(SOCIO);
    await reservar(SOCIO, '2030-05-15T10:00:00');
    const res = await request(app).get(`/api/canchas/reservas/usuario/${SOCIO.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});
