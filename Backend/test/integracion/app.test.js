'use strict';

/**
 * Test de humo de la aplicación completa (src/app.js) con Supertest.
 *
 * Verifica que el compositionRoot arma todos los módulos y que la API
 * responde. Usa una cadena de conexión ficticia: ninguna de estas rutas llega
 * a consultar la base, así que no hace falta Supabase para correrlo.
 */
process.env.DATABASE_URL = 'postgres://prueba:prueba@localhost:5432/fitzone_test';

const request = require('supertest');
const app = require('../../src/app');

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  console.error.mockRestore();
});

describe('Aplicación completa', () => {
  test('GET /api/health responde OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
  });

  test('Swagger está disponible en /api-docs', async () => {
    const res = await request(app).get('/api-docs/');
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/swagger/i);
  });

  test('los validadores frenan una reserva inválida antes de tocar la base (400)', async () => {
    const res = await request(app).post('/api/canchas/reservas').send({});
    expect(res.status).toBe(400);
  });

  test('ya no existe el endpoint del tablero CQRS (se quitó por indicación de la cátedra)', async () => {
    const res = await request(app).get('/api/reportes/ocupacion');
    expect(res.status).toBe(404);
  });
});
