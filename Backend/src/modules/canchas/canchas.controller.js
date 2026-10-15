'use strict';

function crearCanchasController(canchasService) {
  const wrap = (fn) => async (req, res, next) => { try { await fn(req, res); } catch (e) { next(e); } };
  return {
    crear: wrap(async (req, res) => res.status(201).json(await canchasService.crearCancha(req.body))),
    listarPorSede: wrap(async (req, res) => res.json(await canchasService.listarPorSede(req.params.sedeId))),
    obtener: wrap(async (req, res) => res.json(await canchasService.obtenerCancha(req.params.id))),
    cambiarEstado: wrap(async (req, res) => res.json(await canchasService.cambiarEstado(req.params.id, req.body.estado))),
    disponibilidad: wrap(async (req, res) => res.json(await canchasService.disponibilidad(req.params.id, req.query.fecha))),
    cotizar: wrap(async (req, res) => res.json(await canchasService.cotizar({ canchaId: req.params.id, usuarioId: req.query.usuarioId, fechaHoraInicio: req.query.inicio }))),
    reservar: wrap(async (req, res) => res.status(201).json(await canchasService.reservar(req.body))),
    obtenerReserva: wrap(async (req, res) => res.json(await canchasService.obtenerReserva(req.params.id))),
    reservasDeUsuario: wrap(async (req, res) => res.json(await canchasService.reservasDeUsuario(req.params.usuarioId))),
    cancelarReserva: wrap(async (req, res) => res.json(await canchasService.cancelarReserva(req.params.id))),
  };
}

module.exports = { crearCanchasController };
