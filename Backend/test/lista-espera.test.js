'use strict';

/**
 * RF-08 · Aviso a la lista de espera (patrón Observer).
 * Correr con:  node --test
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { crearBusEventos, Eventos } = require('../src/common/bus-eventos');
const { crearAvisoListaEspera } = require('../src/modules/clases/observer/waitlistNotifier');
const { crearClasesService } = require('../src/modules/clases/clases.service');

const loggerMudo = { log: () => {}, error: () => {} };

/** Doble de ListaEsperaModel con lo justo que usa el oyente. */
function listaEsperaFalsa(entradas) {
  const filas = entradas.map((e) => ({ ...e, save: async () => {} }));
  return {
    filas,
    findOne: async ({ where }) => filas
      .filter((f) => f.claseId === where.claseId && f.notificado === where.notificado)
      .sort((a, b) => a.created_at - b.created_at)[0] ?? null,
  };
}

describe('Observer: oyente de la lista de espera', () => {
  test('al liberarse un cupo se avisa al PRIMERO de la lista que no fue avisado', async () => {
    const modelo = listaEsperaFalsa([
      { usuarioId: 'u-segundo', claseId: 'c1', notificado: false, created_at: new Date('2030-01-01T10:05') },
      { usuarioId: 'u-ya-avisado', claseId: 'c1', notificado: true, created_at: new Date('2030-01-01T09:00') },
      { usuarioId: 'u-primero', claseId: 'c1', notificado: false, created_at: new Date('2030-01-01T10:00') },
      { usuarioId: 'u-otra-clase', claseId: 'c2', notificado: false, created_at: new Date('2030-01-01T08:00') },
    ]);
    const bus = crearBusEventos({ logger: loggerMudo });
    bus.suscribir(Eventos.CUPO_LIBERADO, crearAvisoListaEspera({ ListaEsperaModel: modelo, logger: loggerMudo }));

    await bus.publicar(Eventos.CUPO_LIBERADO, { claseId: 'c1' });

    const avisados = modelo.filas.filter((f) => f.notificado).map((f) => f.usuarioId).sort();
    assert.deepEqual(avisados, ['u-primero', 'u-ya-avisado']);
  });

  test('si la lista está vacía no pasa nada', async () => {
    const aviso = crearAvisoListaEspera({ ListaEsperaModel: listaEsperaFalsa([]), logger: loggerMudo });
    assert.equal(await aviso({ claseId: 'c1' }), null);
  });
});

describe('Observer: el bus de eventos', () => {
  test('un evento llega a TODOS los oyentes suscriptos (uno a muchos)', async () => {
    const bus = crearBusEventos({ logger: loggerMudo });
    const recibidos = [];
    bus.suscribir('Algo', (e) => recibidos.push(['A', e.x]));
    bus.suscribir('Algo', (e) => recibidos.push(['B', e.x]));
    await bus.publicar('Algo', { x: 1 });
    assert.deepEqual(recibidos, [['A', 1], ['B', 1]]);
  });

  test('un oyente que falla no arrastra a los demás ni al que publicó', async () => {
    const errores = [];
    const bus = crearBusEventos({ logger: { log() {}, error: (m) => errores.push(m) } });
    let elSegundoCorrio = false;
    bus.suscribir('Algo', () => { throw new Error('se cayó el mail'); });
    bus.suscribir('Algo', async () => { elSegundoCorrio = true; });

    await bus.publicar('Algo', {}); // no lanza
    assert.equal(elSegundoCorrio, true);
    assert.equal(errores.length, 1);
    assert.match(errores[0], /se cayó el mail/);
  });

  test('el evento es inmutable y trae la fecha en que ocurrió', async () => {
    const bus = crearBusEventos({ logger: loggerMudo });
    let evento;
    bus.suscribir('Algo', (e) => { evento = e; });
    await bus.publicar('Algo', { claseId: 'c1' });
    assert.ok(Object.isFrozen(evento));
    assert.ok(evento.ocurridoEn instanceof Date);
  });
});

describe('Observer: quien publica', () => {
  test('cancelar una reserva de clase publica CupoLiberado sin saber quién escucha', async () => {
    const publicados = [];
    const reserva = { id: 'r1', claseId: 'c1', estado: 'CONFIRMADA', save: async () => {} };
    const clase = { id: 'c1', capacidadMaxima: 10, cuposDisponibles: 0, fechaHora: new Date(Date.now() + 864e5), save: async () => {} };

    const servicio = crearClasesService({
      ClaseModel: { findByPk: async () => clase },
      ReservaClaseModel: { findByPk: async () => reserva },
      ListaEsperaModel: {},
      usuariosService: {}, sedesService: {}, sequelize: {},
      eventos: { publicar: async (nombre, datos) => { publicados.push({ nombre, ...datos }); } },
    });

    await servicio.cancelarReserva('r1');

    assert.equal(reserva.estado, 'CANCELADA');
    assert.deepEqual(publicados, [{ nombre: Eventos.CUPO_LIBERADO, claseId: 'c1', reservaId: 'r1' }]);
  });

  test('cancelar una reserva ya cancelada no vuelve a publicar', async () => {
    const publicados = [];
    const servicio = crearClasesService({
      ClaseModel: {}, ListaEsperaModel: {}, usuariosService: {}, sedesService: {}, sequelize: {},
      ReservaClaseModel: { findByPk: async () => ({ id: 'r1', estado: 'CANCELADA' }) },
      eventos: { publicar: async (n) => publicados.push(n) },
    });
    await servicio.cancelarReserva('r1');
    assert.equal(publicados.length, 0);
  });
});
