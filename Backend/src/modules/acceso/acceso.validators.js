'use strict';

const { body, param } = require('express-validator');

const ingresoValidators = [body('token').isString().notEmpty(), body('sedeId').isUUID()];
const tokenValidators = [body('token').isString().notEmpty()];
const egresoValidators = [body('usuarioId').isUUID(), body('sedeId').isUUID()];
const usuarioIdParam = [param('usuarioId').isUUID()];
const sedeIdParam = [param('sedeId').isUUID()];

module.exports = { ingresoValidators, tokenValidators, egresoValidators, usuarioIdParam, sedeIdParam };
