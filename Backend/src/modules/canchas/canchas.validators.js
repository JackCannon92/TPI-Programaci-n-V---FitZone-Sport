'use strict';

const { body, param, query } = require('express-validator');
const { TipoCancha, EstadoCancha } = require('../../common/enums');

const crearCanchaValidators = [
  body('sedeId').isUUID(),
  body('nombre').isString().isLength({ min: 2, max: 60 }),
  body('tipo').isIn(Object.values(TipoCancha)),
  body('precioHora').isFloat({ min: 0 }),
];
const estadoValidators = [body('estado').isIn(Object.values(EstadoCancha))];
const disponibilidadValidators = [query('fecha').matches(/^\d{4}-\d{2}-\d{2}$/)];
const cotizarValidators = [query('usuarioId').isUUID(), query('inicio').isISO8601()];
const reservarValidators = [body('canchaId').isUUID(), body('usuarioId').isUUID(), body('fechaHoraInicio').isISO8601()];
const idParam = [param('id').isUUID()];
const sedeIdParam = [param('sedeId').isUUID()];
const usuarioIdParam = [param('usuarioId').isUUID()];

module.exports = {
  crearCanchaValidators, estadoValidators, disponibilidadValidators, cotizarValidators,
  reservarValidators, idParam, sedeIdParam, usuarioIdParam,
};
