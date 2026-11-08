'use strict';

/**
 * RF-11 · Precio dinámico de canchas (patrón Strategy — ADR-013).
 * Cada regla se prueba sola, sin base de datos, sin Express y sin red.
 */
const { crearTarifador } = require('../../src/modules/canchas/strategies/tarifador');
const { crearPrecioEstandar } = require('../../src/modules/canchas/strategies/standarPricing');
const { crearDescuentoSocio } = require('../../src/modules/canchas/strategies/memberDiscountPricing');
const { crearRecargoHorarioPico, esHorarioPico } = require('../../src/modules/canchas/strategies/peakHourPricing');
const { tarifadorFitZone } = require('../dobles/fitzone');

const cancha = { precioHora: '1000.00' };
const aLas = (hora, minutos = 0) => new Date(2030, 4, 15, hora, minutos);

describe('Tarifador con las reglas de FitZone', () => {
  test('un cliente externo fuera del horario pico paga el precio base', () => {
    const { precioFinal, detalle } = tarifadorFitZone().cotizar({ cancha, inicio: aLas(10), esSocioActivo: false });
    expect(precioFinal).toBe(1000);
    expect(detalle).toEqual([{ concepto: 'Precio base', monto: 1000 }]);
  });

  test('un socio activo tiene 15% de descuento', () => {
    expect(tarifadorFitZone().cotizar({ cancha, inicio: aLas(10), esSocioActivo: true }).precioFinal).toBe(850);
  });

  test('un socio con la cuota vencida paga como externo (RN-03)', () => {
    // esSocioActivo=false es lo que devuelve usuariosService para un socio VENCIDO
    expect(tarifadorFitZone().cotizar({ cancha, inicio: aLas(10), esSocioActivo: false }).precioFinal).toBe(1000);
  });

  test('en horario pico se cobra 20% de recargo', () => {
    expect(tarifadorFitZone().cotizar({ cancha, inicio: aLas(19), esSocioActivo: false }).precioFinal).toBe(1200);
  });

  test('socio en horario pico: el recargo se calcula sobre el precio YA descontado', () => {
    // El orden de la lista es una decisión de negocio: 1000 → 850 → 1020.
    const { precioFinal, detalle } = tarifadorFitZone().cotizar({ cancha, inicio: aLas(20, 30), esSocioActivo: true });
    expect(precioFinal).toBe(1020);
    expect(detalle).toEqual([
      { concepto: 'Precio base', monto: 1000 },
      { concepto: 'Descuento socio (15%)', monto: -150 },
      { concepto: 'Recargo horario pico (20%)', monto: 170 },
    ]);
  });

  test('la suma del detalle siempre da el precio final', () => {
    const { precioFinal, detalle } = tarifadorFitZone()
      .cotizar({ cancha: { precioHora: '7333.33' }, inicio: aLas(19), esSocioActivo: true });
    const suma = Math.round(detalle.reduce((acc, d) => acc + d.monto, 0) * 100) / 100;
    expect(suma).toBe(precioFinal);
  });

  test('sin precio base no se puede armar el Tarifador', () => {
    expect(() => crearTarifador({ reglas: [] })).toThrow('precio base');
  });
});

describe('Cada estrategia por separado', () => {
  test('descuento socio: solo aplica a socios activos', () => {
    const regla = crearDescuentoSocio();
    expect(regla.aplica({ esSocioActivo: true })).toBe(true);
    expect(regla.aplica({ esSocioActivo: false })).toBe(false);
    expect(regla.aplicar(1000)).toBe(850);
  });

  test.each([
    ['18:59', 18, 59, false],
    ['19:00', 19, 0, true],
    ['20:59', 20, 59, true],
    ['21:00', 21, 0, false],
  ])('horario pico a las %s → %s', (_, hora, minutos, esperado) => {
    expect(esHorarioPico(aLas(hora, minutos))).toBe(esperado);
  });

  test('los porcentajes se configuran sin tocar el código de la regla', () => {
    expect(crearDescuentoSocio({ porcentaje: 0.10 }).aplicar(1000)).toBe(900);
    expect(crearRecargoHorarioPico({ porcentaje: 0.5 }).aplicar(1000)).toBe(1500);
  });
});

describe('Principio abierto/cerrado', () => {
  test('una regla nueva se agrega a la lista sin modificar el Tarifador', () => {
    const promoMartes = {
      nombre: 'Promo martes (-$100)',
      aplica: ({ inicio }) => inicio.getDay() === 2,
      aplicar: (precio) => precio - 100,
    };
    const tarifador = crearTarifador({
      precioBase: crearPrecioEstandar(),
      reglas: [crearDescuentoSocio(), crearRecargoHorarioPico(), promoMartes],
    });
    const martes = new Date(2030, 4, 14, 10, 0); // 14/05/2030 es martes
    expect(tarifador.cotizar({ cancha, inicio: martes, esSocioActivo: false }).precioFinal).toBe(900);
  });
});
