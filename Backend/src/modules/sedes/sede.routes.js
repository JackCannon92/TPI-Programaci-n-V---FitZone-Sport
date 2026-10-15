'use strict';

const { Router } = require('express');
const { crearSedeValidators, actualizarSedeValidators, idParamValidator } = require('./sedes.validators');
const { validar } = require('../../common/validar');
/**
     * @swagger
     * /api/sedes:
     *   post:
     *     summary: Crea una nueva sede (RNF-04)
     *     tags: [Sedes]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               nombre:
     *                 type: string
     *                 example: "FitZone Sede Centro"
     *               direccion:
     *                 type: string
     *                 example: "Av. Corrientes 1234"
     *               aforoMaximo:
     *                 type: integer
     *                 example: 100
     *     responses:
     *       201:
     *         description: Sede creada exitosamente
     *   get:
     *     summary: Lista todas las sedes activas
     *     tags: [Sedes]
     *     responses:
     *       200:
     *         description: Listado de sedes obtenido
     */
function crearSedesRouter(c) {
  const router = Router();
  router.post('/', crearSedeValidators, validar, c.crear);
  router.get('/', c.listar);
  router.get('/:id', idParamValidator, validar, c.obtener);
  router.patch('/:id', idParamValidator, actualizarSedeValidators, validar, c.actualizar);
  return router;
}

module.exports = { crearSedesRouter };
