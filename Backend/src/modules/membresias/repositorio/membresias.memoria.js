'use strict';

/**
 * ADAPTADOR en memoria del repositorio de Membresías.
 * Contrato: ver membresias.puerto.js. Se usa en los tests.
 */
const { randomUUID } = require('node:crypto');
const { MembresiaDuplicadaError } = require('./membresias.puerto');

const copiar = (m) => (m ? structuredClone(m) : null);

/** @returns {import('./membresias.puerto').MembresiasRepository} */
function crearMembresiasRepositoryMemoria() {
  /** @type {Map<string, import('./membresias.puerto').Membresia>} clave: usuario_id */
  const porUsuario = new Map();

  async function deUsuario(usuarioId) {
    return copiar(porUsuario.get(usuarioId));
  }

  async function registrar(datos) {
    if (porUsuario.has(datos.usuario_id)) throw new MembresiaDuplicadaError(datos.usuario_id);
    const nueva = { renovacion_automatica: false, ...structuredClone(datos), id: randomUUID() };
    porUsuario.set(nueva.usuario_id, nueva);
    return copiar(nueva);
  }

  async function guardar(membresia) {
    if (!porUsuario.has(membresia.usuario_id)) throw new Error(`Membresía ${membresia.id} inexistente.`);
    porUsuario.set(membresia.usuario_id, structuredClone(membresia));
    return copiar(membresia);
  }

  return { deUsuario, registrar, guardar };
}

module.exports = { crearMembresiasRepositoryMemoria };
