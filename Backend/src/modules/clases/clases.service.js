'use strict';

const { Op } = require('sequelize');
const { AppError } = require('../../common/app-error');
const { EstadoReservaClase } = require('../../common/enums');
const { Eventos } = require('../../common/bus-eventos');

const HORAS_ANTICIPACION_MAX = 48;
const HORAS_CANCELACION_LIBRE = 2;

// Si nadie inyecta un bus (ej.: un test viejo), publicar no hace nada.
const SIN_EVENTOS = { publicar: () => Promise.resolve() };

// Inyectamos los Modelos, 'sequelize' para las transacciones y el bus de eventos (Observer, RF-08)
function crearClasesService({ ClaseModel, ReservaClaseModel, ListaEsperaModel, usuariosService, sedesService, sequelize, eventos = SIN_EVENTOS }) {
  
async function crearClase(datos) {
    await sedesService.obtenerSede(datos.sedeId);
    
    return ClaseModel.create({ 
        sedeId: datos.sedeId,
        tipo: datos.tipo,
        instructor: datos.instructor,
        fechaHora: datos.fechaHora,
        capacidadMaxima: datos.capacidadMaxima,
        cuposDisponibles: datos.capacidadMaxima 
    });
  }

  async function obtenerClase(id) {
    const c = await ClaseModel.findByPk(id);
    if (!c) throw new AppError(`Clase ${id} no encontrada.`, 404);
    return c;
  }

  function listarProximas(sedeId) {
    const where = { fechaHora: { [Op.gte]: new Date() } };
    if (sedeId) where.sedeId = sedeId;
    return ClaseModel.findAll({ where, order: [['fechaHora', 'ASC']] });
  }

  async function validarSocioActivo(usuarioId) {
    const usuario = await usuariosService.obtenerUsuario(usuarioId);
    if (!usuariosService.esSocioActivo(usuario)) {
      throw new AppError('Solo un socio con membresia activa puede reservar clases (RN-03).', 403);
    }
    return usuario;
  }

  async function reservar({ claseId, usuarioId }) {
    await validarSocioActivo(usuarioId);
    
    return sequelize.transaction(async (t) => {
      const clase = await ClaseModel.findByPk(claseId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!clase) throw new AppError('Clase no encontrada.', 404);
      
      const horasFaltan = (new Date(clase.fechaHora) - Date.now()) / 36e5;
      if (horasFaltan <= 0) throw new AppError('La clase ya empezo.', 409);
      if (horasFaltan > HORAS_ANTICIPACION_MAX) throw new AppError('Solo se puede reservar hasta 48 hs antes.', 409);

      const yaReservo = await ReservaClaseModel.findOne({ where: { claseId, usuarioId, estado: EstadoReservaClase.CONFIRMADA }, transaction: t });
      if (yaReservo) throw new AppError('Ya tenes una reserva para esta clase.', 409);

      if (clase.cuposDisponibles <= 0) {
        throw new AppError('La clase esta llena. Podes anotarte en la lista de espera.', 409);
      }
      
      // clase.cuposDisponibles -= 1;
      // await clase.save({ transaction: t });
      return ReservaClaseModel.create({ claseId, usuarioId }, { transaction: t });
    });
  }

  async function cancelarReserva(reservaId) {
    const reserva = await ReservaClaseModel.findByPk(reservaId);
    if (!reserva) throw new AppError('Reserva no encontrada.', 404);
    if (reserva.estado === EstadoReservaClase.CANCELADA) return reserva;

    const clase = await obtenerClase(reserva.claseId);
    const horasFaltan = (new Date(clase.fechaHora) - Date.now()) / 36e5;
    
    reserva.conPenalidad = horasFaltan < HORAS_CANCELACION_LIBRE;
    reserva.estado = EstadoReservaClase.CANCELADA;
    await reserva.save();

    clase.cuposDisponibles = Math.min(clase.capacidadMaxima, clase.cuposDisponibles + 1);
    await clase.save();

    // Observer (RF-08): publicamos el HECHO y terminamos. No sabemos quién
    // escucha; hoy lo escucha el aviso a la lista de espera (waitlistNotifier).
    // No se espera la promesa: la respuesta al socio no depende del aviso.
    eventos.publicar(Eventos.CUPO_LIBERADO, { claseId: clase.id, reservaId: reserva.id });

    return reserva;
  }

  async function anotarEnListaEspera({ claseId, usuarioId }) {
    await validarSocioActivo(usuarioId);
    const clase = await obtenerClase(claseId);
    if (clase.cuposDisponibles > 0) throw new AppError('La clase tiene cupo: reserva directamente.', 409);
    
    const [entrada, creado] = await ListaEsperaModel.findOrCreate({ where: { claseId, usuarioId } });
    if (!creado) throw new AppError('Ya estas en la lista de espera.', 409);
    return entrada;
  }

function reservasDeUsuario(usuarioId) {
    return ReservaClaseModel.findAll({ 
      where: { usuarioId }, 
      order: [['created_at', 'DESC']] 
    });
  }

  function listaEsperaDeClase(claseId) {
    return ListaEsperaModel.findAll({ 
      where: { claseId }, 
      order: [['created_at', 'ASC']] 
    });
  }
  return {
    crearClase, obtenerClase, listarProximas, reservar, cancelarReserva,
    anotarEnListaEspera, reservasDeUsuario, listaEsperaDeClase
  };
}

module.exports = { crearClasesService };