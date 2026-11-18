'use strict';

/**
 * QR 1 · QR de la reserva de cancha (ADR-016).
 * Sirve para que quien alquiló una cancha (sobre todo el cliente externo) entre a la sede.
 */
const { CANCHA, SOCIO, EXTERNO, crearCanchasDePrueba, crearAccesoDePrueba } = require('../dobles/fitzone');

const MINUTO = 60 * 1000;
const enMinutos = (minutos) => new Date(Math.floor(Date.now() / MINUTO) * MINUTO + minutos * MINUTO);

let canchas;
let acceso;

beforeEach(() => {
  canchas = crearCanchasDePrueba().servicio;
  acceso = crearAccesoDePrueba({ canchasService: canchas });
});

async function reservaPaga(usuario, inicio = enMinutos(10)) {
  const reserva = await canchas.reservar({ canchaId: CANCHA.id, usuarioId: usuario.id, fechaHoraInicio: inicio });
  await canchas.confirmarReserva(reserva.id);
  return reserva;
}

describe('Generar el QR de la reserva', () => {
  test('una reserva paga tiene QR, válido desde 30 minutos antes hasta el fin del turno', async () => {
    const inicio = enMinutos(10);
    const reserva = await reservaPaga(EXTERNO, inicio);
    const qr = await canchas.generarQrReserva(reserva.id);
    expect(qr.validoDesde).toEqual(new Date(inicio.getTime() - 30 * MINUTO));
    expect(qr.validoHasta).toEqual(new Date(inicio.getTime() + 60 * MINUTO));
    expect(qr.svg).toMatch(/^<svg/);
  });

  test('una reserva pendiente de pago no tiene QR (409)', async () => {
    const reserva = await canchas.reservar({ canchaId: CANCHA.id, usuarioId: EXTERNO.id, fechaHoraInicio: enMinutos(10) });
    await expect(canchas.generarQrReserva(reserva.id)).rejects.toMatchObject({ status: 409 });
  });
});

describe('Entrar a la sede con el QR de la reserva', () => {
  test('un cliente externo, sin membresía, entra con el QR de su reserva', async () => {
    const reserva = await reservaPaga(EXTERNO);
    const { token } = await canchas.generarQrReserva(reserva.id);

    const ingreso = await acceso.servicio.registrarIngresoConReserva({ token, sedeId: CANCHA.sedeId });

    expect(ingreso).toMatchObject({ reservaId: reserva.id, usuario: { id: EXTERNO.id, tipo: 'CLIENTE_EXTERNO' } });
    expect(acceso.RegistroAccesoModel.filas).toHaveLength(1);
  });

  test('en otra sede no sirve (403)', async () => {
    const { token } = await canchas.generarQrReserva((await reservaPaga(EXTERNO)).id);
    await expect(acceso.servicio.registrarIngresoConReserva({ token, sedeId: '99999999-9999-4999-8999-999999999999' }))
      .rejects.toMatchObject({ status: 403 });
  });

  test('si la reserva se canceló después de emitir el QR, no deja entrar (409)', async () => {
    const reserva = await reservaPaga(EXTERNO);
    const { token } = await canchas.generarQrReserva(reserva.id);
    await canchas.cancelarReserva(reserva.id);
    await expect(acceso.servicio.registrarIngresoConReserva({ token, sedeId: CANCHA.sedeId }))
      .rejects.toMatchObject({ status: 409 });
  });

  test('antes de los 30 minutos previos al turno todavía no vale (401)', async () => {
    const { token } = await canchas.generarQrReserva((await reservaPaga(EXTERNO, enMinutos(48 * 60))).id);
    await expect(acceso.servicio.registrarIngresoConReserva({ token, sedeId: CANCHA.sedeId }))
      .rejects.toMatchObject({ status: 401, message: expect.stringMatching(/30 minutos antes/) });
  });

  test('un QR inventado no deja entrar (401)', async () => {
    await expect(acceso.servicio.registrarIngresoConReserva({ token: 'abc.def', sedeId: CANCHA.sedeId }))
      .rejects.toMatchObject({ status: 401 });
  });

  test('RN-01: si ya está adentro, no puede volver a entrar (409)', async () => {
    const { token } = await canchas.generarQrReserva((await reservaPaga(SOCIO)).id);
    await acceso.servicio.registrarIngresoConReserva({ token, sedeId: CANCHA.sedeId });
    await expect(acceso.servicio.registrarIngresoConReserva({ token, sedeId: CANCHA.sedeId }))
      .rejects.toMatchObject({ status: 409 });
  });
});
