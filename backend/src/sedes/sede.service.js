'use strict';

function crearSedesService({ SedeModel }) {
  
  async function crearSede(datos) {
    const existente = await SedeModel.findOne({ where: { nombre: datos.nombre } });
    if (existente) {
      throw new Error('Ya existe una sede con ese nombre.');
    }
    return SedeModel.create(datos);
  }

  function listarSedes() {
    return SedeModel.findAll({ order: [['nombre', 'ASC']] });
  }

  async function obtenerSede(id) {
    const sede = await SedeModel.findByPk(id);
    if (!sede) {
      throw new Error(`Sede ${id} no encontrada.`);
    }
    return sede;
  }

  async function actualizarSede(id, cambios) {
    const sede = await obtenerSede(id);
    await sede.update(cambios);
    return sede;
  }

  return { crearSede, listarSedes, obtenerSede, actualizarSede };
}

module.exports = { crearSedesService };