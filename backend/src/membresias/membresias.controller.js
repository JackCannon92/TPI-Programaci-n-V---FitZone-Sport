'use strict';

function crearMembresiasController(membresiasService) {

    // Endpoint para el RF-02
    async function asignarPlan(req, res, next) {
        try {
            const { id_usuario, plan } = req.body;
            const nuevaMembresia = await membresiasService.asignarMembresia(id_usuario, plan);

            res.status(201).json({
                mensaje: 'Membresia creada con exito',
                data: nuevaMembresia
            });
        } catch (error) {
            next(error);
        }
    }
    
    async function obtenerEstado(req, res, next) {
        try {
            const { id_usuario } = req.params;
            const membresia = await membresiasService.obtenerMembresia(id_usuario);
            res.status(200).json({ data: membresia });
        } catch (error) {
            next(error);
        }
    }

    async function renovar(req, res, next) {
        try {
            const { id_usuario } = req.params;
            const { plan } = req.body;
            const membresiaRenovada = await membresiasService.renovarMembresia(id_usuario, plan);
            res.status(200).json({ mensaje: 'Membresía renovada con éxito', data: membresiaRenovada });
        } catch (error) {
            next(error);
        }
    }

    async function suspender(req, res, next) {
        try {
            const { id_usuario } = req.params;
            const membresiaSuspendida = await membresiasService.cancelarMembresia(id_usuario);
            res.status(200).json({ mensaje: 'Membresía suspendida', data: membresiaSuspendida });
        } catch (error) {
            next(error);
        }
    }

    // RF-02 + RF-13: renovar pagando con tarjeta por la pasarela.
    async function pagar(req, res, next) {
        try {
            const { id_usuario } = req.params;
            const { plan, tarjeta } = req.body;
            const resultado = await membresiasService.pagarYRenovar(id_usuario, plan, tarjeta);
            res.status(201).json({ mensaje: 'Pago aprobado y membresía renovada', data: resultado });
        } catch (error) {
            next(error);
        }
    }

    function precios(req, res) {
        res.json(membresiasService.PRECIO_PLAN);
    }

    // Retornamos los métodos al enrutador
    return {
        asignarPlan,
        obtenerEstado,
        renovar,
        suspender,
        pagar,
        precios
    };
}

module.exports = { crearMembresiasController };