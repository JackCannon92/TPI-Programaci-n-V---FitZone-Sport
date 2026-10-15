'use strict';

/**
 * RF-11 · Precio dinámico de canchas (patrón Strategy).
 * Correr con:  node --test
 *
 * Cada regla se prueba sola, sin base de datos, sin Express y sin red.
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { crearTarifador } = require('../src/modules/canchas/strategies/tarifador');
const { crearPrecioEstandar } = require('../src/modules/canchas/strategies/standarPricing');
const { crearDescuentoSocio } = require('../src/modules/canchas/strategies/memberDiscountPricing');
const { crearRecargoHorarioPico, esHorarioPico } = require('../src/modules/canchas/strategies/peakHourPricing');

const cancha = { precioHora: '1000.00' }; // Sequelize devuelve los DECIMAL como string
const aLas = (hora, minutos = 0) => new Date(2030, 4, 15, hora, minutos); // 15/05/2030, hora local

// La misma cadena que arma compositionRoot.js
const tarifadorFitZone = () => crearTarifador({
  precioBase: crearPrecioEstandar(),
  reglas: [crearDescuentoSocio(), crearRecargoHorarioPico()],
});

describe('Tarifador con las reglas de FitZone', () => {
  test('un cliente externo fuera del horario pico paga el precio base', () => {
    const { precioFinal, detalle } = tarifadorFitZone().cotizar({ cancha, inicio: aLas(10), esSocioActivo: false });
    assert.equal(precioFinal, 1000);
    assert.deepEqual(detalle, [{ concepto: 'Precio base', monto: 1000 }]);
  });

  test('un socio activo tiene 15% de descuento', () => {
    const { precioFinal } = tarifadorFitZone().cotizar({ cancha, inicio: aLas(10), esSocioActivo: true });
    assert.equal(precioFinal, 850);
  });

  test('un socio con la cuota vencida paga como externo (RN-03)', () => {
    // esSocioActivo=false es lo que devuelve usuariosService para un socio VENCIDO
    const { precioFinal } = tarifadorFitZone().cotizar({ cancha, inicio: aLas(10), esSocioActivo: false });
    assert.equal(precioFinal, 1000);
  });

  test('en horario pico se cobra 20% de recargo', () => {
    const { precioFinal } = tarifadorFitZone().cotizar({ cancha, inicio: aLas(19), esSocioActivo: false });
    assert.equal(precioFinal, 1200);
  });

  test('socio en horario pico: el recargo se calcula sobre el precio YA descontado', () => {
    // El orden de la lista es una decisión de negocio: 1000 → 850 → 1020 (no 1000 → 1200 → 1020 por casualidad).
    const { precioFinal, detalle } = tarifadorFitZone().cotizar({ cancha, inicio: aLas(20, 30), esSocioActivo: true });
    assert.equal(precioFinal, 1020);
    assert.deepEqual(detalle, [
      { concepto: 'Precio base', monto: 1000 },
      { concepto: 'Descuento socio (15%)', monto: -150 },
      { concepto: 'Recargo horario pico (20%)', monto: 170 },
    ]);
  });

  test('la suma del detalle siempre da el precio final', () => {
    const { precioFinal, detalle } = tarifadorFitZone()
      .cotizar({ cancha: { precioHora: '7333.33' }, inicio: aLas(19), esSocioActivo: true });
    const suma = Math.round(detalle.reduce((acc, d) => acc + d.monto, 0) * 100) / 100;
    assert.equal(suma, precioFinal);
  });
});

describe('Cada estrategia por separado', () => {
  test('descuento socio: solo aplica a socios activos', () => {
    const regla = crearDescuentoSocio();
    assert.equal(regla.aplica({ esSocioActivo: true }), true);
    assert.equal(regla.aplica({ esSocioActivo: false }), false);
    assert.equal(regla.aplicar(1000), 850);
  });

  test('horario pico: de 19:00 a 20:59; el turno de las 21:00 ya no es pico', () => {
    assert.equal(esHorarioPico(aLas(18, 59)), false);
    assert.equal(esHorarioPico(aLas(19, 0)), true);
    assert.equal(esHorarioPico(aLas(20, 59)), true);
    assert.equal(esHorarioPico(aLas(21, 0)), false);
  });

  test('los porcentajes se pueden configurar sin tocar el código de la regla', () => {
    assert.equal(crearDescuentoSocio({ porcentaje: 0.10 }).aplicar(1000), 900);
    assert.equal(crearRecargoHorarioPico({ porcentaje: 0.5 }).aplicar(1000), 1500);
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
    assert.equal(tarifador.cotizar({ cancha, inicio: martes, esSocioActivo: false }).precioFinal, 900);
  });
});
