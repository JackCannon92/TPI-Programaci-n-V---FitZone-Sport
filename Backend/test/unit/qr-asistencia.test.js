'use strict';

/**
 * QR 3 · QR de asistencia a clase (ADR-010).
 * Al escanearlo en el horario de la clase, la reserva pasa a ASISTIO.
 */
const { crearClasesService } = require('../../src/modules/clases/clases.service');

const MINUTO = 60 * 1000;

function crearClasesDePrueba({ minutosHastaLaClase = 10, estado = 'CONFIRMADA' } = {}) {
  const clase = { id: 'clase-1', capacidadMaxima: 10, cuposDisponibles: 9, fechaHora: new Date(Date.now() + minutosHastaLaClase * MINUTO), save: jest.fn() };
  const reserva = { id: 'reserva-1', claseId: clase.id, usuarioId: 'socio-1', estado, save: jest.fn(async () => {}) };
  const servicio = crearClasesService({
    ClaseModel: { findByPk: async () => clase },
    ReservaClaseModel: { findByPk: async (id) => (id === reserva.id ? reserva : null) },
    ListaEsperaModel: {}, usuariosService: {}, sedesService: {}, sequelize: {},
    eventos: { publicar: jest.fn() },
  });
  return { servicio, reserva, clase };
}

describe('QR de asistencia a clase', () => {
  test('el QR vale desde 30 minutos antes hasta 60 minutos después del inicio', async () => {
    const { servicio, clase } = crearClasesDePrueba();
    const qr = await servicio.generarQrAsistencia('reserva-1');
    expect(qr.validoDesde).toEqual(new Date(clase.fechaHora.getTime() - 30 * MINUTO));
    expect(qr.validoHasta).toEqual(new Date(clase.fechaHora.getTime() + 60 * MINUTO));
  });

  test('al escanearlo, la reserva pasa a ASISTIO', async () => {
    const { servicio, reserva } = crearClasesDePrueba();
    const { token } = await servicio.generarQrAsistencia('reserva-1');
    const resultado = await servicio.registrarAsistencia({ token });
    expect(resultado.estado).toBe('ASISTIO');
    expect(reserva.save).toHaveBeenCalled();
  });

  test('escanearlo dos veces no registra la asistencia dos veces (409)', async () => {
    const { servicio } = crearClasesDePrueba();
    const { token } = await servicio.generarQrAsistencia('reserva-1');
    await servicio.registrarAsistencia({ token });
    await expect(servicio.registrarAsistencia({ token })).rejects.toMatchObject({ status: 409 });
  });

  test('antes de los 30 minutos previos a la clase todavía no vale (401)', async () => {
    const { servicio } = crearClasesDePrueba({ minutosHastaLaClase: 24 * 60 });
    const { token } = await servicio.generarQrAsistencia('reserva-1');
    await expect(servicio.registrarAsistencia({ token })).rejects.toMatchObject({ status: 401 });
  });

  test('una reserva cancelada no tiene QR de asistencia (409)', async () => {
    const { servicio } = crearClasesDePrueba({ estado: 'CANCELADA' });
    await expect(servicio.generarQrAsistencia('reserva-1')).rejects.toMatchObject({ status: 409 });
  });

  test('no se puede cancelar una clase a la que ya se asistió (409)', async () => {
    const { servicio } = crearClasesDePrueba({ estado: 'ASISTIO' });
    await expect(servicio.cancelarReserva('reserva-1')).rejects.toMatchObject({ status: 409 });
  });
});
