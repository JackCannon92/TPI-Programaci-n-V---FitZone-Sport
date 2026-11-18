'use strict';

/**
 * RN-02 · Concurrencia en la reserva de canchas, contra PostgreSQL real (ADR-004).
 *
 * Las pruebas unitarias y de integración usan el repositorio en memoria. Esta
 * prueba usa la API completa conectada a una base real: varias personas piden
 * el mismo turno de la misma cancha al mismo tiempo y solo una puede quedárselo.
 * Lo garantiza el índice único parcial uq_reserva_cancha_turno_activo; los
 * demás intentos reciben 409.
 *
 * Necesita una base con db/01-esquema.sql y db/02-seed.sql cargados:
 *   DATABASE_URL=postgres://... DB_SSL=false npm run test:concurrencia
 * Sin DATABASE_URL la prueba se saltea (npm test no la corre).
 */
const request = require('supertest');

const hayBase = Boolean(process.env.DATABASE_URL);
const describeConBase = hayBase ? describe : describe.skip;

describeConBase('RN-02 contra PostgreSQL: el mismo turno pedido a la vez', () => {
  let app;
  let sequelize;

  beforeAll(() => {
    app = require('../../src/app');
    ({ sequelize } = require('../../src/core/db'));
  });

  afterAll(async () => {
    if (sequelize) await sequelize.close();
  });

  test('de varios pedidos simultáneos, uno reserva y el resto recibe 409', async () => {
    const sedes = (await request(app).get('/api/v1/sedes')).body;
    const canchas = (await request(app).get(`/api/v1/canchas/sede/${sedes[0].id}`)).body;
    const cancha = canchas.find((c) => c.estado === 'DISPONIBLE');
    const usuarios = (await request(app).get('/api/v1/usuarios')).body;
    expect(usuarios.length).toBeGreaterThanOrEqual(2);

    // Un turno a futuro distinto en cada corrida, para poder repetir la prueba.
    const turno = new Date();
    turno.setDate(turno.getDate() + 30 + Math.floor(Math.random() * 300));
    turno.setHours(10 + Math.floor(Math.random() * 12), 0, 0, 0);

    const pedidos = usuarios.slice(0, 6).map((u) => request(app)
      .post('/api/v1/canchas/reservas')
      .send({ canchaId: cancha.id, usuarioId: u.id, fechaHoraInicio: turno.toISOString() }));
    const respuestas = await Promise.all(pedidos);

    const estados = respuestas.map((r) => r.status).sort();
    const ganadora = respuestas.find((r) => r.status === 201);
    expect(estados.filter((s) => s === 201)).toHaveLength(1);
    expect(estados.filter((s) => s === 409)).toHaveLength(respuestas.length - 1);

    // Se libera el turno para no dejar datos de la prueba.
    await request(app).patch(`/api/v1/canchas/reservas/${ganadora.body.id}/cancelar`);
  });
});
