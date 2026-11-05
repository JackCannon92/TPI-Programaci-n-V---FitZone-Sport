'use strict';

/**
 * Tests de integración (Supertest) del módulo de membresías, con el
 * repositorio en memoria en lugar del de Sequelize.
 */
const express = require('express');
const request = require('supertest');

const { crearMembresiasRouter } = require('../../src/modules/membresias/membresias.routes');
const { crearMembresiasController } = require('../../src/modules/membresias/membresias.controller');
const { manejarErrores } = require('../../src/core/errorHandler');
const { crearMembresiasDePrueba, loggerMudo, haceDias } = require('../dobles/fitzone');

const USUARIO = '55555555-5555-4555-8555-555555555555';

let app;
let membresiasRepo;

beforeEach(async () => {
  const prueba = crearMembresiasDePrueba();
  membresiasRepo = prueba.membresiasRepo;
  app = express();
  app.use(express.json());
  app.use('/api/membresias', crearMembresiasRouter(crearMembresiasController(prueba.servicio)));
  app.use(manejarErrores({ logger: loggerMudo }));

  await membresiasRepo.registrar({
    usuario_id: USUARIO, plan: 'MENSUAL', estado: 'ACTIVO',
    fecha_inicio: haceDias(5), fecha_vencimiento: new Date(Date.now() + 25 * 864e5),
  });
});

describe('API de membresías', () => {
  test('GET devuelve la membresía del usuario', async () => {
    const res = await request(app).get(`/api/membresias/${USUARIO}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ usuario_id: USUARIO, plan: 'MENSUAL', estado: 'ACTIVO' });
  });

  test('PUT renovar cambia el plan y la deja ACTIVO', async () => {
    const res = await request(app).put(`/api/membresias/${USUARIO}/renovar`).send({ plan: 'TRIMESTRAL' });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ plan: 'TRIMESTRAL', estado: 'ACTIVO' });
  });

  test('PATCH suspender la deja SUSPENDIDO y queda guardado', async () => {
    const res = await request(app).patch(`/api/membresias/${USUARIO}/suspender`);
    expect(res.status).toBe(200);
    expect(res.body.data.estado).toBe('SUSPENDIDO');
    expect((await membresiasRepo.deUsuario(USUARIO)).estado).toBe('SUSPENDIDO');
  });

  test('un plan inválido al renovar responde 400', async () => {
    const res = await request(app).put(`/api/membresias/${USUARIO}/renovar`).send({ plan: 'SEMANAL' });
    expect(res.status).toBe(400);
  });

  test('un usuario sin membresía responde 400 (olor O-11: debería ser 404)', async () => {
    // Caracterización: el servicio lanza un Error genérico para "no encontrado".
    // Cuando se corrija O-11, este test pasa a esperar 404.
    const res = await request(app).get('/api/membresias/66666666-6666-4666-8666-666666666666');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/no encontrada/);
  });
});
