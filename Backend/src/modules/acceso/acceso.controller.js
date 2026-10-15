'use strict';

function crearAccesoController(accesoService) {
  async function qr(req, res, next) {
    try { res.json(await accesoService.generarQr(req.params.usuarioId)); } catch (e) { next(e); }
  }
  async function qrSvg(req, res, next) {
    try {
      const { svg } = await accesoService.generarQr(req.params.usuarioId);
      res.set('Content-Type', 'image/svg+xml').set('Cache-Control', 'no-store').send(svg);
    } catch (e) { next(e); }
  }
  async function ingreso(req, res, next) {
    try { res.status(201).json(await accesoService.registrarIngreso(req.body)); } catch (e) { next(e); }
  }
  async function egreso(req, res, next) {
    try { res.json(await accesoService.registrarEgreso(req.body)); } catch (e) { next(e); }
  }
  async function aforo(req, res, next) {
    try { res.json(await accesoService.aforo(req.params.sedeId)); } catch (e) { next(e); }
  }
  async function presentes(req, res, next) {
    try { res.json(await accesoService.presentes(req.params.sedeId)); } catch (e) { next(e); }
  }
  return { qr, qrSvg, ingreso, egreso, aforo, presentes };
}

module.exports = { crearAccesoController };
