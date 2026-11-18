'use strict';

/**
 * ADR-007 · Sincronización del terminal de sede.
 *
 * Sin conexión, el terminal valida el QR con la clave pública y guarda cada
 * ingreso en una cola local. Al volver la conexión manda la cola a
 * POST /api/v1/acceso/sincronizar y el servidor la concilia.
 */
const { emitirQrOffline } = require('../../src/acceso/qr-offline');
const { crearAccesoDePrueba, crearCanchasDePrueba, usuariosServiceFalso, SOCIO, EXTERNO, SEDE } = require('../dobles/fitzone');

const HORA = 60 * 60 * 1000;
const OTRA_SEDE = '55555555-5555-4555-8555-555555555555';
const SOCIO_OFFLINE = { usuarioId: SOCIO.id, nombre: SOCIO.nombre_completo, venceMembresia: '2030-12-31' };

const haceHoras = (horas) => new Date(Date.now() - horas * HORA);
/** QR sin conexión emitido hace `horas` horas (el socio lo bajó a su celular). */
const qrEmitidoHace = (horas, socio = SOCIO_OFFLINE) => emitirQrOffline(socio, haceHoras(horas).getTime()).token;

function armar(opciones = {}) {
  const { servicio: canchasService } = crearCanchasDePrueba();
  return crearAccesoDePrueba({ canchasService, ...opciones });
}

describe('Sincronización del terminal: ingresos válidos', () => {
  test('un ingreso sin conexión se registra con la hora en que la persona pasó', async () => {
    const { servicio, RegistroAccesoModel } = armar();
    const cuando = haceHoras(1);

    const r = await servicio.sincronizarIngresos({
      sedeId: SEDE.id,
      ingresos: [{ id: 'ev-1', token: qrEmitidoHace(3), fechaIngreso: cuando.toISOString() }],
    });

    expect(r.resumen).toEqual({ aceptados: 1, duplicados: 0, rechazados: 0, conflictos: 0 });
    expect(r.resultados[0]).toMatchObject({ id: 'ev-1', estado: 'ACEPTADO', usuarioId: SOCIO.id });
    expect(RegistroAccesoModel.filas).toHaveLength(1);
    expect(RegistroAccesoModel.filas[0]).toMatchObject({ usuarioId: SOCIO.id, sedeId: SEDE.id, fechaEgreso: null });
    expect(RegistroAccesoModel.filas[0].fechaIngreso.getTime()).toBe(cuando.getTime());
  });

  test('si el terminal reenvía la cola (se cortó la respuesta), no se duplica', async () => {
    const { servicio, RegistroAccesoModel } = armar();
    const ingresos = [{ id: 'ev-1', token: qrEmitidoHace(3), fechaIngreso: haceHoras(1).toISOString() }];

    await servicio.sincronizarIngresos({ sedeId: SEDE.id, ingresos });
    const segunda = await servicio.sincronizarIngresos({ sedeId: SEDE.id, ingresos });

    expect(segunda.resultados[0]).toMatchObject({ estado: 'DUPLICADO' });
    expect(RegistroAccesoModel.filas).toHaveLength(1);
  });

  test('los procesa en orden de hora, aunque lleguen desordenados', async () => {
    const { servicio, RegistroAccesoModel } = armar();
    const token = qrEmitidoHace(5);
    // Entró a las -3 h y otra vez a las -1 h (salió sin pasar el QR): el primero queda cerrado.
    const r = await servicio.sincronizarIngresos({
      sedeId: SEDE.id,
      ingresos: [
        { id: 'tarde', token, fechaIngreso: haceHoras(1).toISOString() },
        { id: 'temprano', token, fechaIngreso: haceHoras(3).toISOString() },
      ],
    });

    expect(r.resultados.map((x) => x.id)).toEqual(['temprano', 'tarde']);
    const [primero, segundo] = RegistroAccesoModel.filas;
    expect(primero.fechaEgreso.getTime()).toBe(segundo.fechaIngreso.getTime());
    expect(segundo.fechaEgreso).toBeNull();
  });
});

describe('Sincronización del terminal: el servidor no confía en el terminal', () => {
  test('un QR alterado se rechaza', async () => {
    const { servicio, RegistroAccesoModel } = armar();
    const [cuerpo] = qrEmitidoHace(2).split('.');
    const r = await servicio.sincronizarIngresos({
      sedeId: SEDE.id,
      ingresos: [{ id: 'ev-1', token: `${cuerpo}.firmaTrucha`, fechaIngreso: haceHoras(1).toISOString() }],
    });
    expect(r.resultados[0]).toEqual({ id: 'ev-1', estado: 'RECHAZADO', motivo: 'FIRMA_INVALIDA' });
    expect(RegistroAccesoModel.filas).toHaveLength(0);
  });

  test('un QR que ya estaba vencido cuando la persona pasó se rechaza', async () => {
    const { servicio } = armar();
    const r = await servicio.sincronizarIngresos({
      sedeId: SEDE.id,
      ingresos: [{ id: 'ev-1', token: qrEmitidoHace(30), fechaIngreso: haceHoras(1).toISOString() }],
    });
    expect(r.resultados[0]).toMatchObject({ estado: 'RECHAZADO', motivo: 'QR_VENCIDO_AL_INGRESAR' });
  });

  test('un ingreso con fecha futura o anterior a la emisión del QR se rechaza', async () => {
    const { servicio } = armar();
    const token = qrEmitidoHace(2);
    const r = await servicio.sincronizarIngresos({
      sedeId: SEDE.id,
      ingresos: [
        { id: 'futuro', token, fechaIngreso: new Date(Date.now() + HORA).toISOString() },
        { id: 'antes', token, fechaIngreso: haceHoras(4).toISOString() },
      ],
    });
    expect(r.resultados).toEqual([
      { id: 'antes', estado: 'RECHAZADO', motivo: 'ANTERIOR_A_LA_EMISION' },
      { id: 'futuro', estado: 'RECHAZADO', motivo: 'FECHA_FUTURA' },
    ]);
  });

  test('un QR firmado para un usuario que no existe se rechaza', async () => {
    const { servicio } = armar();
    const fantasma = { usuarioId: '99999999-9999-4999-8999-999999999999', nombre: 'Nadie', venceMembresia: '2030-12-31' };
    const r = await servicio.sincronizarIngresos({
      sedeId: SEDE.id,
      ingresos: [{ id: 'ev-1', token: qrEmitidoHace(2, fantasma), fechaIngreso: haceHoras(1).toISOString() }],
    });
    expect(r.resultados[0]).toMatchObject({ estado: 'RECHAZADO', motivo: 'USUARIO_INEXISTENTE' });
  });
});

describe('Sincronización del terminal: conflictos (prevalece lo que pasó)', () => {
  test('RN-01: si figuraba adentro de otra sede, ese registro se cierra a la hora del ingreso nuevo', async () => {
    const { servicio, RegistroAccesoModel } = armar();
    const anterior = await RegistroAccesoModel.create({ usuarioId: SOCIO.id, sedeId: OTRA_SEDE, fechaIngreso: haceHoras(4) });
    const cuando = haceHoras(1);

    const r = await servicio.sincronizarIngresos({
      sedeId: SEDE.id,
      ingresos: [{ id: 'ev-1', token: qrEmitidoHace(2), fechaIngreso: cuando.toISOString() }],
    });

    expect(r.resultados[0]).toMatchObject({ estado: 'ACEPTADO', conflicto: expect.stringMatching(/RN-01.*otra sede/) });
    expect(r.resumen.conflictos).toBe(1);
    expect(anterior.fechaEgreso.getTime()).toBe(cuando.getTime());
    expect(RegistroAccesoModel.filas.filter((f) => f.fechaEgreso === null)).toHaveLength(1);
  });

  test('RN-01: si después entró a otra sede con conexión, este queda como histórico cerrado', async () => {
    const { servicio, RegistroAccesoModel } = armar();
    const posterior = await RegistroAccesoModel.create({ usuarioId: SOCIO.id, sedeId: OTRA_SEDE, fechaIngreso: haceHoras(1) });

    const r = await servicio.sincronizarIngresos({
      sedeId: SEDE.id,
      ingresos: [{ id: 'ev-1', token: qrEmitidoHace(4), fechaIngreso: haceHoras(3).toISOString() }],
    });

    expect(r.resultados[0].conflicto).toMatch(/histórico/);
    const historico = RegistroAccesoModel.filas.find((f) => f.sedeId === SEDE.id);
    expect(historico.fechaEgreso.getTime()).toBe(posterior.fechaIngreso.getTime());
    expect(posterior.fechaEgreso).toBeNull();
  });

  test('si la membresía se suspendió durante el corte, el ingreso se registra con una observación', async () => {
    const { servicio, RegistroAccesoModel } = armar({ usuariosService: { ...usuariosServiceFalso, esSocioActivo: () => false } });
    const r = await servicio.sincronizarIngresos({
      sedeId: SEDE.id,
      ingresos: [{ id: 'ev-1', token: qrEmitidoHace(2), fechaIngreso: haceHoras(1).toISOString() }],
    });
    expect(r.resultados[0]).toMatchObject({ estado: 'ACEPTADO', conflicto: expect.stringMatching(/membresía/) });
    expect(RegistroAccesoModel.filas).toHaveLength(1);
  });

  test('el aforo no frena la sincronización, pero avisa que quedó excedido', async () => {
    const logger = { log: jest.fn(), error: jest.fn() };
    const { servicio, RegistroAccesoModel } = armar({ sede: { ...SEDE, aforoMaximo: 1 }, logger });
    await RegistroAccesoModel.create({ usuarioId: EXTERNO.id, sedeId: SEDE.id });

    const r = await servicio.sincronizarIngresos({
      sedeId: SEDE.id,
      ingresos: [{ id: 'ev-1', token: qrEmitidoHace(2), fechaIngreso: haceHoras(1).toISOString() }],
    });

    expect(r.resumen.aceptados).toBe(1);
    expect(r.aforo).toEqual({ actual: 2, maximo: 1, excedido: true });
  });
});
