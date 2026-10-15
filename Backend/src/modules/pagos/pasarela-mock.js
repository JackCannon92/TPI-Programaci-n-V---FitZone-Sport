'use strict';

const crypto = require('crypto');

/**
 * RF-13 — Pasarela de pago simulada (simulacro de MercadoPago / Modo).
 *
 * Sistema externo del C4. Recibe los datos de tarjeta, los "tokeniza" y
 * devuelve un resultado. Regla de la simulacion: una tarjeta terminada en
 * 0000 se rechaza (para poder demostrar el camino de error).
 */
function crearPasarelaMock() {
  async function cobrar({ monto, tarjeta }) {
    const numero = String(tarjeta.numero || '').replace(/\s+/g, '');
    const token = `tok_${crypto.randomBytes(12).toString('hex')}`;
    const ultimos4 = numero.slice(-4);
    if (numero.endsWith('0000')) {
      return { aprobado: false, token, ultimos4, motivo: 'Fondos insuficientes (simulado)' };
    }
    return { aprobado: true, token, ultimos4, monto };
  }
  return { cobrar };
}

module.exports = { crearPasarelaMock };
