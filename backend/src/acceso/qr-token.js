'use strict';

const crypto = require('crypto');

/**
 * RF-04 — Codigo QR dinamico del socio.
 *
 * El QR codifica un token que cambia cada minuto, para que una captura de
 * pantalla deje de servir enseguida. No se guarda nada en la base: el token
 * es un HMAC (secreto del servidor) sobre `usuarioId + minuto actual`, y al
 * validarlo se vuelve a calcular. Se acepta tambien el minuto anterior para
 * tolerar el desfase entre generar el QR y escanearlo.
 *
 * Formato: <usuarioId>.<minuto>.<firma>
 */
const SECRET = process.env.QR_SECRET || 'fitzone-dev-secret-cambiar-en-produccion';
const VENTANA_MINUTOS = 1;

function minutoActual() {
  return Math.floor(Date.now() / 60000);
}

function firmar(usuarioId, minuto) {
  return crypto.createHmac('sha256', SECRET).update(`${usuarioId}:${minuto}`).digest('hex').slice(0, 24);
}

function generarToken(usuarioId) {
  const minuto = minutoActual();
  return {
    token: `${usuarioId}.${minuto}.${firmar(usuarioId, minuto)}`,
    expiraEnSegundos: 60 - Math.floor((Date.now() / 1000) % 60),
  };
}

/** Devuelve el usuarioId si el token es valido y vigente; null si no. */
function validarToken(token) {
  if (typeof token !== 'string') return null;
  const partes = token.split('.');
  if (partes.length !== 3) return null;
  const [usuarioId, minutoStr, firma] = partes;
  const minuto = Number(minutoStr);
  if (!Number.isInteger(minuto)) return null;
  const ahora = minutoActual();
  if (ahora - minuto < 0 || ahora - minuto > VENTANA_MINUTOS) return null;
  const esperada = firmar(usuarioId, minuto);
  const ok =
    esperada.length === firma.length &&
    crypto.timingSafeEqual(Buffer.from(esperada), Buffer.from(firma));
  return ok ? usuarioId : null;
}

module.exports = { generarToken, validarToken };
