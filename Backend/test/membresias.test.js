'use strict';

/**
 * RF-02 · Membresías con el repositorio EN MEMORIA (patrón Repository).
 * Correr con:  node --test
 *
 * Estos tests fijan el comportamiento que ya tenía el servicio de Franco
 * (tests de caracterización): el refactoring hacia Repository no lo cambió.
 */
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const { crearMembresiasService } = require('../src/modules/membresias/membresias.service');
const { crearMembresiasRepositoryMemoria } = require('../src/modules/membresias/repositorio/membresias.memoria');
const { MembresiaDuplicadaError } = require('../src/modules/membresias/repositorio/membresias.puerto');

let repo;
let servicio;

beforeEach(() => {
  repo = crearMembresiasRepositoryMemoria();
  servicio = crearMembresiasService({ membresiasRepo: repo });
});

const haceDias = (dias) => new Date(Date.now() - dias * 864e5);

describe('Membresías', () => {
  test('asignar un plan TRIMESTRAL vence en 3 meses y arranca ACTIVO', async () => {
    const m = await servicio.asignarMembresia('u1', 'TRIMESTRAL');
    const esperado = new Date(m.fecha_inicio); esperado.setMonth(esperado.getMonth() + 3);
    assert.equal(m.estado, 'ACTIVO');
    assert.equal(new Date(m.fecha_vencimiento).toDateString(), esperado.toDateString());
  });

  test('un plan inexistente se rechaza', async () => {
    await assert.rejects(servicio.asignarMembresia('u1', 'SEMANAL'), /Plan elegido no es valido/);
  });

  test('un socio no puede tener dos membresías (409)', async () => {
    await servicio.asignarMembresia('u1', 'MENSUAL');
    await assert.rejects(
      servicio.asignarMembresia('u1', 'ANUAL'),
      (e) => e instanceof MembresiaDuplicadaError && e.status === 409
    );
  });

  test('al consultarla, una membresía ACTIVO con la fecha vencida pasa a VENCIDO y queda guardada', async () => {
    await repo.registrar({ usuario_id: 'u1', plan: 'MENSUAL', estado: 'ACTIVO', fecha_inicio: haceDias(40), fecha_vencimiento: haceDias(10) });
    const m = await servicio.obtenerMembresia('u1');
    assert.equal(m.estado, 'VENCIDO');
    assert.equal((await repo.deUsuario('u1')).estado, 'VENCIDO');
  });

  test('renovar una ACTIVA suma meses a su vencimiento actual, no a hoy', async () => {
    const enDiezDias = new Date(Date.now() + 10 * 864e5);
    await repo.registrar({ usuario_id: 'u1', plan: 'MENSUAL', estado: 'ACTIVO', fecha_inicio: haceDias(20), fecha_vencimiento: enDiezDias });
    const m = await servicio.renovarMembresia('u1', 'MENSUAL');
    const esperado = new Date(enDiezDias); esperado.setMonth(esperado.getMonth() + 1);
    assert.equal(new Date(m.fecha_vencimiento).toDateString(), esperado.toDateString());
  });

  test('renovar una VENCIDA la reactiva contando desde hoy', async () => {
    await repo.registrar({ usuario_id: 'u1', plan: 'MENSUAL', estado: 'ACTIVO', fecha_inicio: haceDias(40), fecha_vencimiento: haceDias(10) });
    const m = await servicio.renovarMembresia('u1', 'MENSUAL');
    const esperado = new Date(); esperado.setMonth(esperado.getMonth() + 1);
    assert.equal(m.estado, 'ACTIVO');
    assert.equal(new Date(m.fecha_vencimiento).toDateString(), esperado.toDateString());
  });

  test('RAREZA documentada (olor O-6): al renovar una VENCIDA, fecha_inicio NO se actualiza', async () => {
    // Test de caracterización: fija lo que el código hace HOY, aunque no sea lo deseado.
    // Cuando se corrija O-6 en un commit funcional, este test tiene que cambiar a propósito.
    const inicioViejo = haceDias(40);
    await repo.registrar({ usuario_id: 'u1', plan: 'MENSUAL', estado: 'ACTIVO', fecha_inicio: inicioViejo, fecha_vencimiento: haceDias(10) });
    const m = await servicio.renovarMembresia('u1', 'MENSUAL');
    assert.equal(new Date(m.fecha_inicio).getTime(), inicioViejo.getTime());
  });

  test('suspender deja la membresía en SUSPENDIDO', async () => {
    await servicio.asignarMembresia('u1', 'ANUAL');
    assert.equal((await servicio.cancelarMembresia('u1')).estado, 'SUSPENDIDO');
  });
});
