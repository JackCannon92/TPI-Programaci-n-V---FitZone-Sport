'use strict';

const { body, param } = require('express-validator');

const ingresoValidators = [body('token').isString().notEmpty(), body('sedeId').isUUID()];
const egresoValidators = [body('usuarioId').isUUID(), body('sedeId').isUUID()];
const usuarioIdParam = [param('usuarioId').isUUID()];
const sedeIdParam = [param('sedeId').isUUID()];

module.exports = { ingresoValidators, egresoValidators, usuarioIdParam, sedeIdParam };
