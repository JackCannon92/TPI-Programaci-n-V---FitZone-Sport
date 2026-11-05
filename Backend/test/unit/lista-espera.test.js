'use strict';

/**
 * RF-08 · Aviso a la lista de espera (patrón Observer — ADR-009).
 */
const { crearBusEventos, Eventos } = require('../../src/common/bus-eventos');
const { crearAvisoListaEspera } = require('../../src/modules/clases/observer/waitlistNotifier');
const { crearClasesService } = require('../../src/modules/clases/clases.service');
const { loggerMudo } = require('../dobles/fitzone');

/** Doble de ListaEsperaModel con lo justo que usa el oyente. */
function listaEsperaFalsa(entradas) {
  const filas = entradas.map((e) => ({ ...e, save: jest.fn(async () => {}) }));
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
    expect(avisados).toEqual(['u-primero', 'u-ya-avisado']);
  });

  test('si la lista está vacía no pasa nada', async () => {
    const aviso = crearAvisoListaEspera({ ListaEsperaModel: listaEsperaFalsa([]), logger: loggerMudo });
    expect(await aviso({ claseId: 'c1' })).toBeNull();
  });
});

describe('Observer: el bus de eventos', () => {
  test('un evento llega a TODOS los oyentes suscriptos (uno a muchos)', async () => {
    const bus = crearBusEventos({ logger: loggerMudo });
    const oyenteA = jest.fn();
    const oyenteB = jest.fn();
    bus.suscribir('Algo', oyenteA);
    bus.suscribir('Algo', oyenteB);
    await bus.publicar('Algo', { x: 1 });
    expect(oyenteA).toHaveBeenCalledWith(expect.objectContaining({ x: 1 }));
    expect(oyenteB).toHaveBeenCalledWith(expect.objectContaining({ x: 1 }));
  });

  test('un oyente que falla no arrastra a los demás ni al que publicó', async () => {
    const logger = { log: jest.fn(), error: jest.fn() };
    const bus = crearBusEventos({ logger });
    const segundo = jest.fn();
    bus.suscribir('Algo', () => { throw new Error('se cayó el mail'); });
    bus.suscribir('Algo', segundo);

    await expect(bus.publicar('Algo', {})).resolves.toBeUndefined();
    expect(segundo).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('se cayó el mail'));
  });

  test('el evento es inmutable y trae la fecha en que ocurrió', async () => {
    const bus = crearBusEventos({ logger: loggerMudo });
    let evento;
    bus.suscribir('Algo', (e) => { evento = e; });
    await bus.publicar('Algo', { claseId: 'c1' });
    expect(Object.isFrozen(evento)).toBe(true);
    expect(evento.ocurridoEn).toBeInstanceOf(Date);
  });
});

describe('Observer: quien publica', () => {
  test('cancelar una reserva de clase publica CupoLiberado sin saber quién escucha', async () => {
    const eventos = { publicar: jest.fn(async () => {}) };
    const reserva = { id: 'r1', claseId: 'c1', estado: 'CONFIRMADA', save: jest.fn(async () => {}) };
    const clase = { id: 'c1', capacidadMaxima: 10, cuposDisponibles: 0, fechaHora: new Date(Date.now() + 864e5), save: jest.fn(async () => {}) };

    const servicio = crearClasesService({
      ClaseModel: { findByPk: async () => clase },
      ReservaClaseModel: { findByPk: async () => reserva },
      ListaEsperaModel: {}, usuariosService: {}, sedesService: {}, sequelize: {},
      eventos,
    });

    await servicio.cancelarReserva('r1');

    expect(reserva.estado).toBe('CANCELADA');
    expect(eventos.publicar).toHaveBeenCalledWith(Eventos.CUPO_LIBERADO, { claseId: 'c1', reservaId: 'r1' });
  });

  test('cancelar una reserva ya cancelada no vuelve a publicar', async () => {
    const eventos = { publicar: jest.fn() };
    const servicio = crearClasesService({
      ClaseModel: {}, ListaEsperaModel: {}, usuariosService: {}, sedesService: {}, sequelize: {},
      ReservaClaseModel: { findByPk: async () => ({ id: 'r1', estado: 'CANCELADA' }) },
      eventos,
    });
    await servicio.cancelarReserva('r1');
    expect(eventos.publicar).not.toHaveBeenCalled();
  });
});
