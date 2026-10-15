'use strict';

const { body, param, query } = require('express-validator');

const crearClaseValidators = [
  body('sedeId').isUUID(),
  body('tipo').isString().isLength({ min: 2, max: 60 }),
  body('instructor').isString().isLength({ min: 2, max: 80 }),
  body('fechaHora').isISO8601(),
  body('capacidadMaxima').isInt({ min: 1 }),
];
const reservaValidators = [body('claseId').isUUID(), body('usuarioId').isUUID()];
const idParam = [param('id').isUUID()];
const usuarioIdParam = [param('usuarioId').isUUID()];
const sedeQuery = [query('sedeId').optional().isUUID()];

module.exports = { crearClaseValidators, reservaValidators, idParam, usuarioIdParam, sedeQuery };
