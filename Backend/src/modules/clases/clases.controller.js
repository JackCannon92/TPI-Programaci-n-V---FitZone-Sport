'use strict';

function crearClasesController(clasesService) {
  const wrap = (fn) => async (req, res, next) => { try { await fn(req, res); } catch (e) { next(e); } };
  return {
    crear: wrap(async (req, res) => res.status(201).json(await clasesService.crearClase(req.body))),
    listar: wrap(async (req, res) => res.json(await clasesService.listarProximas(req.query.sedeId))),
    obtener: wrap(async (req, res) => res.json(await clasesService.obtenerClase(req.params.id))),
    reservar: wrap(async (req, res) => res.status(201).json(await clasesService.reservar(req.body))),
    cancelar: wrap(async (req, res) => res.json(await clasesService.cancelarReserva(req.params.id))),
    listaEspera: wrap(async (req, res) => res.status(201).json(await clasesService.anotarEnListaEspera(req.body))),
    verListaEspera: wrap(async (req, res) => res.json(await clasesService.listaEsperaDeClase(req.params.id))),
    reservasDeUsuario: wrap(async (req, res) => res.json(await clasesService.reservasDeUsuario(req.params.usuarioId))),
  };
}

module.exports = { crearClasesController };
