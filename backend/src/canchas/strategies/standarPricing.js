'use strict';

/**
 * RF-11 · Precio estándar.
 *
 * No es una regla más de la lista: es la semilla sobre la que el Tarifador
 * aplica las reglas. Lo que paga cualquiera (socio o externo) antes de
 * descuentos y recargos: el precio por hora cargado en la cancha.
 */
function crearPrecioEstandar() {
  return {
    nombre: 'Precio base',
    calcular: ({ cancha }) => Number(cancha.precioHora),
  };
}

module.exports = { crearPrecioEstandar };
