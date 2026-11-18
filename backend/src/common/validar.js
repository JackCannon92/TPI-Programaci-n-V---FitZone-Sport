'use strict';

const { validationResult } = require('express-validator');

const validar = (req, res, next) => {
    // 1. Extraemos los errores que express-validator haya detectado
    const errores = validationResult(req);
    
    // 2. Si hay errores, frenamos la petición y le respondemos al frontend qué se equivocó
    if (!errores.isEmpty()) {
        return res.status(400).json({
            mensaje: 'Error en la validación de los datos enviados',
            detalles: errores.array()
        });
    }
    
    // 3. Si todo está perfecto, dejamos que la petición continúe hacia el Controlador
    next();
};

module.exports = { validar };