'use strict';

/**
 * ADAPTADOR Sequelize del repositorio de Membresías.
 * Contrato: ver membresias.puerto.js.
 */
const { MembresiaDuplicadaError } = require('./membresias.puerto');

const CAMPOS_EDITABLES = ['plan', 'estado', 'fecha_inicio', 'fecha_vencimiento', 'renovacion_automatica'];

const aDominio = (fila) => (fila ? fila.get({ plain: true }) : null);

/** @returns {import('./membresias.puerto').MembresiasRepository} */
function crearMembresiasRepositorySequelize({ MembresiaModel }) {
  async function deUsuario(usuarioId) {
    return aDominio(await MembresiaModel.findOne({ where: { usuario_id: usuarioId } }));
  }

  async function registrar(datos) {
    try {
      return aDominio(await MembresiaModel.create(datos));
    } catch (error) {
      if (error && error.name === 'SequelizeUniqueConstraintError') {
        throw new MembresiaDuplicadaError(datos.usuario_id);
      }
      throw error;
    }
  }

  async function guardar(membresia) {
    const fila = await MembresiaModel.findByPk(membresia.id);
    if (!fila) throw new Error(`Membresía ${membresia.id} inexistente.`);
    for (const campo of CAMPOS_EDITABLES) {
      if (membresia[campo] !== undefined) fila[campo] = membresia[campo];
    }
    await fila.save();
    return aDominio(fila);
  }

  return { deUsuario, registrar, guardar };
}

module.exports = { crearMembresiasRepositorySequelize };
