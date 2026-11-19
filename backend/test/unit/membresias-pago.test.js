'use strict';

/**
 * RF-02 + RF-13 — Renovar la membresía pagando por la pasarela.
 * La pasarela simulada rechaza las tarjetas terminadas en 0000.
 */
const { crearMembresiasDePrueba, haceDias } = require('../dobles/fitzone');

let servicio;
let membresiasRepo;
const TARJETA_OK = { numero: '4111111111111111', titular: 'Lucía Fernández', vencimiento: '12/30', cvv: '123' };
const TARJETA_RECHAZADA = { ...TARJETA_OK, numero: '4111111111110000' };

beforeEach(() => {
  ({ servicio, membresiasRepo } = crearMembresiasDePrueba());
});

const registrarVencida = () => membresiasRepo.registrar({
  usuario_id: 'u1', plan: 'MENSUAL', estado: 'ACTIVO', fecha_inicio: haceDias(40), fecha_vencimiento: haceDias(10),
});

describe('Pago de la membresía por la pasarela', () => {
  test('con el pago aprobado, renueva el plan elegido y cobra su precio', async () => {
    await registrarVencida();
    const { membresia, pago } = await servicio.pagarYRenovar('u1', 'TRIMESTRAL', TARJETA_OK);
    expect(pago).toMatchObject({ aprobado: true, monto: servicio.PRECIO_PLAN.TRIMESTRAL, ultimos4: '1111' });
    expect(pago.token_pasarela).toMatch(/^tok_/);
    expect(membresia.estado).toBe('ACTIVO');
    expect(membresia.plan).toBe('TRIMESTRAL');
    expect(new Date(membresia.fecha_vencimiento) > new Date()).toBe(true);
  });

  test('con el pago rechazado responde 402 y la membresía no cambia', async () => {
    await registrarVencida();
    await expect(servicio.pagarYRenovar('u1', 'ANUAL', TARJETA_RECHAZADA)).rejects.toMatchObject({ status: 402 });
    const m = await servicio.obtenerMembresia('u1');
    expect(m.plan).toBe('MENSUAL');
    expect(m.estado).toBe('VENCIDO');
  });

  test('un plan que no existe se rechaza sin cobrar', async () => {
    await registrarVencida();
    await expect(servicio.pagarYRenovar('u1', 'SEMANAL', TARJETA_OK)).rejects.toMatchObject({ status: 400 });
  });

  test('no se guarda el número de tarjeta: solo el token y los últimos 4 (ADR-010)', async () => {
    await registrarVencida();
    const { pago } = await servicio.pagarYRenovar('u1', 'MENSUAL', TARJETA_OK);
    expect(JSON.stringify(pago)).not.toContain(TARJETA_OK.numero);
  });
});
