'use strict';

const { body, param } = require('express-validator');

const crearSedeValidators = [
  body('nombre').isString().isLength({ min: 2, max: 80 }),
  body('direccion').optional().isString().isLength({ max: 160 }),
  body('aforoMaximo').optional().isInt({ min: 1 }),
];

const actualizarSedeValidators = [
  body('nombre').optional().isString().isLength({ min: 2, max: 80 }),
  body('direccion').optional().isString().isLength({ max: 160 }),
  body('aforoMaximo').optional().isInt({ min: 1 }),
  body('activa').optional().isBoolean(),
];

const idParamValidator = [param('id').isUUID()];

module.exports = { crearSedeValidators, actualizarSedeValidators, idParamValidator };
