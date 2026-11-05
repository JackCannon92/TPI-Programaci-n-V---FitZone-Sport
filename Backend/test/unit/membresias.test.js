'use strict';

/**
 * RF-02 · Membresías con el repositorio EN MEMORIA (patrón Repository — ADR-008).
 *
 * Tests de caracterización: fijan el comportamiento que ya tenía el servicio
 * original (verificados también contra esa versión). El refactoring hacia
 * Repository no lo cambió.
 */
const { MembresiaDuplicadaError } = require('../../src/modules/membresias/repositorio/membresias.puerto');
const { crearMembresiasDePrueba, haceDias } = require('../dobles/fitzone');

let servicio;
let membresiasRepo;

beforeEach(() => {
  ({ servicio, membresiasRepo } = crearMembresiasDePrueba());
});

const mismoDia = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();
const sumarMeses = (fecha, meses) => { const d = new Date(fecha); d.setMonth(d.getMonth() + meses); return d; };
const registrarVencida = (inicio = haceDias(40)) => membresiasRepo.registrar({
  usuario_id: 'u1', plan: 'MENSUAL', estado: 'ACTIVO', fecha_inicio: inicio, fecha_vencimiento: haceDias(10),
});

describe('Membresías', () => {
  test('asignar un plan TRIMESTRAL vence en 3 meses y arranca ACTIVO', async () => {
    const m = await servicio.asignarMembresia('u1', 'TRIMESTRAL');
    expect(m.estado).toBe('ACTIVO');
    expect(mismoDia(m.fecha_vencimiento, sumarMeses(m.fecha_inicio, 3))).toBe(true);
  });

  test('un plan inexistente se rechaza', async () => {
    await expect(servicio.asignarMembresia('u1', 'SEMANAL')).rejects.toThrow('Plan elegido no es valido');
  });

  test('un socio no puede tener dos membresías (409)', async () => {
    await servicio.asignarMembresia('u1', 'MENSUAL');
    const segunda = servicio.asignarMembresia('u1', 'ANUAL');
    await expect(segunda).rejects.toBeInstanceOf(MembresiaDuplicadaError);
    await expect(servicio.asignarMembresia('u1', 'ANUAL')).rejects.toMatchObject({ status: 409 });
  });

  test('al consultarla, una membresía ACTIVO con la fecha vencida pasa a VENCIDO y queda guardada', async () => {
    await registrarVencida();
    expect((await servicio.obtenerMembresia('u1')).estado).toBe('VENCIDO');
    expect((await membresiasRepo.deUsuario('u1')).estado).toBe('VENCIDO');
  });

  test('renovar una ACTIVA suma meses a su vencimiento actual, no a hoy', async () => {
    const enDiezDias = new Date(Date.now() + 10 * 864e5);
    await membresiasRepo.registrar({ usuario_id: 'u1', plan: 'MENSUAL', estado: 'ACTIVO', fecha_inicio: haceDias(20), fecha_vencimiento: enDiezDias });
    const m = await servicio.renovarMembresia('u1', 'MENSUAL');
    expect(mismoDia(m.fecha_vencimiento, sumarMeses(enDiezDias, 1))).toBe(true);
  });

  test('renovar una VENCIDA la reactiva contando desde hoy', async () => {
    await registrarVencida();
    const m = await servicio.renovarMembresia('u1', 'MENSUAL');
    expect(m.estado).toBe('ACTIVO');
    expect(mismoDia(m.fecha_vencimiento, sumarMeses(new Date(), 1))).toBe(true);
  });

  test('RAREZA documentada (olor O-6): al renovar una VENCIDA, fecha_inicio NO se actualiza', async () => {
    // Fija lo que el código hace HOY, aunque no sea lo deseado. Cuando se
    // corrija O-6 en un commit funcional, este test tiene que cambiar a propósito.
    const inicioViejo = haceDias(40);
    await registrarVencida(inicioViejo);
    const m = await servicio.renovarMembresia('u1', 'MENSUAL');
    expect(new Date(m.fecha_inicio).getTime()).toBe(inicioViejo.getTime());
  });

  test('suspender deja la membresía en SUSPENDIDO', async () => {
    await servicio.asignarMembresia('u1', 'ANUAL');
    expect((await servicio.cancelarMembresia('u1')).estado).toBe('SUSPENDIDO');
  });
});
