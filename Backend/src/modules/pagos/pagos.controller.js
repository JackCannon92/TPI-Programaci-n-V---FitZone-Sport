'use strict';

function crearPagosController(pagosService) {
  // Wrapper para atrapar errores y enviarlos al middleware global
  const wrap = (fn) => async (req, res, next) => { 
    try { await fn(req, res); } catch (e) { next(e); } 
  };

  return {
    pagarReserva: wrap(async (req, res) => res.status(201).json(await pagosService.pagarReserva(req.body))),
    
    pagosDeUsuario: wrap(async (req, res) => res.json(await pagosService.pagosDeUsuario(req.params.usuarioId))),
    
    obtenerPago: wrap(async (req, res) => res.json(await pagosService.obtenerPago(req.params.id))),
    
    comprobantePdf: wrap(async (req, res) => {
      const pdf = await pagosService.comprobantePdf(req.params.id);
      res.set('Content-Type', 'application/pdf')
         .set('Content-Disposition', `inline; filename="comprobante-${req.params.id}.pdf"`)
         .send(pdf);
    })
  };
}

module.exports = { crearPagosController };