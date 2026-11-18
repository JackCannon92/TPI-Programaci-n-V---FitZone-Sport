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

    // Retornamos los métodos al enrutador
    return {
        asignarPlan,
        obtenerEstado,
        renovar,
        suspender
    };
}

module.exports = { crearMembresiasController };