'use strict';

/**
 * RF-11 · Estrategia: descuento para socios.
 *
 * Aplica solo si el usuario es SOCIO con membresía ACTIVA (RN-03): un socio
 * con la cuota vencida paga como un cliente externo.
 */
const DESCUENTO_SOCIO = 0.15;

function crearDescuentoSocio({ porcentaje = DESCUENTO_SOCIO } = {}) {
  return {
    nombre: `Descuento socio (${Math.round(porcentaje * 100)}%)`,
    aplica: (ctx) => ctx.esSocioActivo === true,
    aplicar: (precio) => precio * (1 - porcentaje),
  };
}

module.exports = { crearDescuentoSocio, DESCUENTO_SOCIO };
