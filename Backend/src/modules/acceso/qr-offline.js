'use strict';

/**
 * QR de acceso sin conexión (ADR-016, QR 2).
 *
 * La consigna pide que el control de acceso (los tornos) funcione aunque se
 * caiga la conexión a internet (disponibilidad del 99,5 %). El QR dinámico del
 * socio (RF-04) no alcanza para eso, porque para validarlo hay que consultar la
 * membresía en la base.
 *
 * Este QR lleva adentro todo lo que el torno necesita saber (quién es y hasta
 * cuándo tiene la membresía paga) y viene firmado con Ed25519, firma de clave
 * pública:
 *   - el SERVIDOR firma con la clave privada (nunca sale del servidor);
 *   - el TORNO valida con la clave pública (GET /api/acceso/clave-publica).
 * Así el torno puede validar sin red, y si alguien le saca la clave pública,
 * con ella no puede fabricar QRs.
 *
 * Vale 24 horas desde que se emite (o hasta que vence la membresía, si es
 * antes): la app lo renueva cada día mientras tiene conexión. Ese plazo acota
 * el riesgo de que una membresía suspendida siga entrando sin conexión.
 */
const crypto = require('crypto');
const { MotivosQr } = require('../../common/qr-firmado');

const TIPO = 'ACCESO_OFFLINE';
const HORAS_DE_VALIDEZ = 24;

// Clave privada Ed25519 derivada de una semilla de 32 bytes. Con la misma
// semilla (variable QR_OFFLINE_SEMILLA o, si no está, QR_SECRET) el par de
// claves es siempre el mismo, aunque se reinicie el servidor.
const PREFIJO_PKCS8_ED25519 = Buffer.from('302e020100300506032b657004220420', 'hex');
const semilla = crypto.createHash('sha256')
  .update(process.env.QR_OFFLINE_SEMILLA || `${process.env.QR_SECRET || 'fitzone-dev-secret-cambiar-en-produccion'}:acceso-offline`)
  .digest();
const CLAVE_PRIVADA = crypto.createPrivateKey({ key: Buffer.concat([PREFIJO_PKCS8_ED25519, semilla]), format: 'der', type: 'pkcs8' });
const CLAVE_PUBLICA = crypto.createPublicKey(CLAVE_PRIVADA);

/** La clave que se instala en los tornos (solo sirve para validar, no para firmar). */
function clavePublicaPem() {
  return CLAVE_PUBLICA.export({ type: 'spki', format: 'pem' });
}

/** 'YYYY-MM-DD' → último instante de ese día, en hora local (sin el desfase de UTC del olor O-7). */
function finDelDia(fechaISO) {
  const [anio, mes, dia] = String(fechaISO).slice(0, 10).split('-').map(Number);
  return new Date(anio, mes - 1, dia, 23, 59, 59, 999);
}

/**
 * @param {{ usuarioId: string, nombre: string, venceMembresia: string }} socio
 * @returns {{ token: string, validoHasta: Date }}
 */
function emitirQrOffline({ usuarioId, nombre, venceMembresia }, ahora = Date.now()) {
  const emitido = new Date(ahora).getTime();
  const exp = Math.min(emitido + HORAS_DE_VALIDEZ * 60 * 60 * 1000, finDelDia(venceMembresia).getTime());
  const payload = { t: TIPO, usuarioId, nombre, venceMembresia: String(venceMembresia).slice(0, 10), emitido, exp };
  const cuerpo = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const firma = crypto.sign(null, Buffer.from(cuerpo), CLAVE_PRIVADA).toString('base64url');
  return { token: `${cuerpo}.${firma}`, validoHasta: new Date(exp) };
}

/**
 * Lo que hace el torno: valida SIN consultar la base, solo con la clave pública.
 * @returns {{ valido: boolean, motivo?: string, usuarioId?: string, nombre?: string, venceMembresia?: string, validoHasta?: Date }}
 */
function validarQrOffline(token, { clavePublica = CLAVE_PUBLICA, ahora = Date.now() } = {}) {
  const partes = typeof token === 'string' ? token.split('.') : [];
  if (partes.length !== 2) return { valido: false, motivo: MotivosQr.INVALIDO };
  const [cuerpo, firma] = partes;

  let firmaOk = false;
  try {
    firmaOk = crypto.verify(null, Buffer.from(cuerpo), clavePublica, Buffer.from(firma, 'base64url'));
  } catch {
    firmaOk = false;
  }
  if (!firmaOk) return { valido: false, motivo: MotivosQr.INVALIDO };

  let datos;
  try {
    datos = JSON.parse(Buffer.from(cuerpo, 'base64url').toString('utf8'));
  } catch {
    return { valido: false, motivo: MotivosQr.INVALIDO };
  }
  if (datos.t !== TIPO) return { valido: false, motivo: MotivosQr.INVALIDO };
  if (new Date(ahora).getTime() > datos.exp) return { valido: false, motivo: MotivosQr.VENCIDO };

  return {
    valido: true,
    usuarioId: datos.usuarioId,
    nombre: datos.nombre,
    venceMembresia: datos.venceMembresia,
    validoHasta: new Date(datos.exp),
  };
}

module.exports = { emitirQrOffline, validarQrOffline, clavePublicaPem, HORAS_DE_VALIDEZ };
