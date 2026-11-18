'use strict';

const { body, param } = require('express-validator');

const ingresoValidators = [body('token').isString().notEmpty(), body('sedeId').isUUID()];
const tokenValidators = [body('token').isString().notEmpty()];
const egresoValidators = [body('usuarioId').isUUID(), body('sedeId').isUUID()];
const usuarioIdParam = [param('usuarioId').isUUID()];
const sedeIdParam = [param('sedeId').isUUID()];

// ADR-007: la cola de ingresos sin conexión que manda el terminal (hasta 200 por envío).
const MAX_INGRESOS_POR_ENVIO = 200;
const sincronizarValidators = [
  body('sedeId').isUUID(),
  body('ingresos').isArray({ min: 1, max: MAX_INGRESOS_POR_ENVIO }).withMessage(`Mandá entre 1 y ${MAX_INGRESOS_POR_ENVIO} ingresos por envío.`),
  body('ingresos.*.id').isString().notEmpty(),
  body('ingresos.*.token').isString().notEmpty(),
  body('ingresos.*.fechaIngreso').isISO8601(),
];

module.exports = { ingresoValidators, tokenValidators, egresoValidators, usuarioIdParam, sedeIdParam, sincronizarValidators, MAX_INGRESOS_POR_ENVIO };
