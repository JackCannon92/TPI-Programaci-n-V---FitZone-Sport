'use strict';

/**
 * Reservas de cancha con el repositorio EN MEMORIA (patrón Repository).
 * Correr con:  node --test
 *
 * El servicio real de canchas, el tarifador real y el repositorio en memoria:
 * se prueba el dominio entero sin base de datos.
 */
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const { crearCanchasService } = require('../src/modules/canchas/canchas.service');
const { crearReservasRepositoryMemoria } = require('../src/modules/canchas/repositorio/reservas.memoria');
const { TurnoYaReservadoError } = require('../src/modules/canchas/repositorio/reservas.puerto');
const { crearTarifador } = require('../src/modules/canchas/strategies/tarifador');
const { crearPrecioEstandar } = require('../src/modules/canchas/strategies/standarPricing');
const { crearDescuentoSocio } = require('../src/modules/canchas/strategies/memberDiscountPricing');
const { crearRecargoHorarioPico } = require('../src/modules/canchas/strategies/peakHourPricing');

const CANCHA = { id: 'cancha-1', sedeId: 'sede-1', nombre: 'Padel 1', precioHora: '1000.00', estado: 'DISPONIBLE' };
const SOCIO = { id: 'socio-1', tipo: 'SOCIO', membresia: { estado: 'ACTIVO' } };
const EXTERNO = { id: 'externo-1', tipo: 'CLIENTE_EXTERNO', membresia: null };
const TURNO_PICO = new Date(2030, 4, 15, 19, 0);

// Dobles de prueba de lo que no es parte de lo que se prueba
const CanchaModelFalso = { findByPk: async (id) => (id === CANCHA.id ? { ...CANCHA } : null) };
const usuariosServiceFalso = {
  obtenerUsuario: async (id) => [SOCIO, EXTERNO].find((u) => u.id === id),
  esSocioActivo: (u) => u.tipo === 'SOCIO' && u.membresia?.estado === 'ACTIVO',
};

let servicio;
let repo;

beforeEach(() => {
  repo = crearReservasRepositoryMemoria();
  servicio = crearCanchasService({
    CanchaModel: CanchaModelFalso,
    reservasRepo: repo,
    tarifador: crearTarifador({
      precioBase: crearPrecioEstandar(),
      reglas: [crearDescuentoSocio(), crearRecargoHorarioPico()],
    }),
    usuariosService: usuariosServiceFalso,
    sedesService: { obtenerSede: async () => ({}) },
  });
});

describe('Reservar una cancha', () => {
  test('la reserva guarda el precio que calculó el tarifador y queda pendiente de pago', async () => {
    const reserva = await servicio.reservar({ canchaId: CANCHA.id, usuarioId: SOCIO.id, fechaHoraInicio: TURNO_PICO });
    assert.equal(reserva.precioFinal, 1020); // socio en pico
    assert.equal(reserva.estado, 'PENDIENTE_PAGO');
    assert.equal(reserva.detallePrecio.length, 3);
    assert.equal(reserva.fechaHoraFin - reserva.fechaHoraInicio, 60 * 60 * 1000);
  });

  test('RN-02: el mismo turno no se puede reservar dos veces (409)', async () => {
    await servicio.reservar({ canchaId: CANCHA.id, usuarioId: SOCIO.id, fechaHoraInicio: TURNO_PICO });
    await assert.rejects(
      servicio.reservar({ canchaId: CANCHA.id, usuarioId: EXTERNO.id, fechaHoraInicio: TURNO_PICO }),
      (error) => error instanceof TurnoYaReservadoError && error.status === 409
    );
  });

  test('RN-02: al cancelar se libera el turno y otro lo puede tomar', async () => {
    const primera = await servicio.reservar({ canchaId: CANCHA.id, usuarioId: SOCIO.id, fechaHoraInicio: TURNO_PICO });
    await servicio.cancelarReserva(primera.id);
    const segunda = await servicio.reservar({ canchaId: CANCHA.id, usuarioId: EXTERNO.id, fechaHoraInicio: TURNO_PICO });
    assert.equal(segunda.precioFinal, 1200); // externo en pico
  });

  test('una cancha en mantenimiento no se puede reservar', async () => {
    const enMantenimiento = crearCanchasService({
      CanchaModel: { findByPk: async () => ({ ...CANCHA, estado: 'MANTENIMIENTO' }) },
      reservasRepo: repo, tarifador: { cotizar: () => assert.fail('no debería cotizar') },
      usuariosService: usuariosServiceFalso, sedesService: {},
    });
    await assert.rejects(
      enMantenimiento.reservar({ canchaId: CANCHA.id, usuarioId: SOCIO.id, fechaHoraInicio: TURNO_PICO }),
      (error) => error.status === 409
    );
  });
});

describe('Disponibilidad y estados', () => {
  test('la grilla marca ocupado el turno reservado y pico de 19 a 21', async () => {
    await servicio.reservar({ canchaId: CANCHA.id, usuarioId: SOCIO.id, fechaHoraInicio: TURNO_PICO });
    const { slots } = await servicio.disponibilidad(CANCHA.id, '2030-05-15');
    const slot = (hora) => slots.find((s) => s.hora === hora);
    assert.equal(slot('19:00').disponible, false);
    assert.equal(slot('18:00').disponible, true);
    assert.deepEqual(slots.filter((s) => s.pico).map((s) => s.hora), ['19:00', '20:00']);
  });

  test('confirmar una reserva la pasa a CONFIRMADA y una inexistente da 404', async () => {
    const reserva = await servicio.reservar({ canchaId: CANCHA.id, usuarioId: SOCIO.id, fechaHoraInicio: TURNO_PICO });
    const confirmada = await servicio.confirmarReserva(reserva.id);
    assert.equal(confirmada.estado, 'CONFIRMADA');
    await assert.rejects(servicio.obtenerReserva('no-existe'), (error) => error.status === 404);
  });

  test('el repositorio devuelve copias: modificar lo que devuelve no cambia lo guardado', async () => {
    const reserva = await servicio.reservar({ canchaId: CANCHA.id, usuarioId: SOCIO.id, fechaHoraInicio: TURNO_PICO });
    reserva.estado = 'CANCELADA';
    assert.equal((await servicio.obtenerReserva(reserva.id)).estado, 'PENDIENTE_PAGO');
  });
});
