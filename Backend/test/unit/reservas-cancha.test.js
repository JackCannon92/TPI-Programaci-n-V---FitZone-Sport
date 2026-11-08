'use strict';

/**
 * Reservas de cancha con el repositorio EN MEMORIA (patrón Repository — ADR-014).
 * El servicio real de canchas, el Tarifador real y el repositorio en memoria.
 */
const { crearCanchasService } = require('../../src/modules/canchas/canchas.service');
const { TurnoYaReservadoError } = require('../../src/modules/canchas/repositorio/reservas.puerto');
const { CANCHA, SOCIO, EXTERNO, TURNO_PICO, crearCanchasDePrueba, usuariosServiceFalso, canchaModelFalso } = require('../dobles/fitzone');

let servicio;
let reservasRepo;

beforeEach(() => {
  ({ servicio, reservasRepo } = crearCanchasDePrueba());
});

const reservar = (usuario) => servicio.reservar({ canchaId: CANCHA.id, usuarioId: usuario.id, fechaHoraInicio: TURNO_PICO });

describe('Reservar una cancha', () => {
  test('la reserva guarda el precio que calculó el Tarifador y queda pendiente de pago', async () => {
    const reserva = await reservar(SOCIO);
    expect(reserva.precioFinal).toBe(1020); // socio en horario pico
    expect(reserva.estado).toBe('PENDIENTE_PAGO');
    expect(reserva.detallePrecio).toHaveLength(3);
    expect(reserva.fechaHoraFin - reserva.fechaHoraInicio).toBe(60 * 60 * 1000);
  });

  test('RN-02: el mismo turno no se puede reservar dos veces (409)', async () => {
    await reservar(SOCIO);
    const intento = reservar(EXTERNO);
    await expect(intento).rejects.toBeInstanceOf(TurnoYaReservadoError);
    await expect(reservar(EXTERNO)).rejects.toMatchObject({ status: 409 });
  });

  test('RN-02: al cancelar se libera el turno y otro lo puede tomar', async () => {
    const primera = await reservar(SOCIO);
    await servicio.cancelarReserva(primera.id);
    const segunda = await reservar(EXTERNO);
    expect(segunda.precioFinal).toBe(1200); // externo en pico
  });

  test('una cancha en mantenimiento no se puede reservar (409)', async () => {
    const tarifador = { cotizar: jest.fn() };
    const enMantenimiento = crearCanchasService({
      CanchaModel: canchaModelFalso({ ...CANCHA, estado: 'MANTENIMIENTO' }),
      reservasRepo, tarifador, usuariosService: usuariosServiceFalso, sedesService: {},
    });
    await expect(enMantenimiento.reservar({ canchaId: CANCHA.id, usuarioId: SOCIO.id, fechaHoraInicio: TURNO_PICO }))
      .rejects.toMatchObject({ status: 409 });
    expect(tarifador.cotizar).not.toHaveBeenCalled();
  });
});

describe('Disponibilidad y estados', () => {
  test('la grilla marca ocupado el turno reservado y el pico de 19 a 21', async () => {
    await reservar(SOCIO);
    const { slots } = await servicio.disponibilidad(CANCHA.id, '2030-05-15');
    const slot = (hora) => slots.find((s) => s.hora === hora);
    expect(slot('19:00').disponible).toBe(false);
    expect(slot('18:00').disponible).toBe(true);
    expect(slots.filter((s) => s.pico).map((s) => s.hora)).toEqual(['19:00', '20:00']);
  });

  test('confirmar una reserva la pasa a CONFIRMADA; una inexistente da 404', async () => {
    const reserva = await reservar(SOCIO);
    expect((await servicio.confirmarReserva(reserva.id)).estado).toBe('CONFIRMADA');
    await expect(servicio.obtenerReserva('no-existe')).rejects.toMatchObject({ status: 404 });
  });

  test('el repositorio devuelve copias: modificar lo que devuelve no cambia lo guardado', async () => {
    const reserva = await reservar(SOCIO);
    reserva.estado = 'CANCELADA';
    expect((await servicio.obtenerReserva(reserva.id)).estado).toBe('PENDIENTE_PAGO');
  });
});
