'use strict';

/**
 * QR firmados: la pieza común de los QR de FitZone (ver ADR-010).
 *
 * Un QR firmado lleva adentro un dato (payload) y una firma HMAC con el
 * secreto del servidor. Nadie puede inventar uno ni modificarlo (por ejemplo,
 * cambiarle el horario) sin que la firma deje de coincidir.
 *
 * Cada QR tiene un TIPO, y al validarlo se exige el tipo esperado: así el QR
 * de una reserva de cancha no sirve como QR de asistencia a clase, ni al revés.
 *
 * Formato del token:  <payload en base64url>.<firma>
 * Campos del payload:  t (tipo), nbf (válido desde, ms), exp (válido hasta, ms)
 *                      y los datos propios de cada QR.
 *
 * El QR dinámico del socio (RF-04, acceso/qr-token.js) es anterior y tiene su
 * propio formato; el QR sin conexión (acceso/qr-offline.js) usa firma con
 * clave pública porque se valida en el torno.
 */
const crypto = require('crypto');
const QRCode = require('qrcode');

const SECRET = process.env.QR_SECRET || 'fitzone-dev-secret-cambiar-en-produccion';

const TiposQr = Object.freeze({
  RESERVA_CANCHA: 'RESERVA_CANCHA',
  ASISTENCIA_CLASE: 'ASISTENCIA_CLASE',
  COMPROBANTE: 'COMPROBANTE',
});

/** Motivos por los que un QR no se acepta (sirven para dar un mensaje claro). */
const MotivosQr = Object.freeze({
  INVALIDO: 'INVALIDO',           // formato roto, firma que no coincide o tipo equivocado
  TODAVIA_NO_VALE: 'TODAVIA_NO_VALE',
  VENCIDO: 'VENCIDO',
});

const aBase64Url = (texto) => Buffer.from(texto, 'utf8').toString('base64url');
const deBase64Url = (texto) => Buffer.from(texto, 'base64url').toString('utf8');
const hmac = (texto) => crypto.createHmac('sha256', SECRET).update(texto).digest('base64url');

function iguales(a, b) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

/**
 * @param {string} tipo uno de TiposQr
 * @param {object} datos lo que el QR tiene que llevar (ids, montos...)
 * @param {{ desde?: Date|number, hasta?: Date|number }} vigencia
 * @returns {string} token listo para meter en un QR
 */
function firmarQr(tipo, datos, { desde, hasta } = {}) {
  const payload = { t: tipo, ...datos };
  if (desde !== undefined) payload.nbf = new Date(desde).getTime();
  if (hasta !== undefined) payload.exp = new Date(hasta).getTime();
  const cuerpo = aBase64Url(JSON.stringify(payload));
  return `${cuerpo}.${hmac(cuerpo)}`;
}

/**
 * @returns {{ ok: true, datos: object } | { ok: false, motivo: string }}
 */
function verificarQr(token, tipoEsperado, ahora = Date.now()) {
  if (typeof token !== 'string') return { ok: false, motivo: MotivosQr.INVALIDO };
  const partes = token.split('.');
  if (partes.length !== 2) return { ok: false, motivo: MotivosQr.INVALIDO };
  const [cuerpo, firma] = partes;
  if (!iguales(hmac(cuerpo), firma)) return { ok: false, motivo: MotivosQr.INVALIDO };

  let datos;
  try {
    datos = JSON.parse(deBase64Url(cuerpo));
  } catch {
    return { ok: false, motivo: MotivosQr.INVALIDO };
  }
  if (datos.t !== tipoEsperado) return { ok: false, motivo: MotivosQr.INVALIDO };

  const momento = new Date(ahora).getTime();
  if (datos.nbf !== undefined && momento < datos.nbf) return { ok: false, motivo: MotivosQr.TODAVIA_NO_VALE };
  if (datos.exp !== undefined && momento > datos.exp) return { ok: false, motivo: MotivosQr.VENCIDO };
  return { ok: true, datos };
}

/** Imagen del QR en SVG (para mostrar en la Aplicación Web). */
function qrSvg(texto) {
  return QRCode.toString(texto, { type: 'svg', margin: 1, width: 240 });
}

/** Imagen del QR en PNG (para insertar en el comprobante PDF). */
function qrPng(texto) {
  return QRCode.toBuffer(texto, { type: 'png', margin: 1, width: 220 });
}

module.exports = { firmarQr, verificarQr, qrSvg, qrPng, TiposQr, MotivosQr };
