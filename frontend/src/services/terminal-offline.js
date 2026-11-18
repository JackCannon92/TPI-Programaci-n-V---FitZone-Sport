'use strict';

/**
 * ADR-007 · Terminal de sede sin conexión.
 *
 * Lo que el terminal de Recepción guarda en el navegador para seguir andando
 * cuando se cae el servidor o internet:
 *   1. la CLAVE PÚBLICA Ed25519 (GET /acceso/clave-publica), para validar el QR
 *      sin conexión del socio acá mismo, sin preguntarle nada al servidor;
 *   2. la COLA de ingresos (solo se agrega al final), cada uno con la hora en
 *      que la persona pasó;
 *   3. la lista de SEDES, para poder elegir la sede aunque no haya red.
 * No guarda datos de socios: lo que hace falta saber (quién es y hasta cuándo
 * vale) viene adentro del QR, firmado por el servidor.
 *
 * Al volver la conexión, la cola se manda a POST /acceso/sincronizar y el
 * servidor la concilia (vuelve a verificar las firmas, descarta los reenvíos y
 * resuelve RN-01).
 */
const terminalOffline = (() => {
  const CLAVE_PEM = 'fitzone_terminal_clave_publica';
  const CLAVE_COLA = 'fitzone_terminal_cola';
  const CLAVE_SEDES = 'fitzone_terminal_sedes';
  const REFRESCO_CLAVE_MS = 24 * 60 * 60 * 1000; // igual que la validez del QR (HORAS_DE_VALIDEZ)
  const MAX_POR_ENVIO = 200; // el mismo límite que el validador del backend
  const DOBLE_LECTURA_MS = 2 * 60 * 1000; // el mismo QR leído dos veces seguidas no es otro ingreso

  // Si el navegador no deja usar localStorage (modo privado), se guarda en memoria.
  const memoria = {};
  function leer(clave, porDefecto) {
    try {
      const v = localStorage.getItem(clave);
      return v ? JSON.parse(v) : porDefecto;
    } catch (_) {
      return clave in memoria ? memoria[clave] : porDefecto;
    }
  }
  function guardar(clave, valor) {
    memoria[clave] = valor;
    try { localStorage.setItem(clave, JSON.stringify(valor)); } catch (_) { /* queda en memoria */ }
  }

  // ---------- Base64url y PEM ----------
  function bytesDeBase64url(texto) {
    const b64 = texto.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (texto.length % 4)) % 4);
    return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  }
  function derDePem(pem) {
    const b64 = pem.replace(/-----(BEGIN|END) PUBLIC KEY-----/g, '').replace(/\s+/g, '');
    return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  }

  // ---------- 1. Clave pública ----------
  let claveImportada = null;

  const claveGuardada = () => leer(CLAVE_PEM, null);

  /** Baja la clave pública si no la tiene o si tiene más de 24 horas. Sin conexión, sigue con la guardada. */
  async function actualizarClave({ forzar = false } = {}) {
    const actual = claveGuardada();
    if (!forzar && actual && Date.now() - actual.obtenida < REFRESCO_CLAVE_MS) return actual;
    const { clavePublica } = await api.clavePublica();
    const nueva = { pem: clavePublica, obtenida: Date.now() };
    if (!actual || actual.pem !== nueva.pem) claveImportada = null;
    guardar(CLAVE_PEM, nueva);
    return nueva;
  }

  const puedeValidarLocal = () => Boolean(window.crypto && window.crypto.subtle);

  async function importarClave() {
    const guardada = claveGuardada();
    if (!guardada) {
      const error = new Error('Este terminal todavía no tiene la clave pública: tiene que conectarse al servidor una vez.');
      error.codigo = 'SIN_CLAVE';
      throw error;
    }
    if (!claveImportada) {
      claveImportada = await crypto.subtle.importKey('spki', derDePem(guardada.pem), { name: 'Ed25519' }, false, ['verify']);
    }
    return claveImportada;
  }

  /** Lo mismo que validarQrOffline() del backend, pero en el navegador y sin red. */
  async function verificarLocal(token, ahora = Date.now()) {
    const partes = String(token).split('.');
    if (partes.length !== 2) return { valido: false, motivo: 'INVALIDO' };
    const [cuerpo, firma] = partes;

    const clave = await importarClave();
    let firmaOk = false;
    try {
      firmaOk = await crypto.subtle.verify({ name: 'Ed25519' }, clave, bytesDeBase64url(firma), new TextEncoder().encode(cuerpo));
    } catch (_) {
      firmaOk = false;
    }
    if (!firmaOk) return { valido: false, motivo: 'INVALIDO' };

    let datos;
    try {
      datos = JSON.parse(new TextDecoder().decode(bytesDeBase64url(cuerpo)));
    } catch (_) {
      return { valido: false, motivo: 'INVALIDO' };
    }
    if (datos.t !== 'ACCESO_OFFLINE') return { valido: false, motivo: 'INVALIDO' };
    if (ahora > datos.exp) return { valido: false, motivo: 'VENCIDO' };
    return { valido: true, usuarioId: datos.usuarioId, nombre: datos.nombre, venceMembresia: datos.venceMembresia, validoHasta: new Date(datos.exp) };
  }

  /**
   * Valida en el terminal. Si la firma no cierra y hay conexión, puede ser que
   * el servidor haya cambiado de clave: la baja de nuevo y prueba una vez más.
   */
  async function validar(token) {
    if (!puedeValidarLocal()) {
      const error = new Error('Este navegador no puede validar firmas Ed25519 (hace falta un navegador actualizado y abrir la página desde localhost o https).');
      error.codigo = 'SIN_WEBCRYPTO';
      throw error;
    }
    let r = await verificarLocal(token);
    if (!r.valido && r.motivo === 'INVALIDO') {
      try {
        const antes = claveGuardada();
        const nueva = await actualizarClave({ forzar: true });
        if (!antes || antes.pem !== nueva.pem) r = await verificarLocal(token);
      } catch (_) { /* sin conexión: queda el resultado con la clave guardada */ }
    }
    return { ...r, local: true };
  }

  // ---------- 2. Cola de ingresos ----------
  const cola = () => leer(CLAVE_COLA, []);
  const pendientes = (sedeId) => cola().filter((i) => !sedeId || i.sedeId === sedeId).length;

  const nuevoId = () => (crypto.randomUUID ? crypto.randomUUID() : `ev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);

  /** ¿Este socio ya quedó en la cola de esta sede hace un momento? (el mismo QR leído dos veces) */
  function recienEncolado(usuarioId, sedeId, ahora = Date.now()) {
    return cola().some((i) => i.usuarioId === usuarioId && i.sedeId === sedeId && ahora - new Date(i.fechaIngreso).getTime() < DOBLE_LECTURA_MS);
  }

  function encolar({ token, sedeId, usuarioId, nombre }) {
    const ingreso = { id: nuevoId(), token, sedeId, usuarioId, nombre, fechaIngreso: new Date().toISOString() };
    guardar(CLAVE_COLA, [...cola(), ingreso]);
    return ingreso;
  }

  // ---------- Sincronización ----------
  let sincronizando = false;

  /**
   * Manda la cola al servidor, de a una sede y de a 200 ingresos.
   * Lo que el servidor procesó (aceptado, duplicado o rechazado) sale de la cola;
   * si se corta la conexión en el medio, lo que falta queda para la próxima.
   * @returns {Promise<null | { enviados, aceptados, duplicados, rechazados, observaciones: Array, error?: Error }>}
   */
  async function sincronizar() {
    if (sincronizando || !cola().length) return null;
    sincronizando = true;
    const informe = { enviados: 0, aceptados: 0, duplicados: 0, rechazados: 0, observaciones: [], fecha: new Date() };
    try {
      const sedes = [...new Set(cola().map((i) => i.sedeId))];
      for (const sedeId of sedes) {
        const deLaSede = cola().filter((i) => i.sedeId === sedeId);
        for (let desde = 0; desde < deLaSede.length; desde += MAX_POR_ENVIO) {
          const lote = deLaSede.slice(desde, desde + MAX_POR_ENVIO);
          const r = await api.sincronizarIngresos(sedeId, lote.map(({ id, token, fechaIngreso }) => ({ id, token, fechaIngreso })));
          const procesados = new Set(r.resultados.map((x) => x.id));
          guardar(CLAVE_COLA, cola().filter((i) => !procesados.has(i.id)));

          informe.enviados += lote.length;
          informe.aceptados += r.resumen.aceptados;
          informe.duplicados += r.resumen.duplicados;
          informe.rechazados += r.resumen.rechazados;
          const porId = new Map(lote.map((i) => [i.id, i]));
          r.resultados.filter((x) => x.conflicto || x.estado === 'RECHAZADO').forEach((x) => {
            informe.observaciones.push({ ...x, nombre: x.nombre || (porId.get(x.id) || {}).nombre || '?', fechaIngreso: (porId.get(x.id) || {}).fechaIngreso });
          });
          if (r.aforo && r.aforo.excedido) {
            informe.observaciones.push({ estado: 'AFORO', conflicto: `Con los ingresos sin conexión la sede quedó en ${r.aforo.actual} de ${r.aforo.maximo}: no se aceptan ingresos nuevos hasta que se registren salidas.` });
          }
        }
      }
    } catch (error) {
      informe.error = error;
    } finally {
      sincronizando = false;
    }
    return informe;
  }

  // ---------- 3. Sedes ----------
  const guardarSedes = (sedes) => guardar(CLAVE_SEDES, sedes.map(({ id, nombre }) => ({ id, nombre })));
  const sedesGuardadas = () => leer(CLAVE_SEDES, []);

  return {
    actualizarClave, claveGuardada, puedeValidarLocal, validar,
    cola, pendientes, recienEncolado, encolar, sincronizar,
    guardarSedes, sedesGuardadas,
  };
})();
