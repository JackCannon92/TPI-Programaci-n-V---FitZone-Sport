'use strict';

const { Op } = require('sequelize');
const { AppError } = require('../../common/app-error');
const { EstadoReservaClase } = require('../../common/enums');
const { Eventos } = require('../../common/bus-eventos');
const { firmarQr, verificarQr, qrSvg, TiposQr, MotivosQr } = require('../../common/qr-firmado');

const HORAS_ANTICIPACION_MAX = 48;
const HORAS_CANCELACION_LIBRE = 2;
// QR de asistencia: vale desde 30 minutos antes de la clase hasta 60 minutos después de que empezó.
const MINUTOS_ANTES_ASISTENCIA = 30;
const MINUTOS_DESPUES_ASISTENCIA = 60;

const MENSAJES_QR_ASISTENCIA = {
  [MotivosQr.INVALIDO]: 'QR de asistencia inválido.',
  [MotivosQr.TODAVIA_NO_VALE]: 'Todavía no se puede marcar la asistencia: se habilita 30 minutos antes de la clase.',
  [MotivosQr.VENCIDO]: 'Ya pasó el horario para marcar la asistencia a esta clase.',
};

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
    if (reserva.estado === EstadoReservaClase.ASISTIO) {
      throw new AppError('No se puede cancelar una clase a la que ya se asistió.', 409);
    }

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
  /**
   * QR 3 · QR de asistencia a una clase (ADR-016).
   * Se emite para una reserva confirmada; el recepcionista o el instructor lo
   * escanea al empezar la clase y la reserva pasa a ASISTIO.
   */
  async function generarQrAsistencia(reservaId) {
    const reserva = await ReservaClaseModel.findByPk(reservaId);
    if (!reserva) throw new AppError('Reserva no encontrada.', 404);
    if (reserva.estado !== EstadoReservaClase.CONFIRMADA) {
      throw new AppError('Solo una reserva confirmada tiene QR de asistencia.', 409);
    }
    const clase = await obtenerClase(reserva.claseId);
    const inicio = new Date(clase.fechaHora).getTime();
    const validoDesde = new Date(inicio - MINUTOS_ANTES_ASISTENCIA * 60 * 1000);
    const validoHasta = new Date(inicio + MINUTOS_DESPUES_ASISTENCIA * 60 * 1000);

    const token = firmarQr(
      TiposQr.ASISTENCIA_CLASE,
      { reservaId: reserva.id, claseId: clase.id, usuarioId: reserva.usuarioId },
      { desde: validoDesde, hasta: validoHasta }
    );
    return { reservaId: reserva.id, token, validoDesde, validoHasta, svg: await qrSvg(token) };
  }

  /** QR 3 · Se escanea el QR y la reserva queda como ASISTIO. */
  async function registrarAsistencia({ token }) {
    const resultado = verificarQr(token, TiposQr.ASISTENCIA_CLASE);
    if (!resultado.ok) throw new AppError(MENSAJES_QR_ASISTENCIA[resultado.motivo], 401);

    const reserva = await ReservaClaseModel.findByPk(resultado.datos.reservaId);
    if (!reserva) throw new AppError('Reserva no encontrada.', 404);
    if (reserva.estado === EstadoReservaClase.ASISTIO) throw new AppError('La asistencia ya estaba registrada.', 409);
    if (reserva.estado === EstadoReservaClase.CANCELADA) throw new AppError('La reserva fue cancelada.', 409);

    reserva.estado = EstadoReservaClase.ASISTIO;
    await reserva.save();
    return reserva;
  }

  return {
    crearClase, obtenerClase, listarProximas, reservar, cancelarReserva,
    anotarEnListaEspera, reservasDeUsuario, listaEsperaDeClase,
    generarQrAsistencia, registrarAsistencia
  };
}

module.exports = { crearClasesService };