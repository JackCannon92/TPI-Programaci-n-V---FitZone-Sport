'use strict';

function crearSedesController(sedesService) {
  async function crear(req, res, next) {
    try { res.status(201).json(await sedesService.crearSede(req.body)); } catch (e) { next(e); }
  }
  async function listar(req, res, next) {
    try { res.json(await sedesService.listarSedes()); } catch (e) { next(e); }
  }
  async function obtener(req, res, next) {
    try { res.json(await sedesService.obtenerSede(req.params.id)); } catch (e) { next(e); }
  }
  async function actualizar(req, res, next) {
    try { res.json(await sedesService.actualizarSede(req.params.id, req.body)); } catch (e) { next(e); }
  }
  return { crear, listar, obtener, actualizar };
}

module.exports = { crearSedesController };
