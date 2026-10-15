'use strict';

const { AppError } = require('../../common/app-error');
const { EstadoCancha, EstadoReservaCancha } = require('../../common/enums');
const { esHorarioPico } = require('./strategies/peakHourPricing');

const HORA_APERTURA = 8;
const HORA_CIERRE = 23;

/**
 * Servicio de canchas.
 *
 * - Las reservas se leen y escriben a través de `reservasRepo` (patrón
 *   Repository): este archivo ya no conoce a ReservaCanchaModel ni a Sequelize.
 * - El precio lo calcula `tarifador` (patrón Strategy, RF-11).
 * - Las canchas siguen yendo directo al modelo: no tienen reglas ricas, y
 *   abstraerlas sería el "repositorio vacío" que la cátedra pide evitar.
 */
function crearCanchasService({ CanchaModel, reservasRepo, tarifador, usuariosService, sedesService }) {

  async function crearCancha(datos) {
    await sedesService.obtenerSede(datos.sedeId);
    return CanchaModel.create(datos);
  }

  async function obtenerCancha(id) {
    const cancha = await CanchaModel.findByPk(id);
    if (!cancha) throw new AppError(`Cancha ${id} no encontrada.`, 404);
    return cancha;
  }

  function listarPorSede(sedeId) {
    return CanchaModel.findAll({ where: { sedeId } });
  }

  async function cambiarEstado(id, estado) {
    const cancha = await obtenerCancha(id);
    cancha.estado = estado;
    await cancha.save();
    return cancha;
  }

  async function disponibilidad(canchaId, fechaISO) {
    const cancha = await obtenerCancha(canchaId);
    const dia = new Date(`${fechaISO}T00:00:00`);
    if (Number.isNaN(dia.getTime())) throw new AppError('Fecha invalida (YYYY-MM-DD).', 400);

    const desde = new Date(dia); desde.setHours(HORA_APERTURA, 0, 0, 0);
    const hasta = new Date(dia); hasta.setHours(HORA_CIERRE, 0, 0, 0);

    const turnosOcupados = await reservasRepo.turnosOcupados(canchaId, desde, hasta);
    const ocupados = new Set(turnosOcupados.map((inicio) => inicio.toISOString()));

    const ahora = Date.now();
    const slots = [];
    for (let h = HORA_APERTURA; h < HORA_CIERRE; h += 1) {
      const inicio = new Date(dia); inicio.setHours(h, 0, 0, 0);
      slots.push({
        inicio: inicio.toISOString(),
        hora: `${String(h).padStart(2, '0')}:00`,
        disponible: cancha.estado === EstadoCancha.DISPONIBLE && !ocupados.has(inicio.toISOString()) && inicio.getTime() > ahora,
        pico: esHorarioPico(inicio),
      });
    }
    return { cancha: { id: cancha.id, nombre: cancha.nombre, precioHora: Number(cancha.precioHora) }, fecha: fechaISO, slots };
  }

  // RF-11: el precio sale de la cadena de estrategias armada en compositionRoot.
  async function cotizar({ canchaId, usuarioId, fechaHoraInicio }) {
    const cancha = await obtenerCancha(canchaId);
    const inicio = new Date(fechaHoraInicio);
    if (Number.isNaN(inicio.getTime())) throw new AppError('Fecha y hora de inicio invalidas.', 400);

    const usuario = await usuariosService.obtenerUsuario(usuarioId);
    const esSocioActivo = usuariosService.esSocioActivo(usuario);

    return tarifador.cotizar({ cancha, inicio, esSocioActivo });
  }

  async function reservar({ canchaId, usuarioId, fechaHoraInicio }) {
    const cancha = await obtenerCancha(canchaId);
    if (cancha.estado !== EstadoCancha.DISPONIBLE) {
      throw new AppError('La cancha esta en mantenimiento.', 409);
    }
    const inicio = new Date(fechaHoraInicio);
    const fin = new Date(inicio.getTime() + 60 * 60 * 1000);

    const { precioFinal, detalle } = await cotizar({ canchaId, usuarioId, fechaHoraInicio: inicio });

    // Si otro socio ganó el turno, el repositorio lanza TurnoYaReservadoError (409, RN-02).
    return reservasRepo.registrar({
      canchaId, usuarioId, fechaHoraInicio: inicio, fechaHoraFin: fin, precioFinal, detallePrecio: detalle,
    });
  }

  async function obtenerReserva(id) {
    const reserva = await reservasRepo.porId(id);
    if (!reserva) throw new AppError(`Reserva ${id} no encontrada.`, 404);
    return reserva;
  }

  function reservasDeUsuario(usuarioId) {
    return reservasRepo.deUsuario(usuarioId);
  }

  async function cancelarReserva(id) {
    const reserva = await obtenerReserva(id);
    if (reserva.estado === EstadoReservaCancha.CANCELADA) return reserva;
    return reservasRepo.cambiarEstado(id, EstadoReservaCancha.CANCELADA);
  }

  async function confirmarReserva(reservaId) {
    await obtenerReserva(reservaId);
    return reservasRepo.cambiarEstado(reservaId, EstadoReservaCancha.CONFIRMADA);
  }

  return {
    crearCancha, obtenerCancha, listarPorSede, cambiarEstado, disponibilidad,
    cotizar, reservar, obtenerReserva, reservasDeUsuario, cancelarReserva, confirmarReserva,
  };
}

module.exports = { crearCanchasService };
