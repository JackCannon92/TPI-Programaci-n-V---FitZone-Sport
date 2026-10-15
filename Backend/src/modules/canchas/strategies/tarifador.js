'use strict';

/**
 * RF-11 · Precio dinámico de canchas — patrón STRATEGY (en su variante acumulativa).
 *
 * El Tarifador es el CONTEXTO del patrón: no sabe qué reglas existen. Recibe un
 * precio base y una lista ordenada de reglas, y aplica en orden las que
 * corresponden a la reserva.
 *
 * Por qué Strategy y no Decorator (ver docs/ADR-007-patrones-unidad-iii.md):
 * las reglas se ACUMULAN sobre el mismo precio (descuento y además recargo).
 * En rigor, recorrer la lista con reduce es una cadena de decoradores armada
 * desde afuera; elegimos el nombre Strategy porque cada regla se puede probar
 * y agregar sola, sin saber que existen las demás.
 *
 * Agregar una regla nueva (ej.: promo 2x1 de los martes) = escribir un archivo
 * nuevo en esta carpeta y sumarlo a la lista en core/compositionRoot.js.
 * Este archivo no se toca.
 */

/**
 * Contrato que cumple cada estrategia (la "interfaz" del patrón; en JS es un
 * contrato por convención, documentado con JSDoc).
 *
 * @typedef {Object} ContextoPrecio
 * @property {{ precioHora: (number|string) }} cancha  La cancha que se cotiza.
 * @property {Date} inicio                               Inicio del turno.
 * @property {boolean} esSocioActivo                     RN-03: socio con membresía activa.
 *
 * @typedef {Object} ReglaDePrecio
 * @property {string} nombre                                       Concepto que se muestra en el detalle.
 * @property {(ctx: ContextoPrecio) => boolean} aplica             ¿Me toca esta reserva?
 * @property {(precio: number, ctx: ContextoPrecio) => number} aplicar  Devuelve el precio nuevo.
 *
 * @typedef {Object} PrecioBase
 * @property {string} nombre
 * @property {(ctx: ContextoPrecio) => number} calcular
 */

const redondear = (monto) => Math.round(monto * 100) / 100;

/**
 * @param {{ precioBase: PrecioBase, reglas: ReglaDePrecio[] }} deps
 */
function crearTarifador({ precioBase, reglas }) {
  if (!precioBase || typeof precioBase.calcular !== 'function') {
    throw new Error('El Tarifador necesita un precio base.');
  }
  if (!Array.isArray(reglas)) {
    throw new Error('El Tarifador necesita una lista de reglas (puede estar vacía).');
  }

  /**
   * @param {ContextoPrecio} ctx
   * @returns {{ precioFinal: number, detalle: { concepto: string, monto: number }[] }}
   */
  function cotizar(ctx) {
    const base = redondear(precioBase.calcular(ctx));
    const detalle = [{ concepto: precioBase.nombre, monto: base }];

    // El ORDEN de la lista es una decisión de negocio, y está escrito en un
    // solo lugar (compositionRoot.js) en vez de depender del orden de unos if.
    const precioFinal = reglas
      .filter((regla) => regla.aplica(ctx))
      .reduce((precio, regla) => {
        const nuevo = redondear(regla.aplicar(precio, ctx));
        detalle.push({ concepto: regla.nombre, monto: redondear(nuevo - precio) });
        return nuevo;
      }, base);

    return { precioFinal, detalle };
  }

  return { cotizar };
}

module.exports = { crearTarifador };
