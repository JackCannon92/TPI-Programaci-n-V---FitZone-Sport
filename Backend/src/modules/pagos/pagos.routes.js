'use strict';

const { Router } = require('express');
const { body, param } = require('express-validator');
const { validar } = require('../../common/validar');

/**
 * @swagger
 * tags:
 *   name: Pagos
 *   description: Pasarela simulada y generación de comprobantes (RF-13, RF-14, RNF-02)
 * 
 * /api/pagos:
 *   post:
 *     summary: Paga una reserva a través de la pasarela mock (RF-13)
 *     tags: [Pagos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reservaId, usuarioId, tarjeta]
 *             properties:
 *               reservaId:
 *                 type: string
 *               usuarioId:
 *                 type: string
 *               tarjeta:
 *                 type: object
 *                 required: [numero, titular, vencimiento, cvv]
 *                 properties:
 *                   numero:
 *                     type: string
 *                     example: "4500123456789012"
 *                   titular:
 *                     type: string
 *                     example: "Juan Perez"
 *                   vencimiento:
 *                     type: string
 *                     example: "12/28"
 *                   cvv:
 *                     type: string
 *                     example: "123"
 *     responses:
 *       201:
 *         description: Pago procesado exitosamente
 *       402:
 *         description: Pago rechazado (ej. tarjeta terminada en 0000)
 * 
 * /api/pagos/usuario/{usuarioId}:
 *   get:
 *     summary: Lista el historial de pagos de un usuario
 *     tags: [Pagos]
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Arreglo con el historial de pagos
 * 
 * /api/pagos/{id}/comprobante:
 *   get:
 *     summary: Descarga el ticket de pago en formato PDF (RF-14)
 *     tags: [Pagos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Archivo PDF descargable
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 * 
 * /api/pagos/{id}:
 *   get:
 *     summary: Obtiene el detalle de un cobro específico
 *     tags: [Pagos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos del pago y token almacenado (RNF-02)
 */
function crearPagosRouter(c) {
  const router = Router();

  router.post('/', [
    body('reservaId').isUUID(),
    body('usuarioId').isUUID(),
    body('tarjeta.numero').isString().isLength({ min: 13, max: 19 }),
    body('tarjeta.titular').isString().notEmpty(),
    body('tarjeta.vencimiento').isString().notEmpty(),
    body('tarjeta.cvv').isString().isLength({ min: 3, max: 4 }),
  ], validar, c.pagarReserva);

  router.get('/usuario/:usuarioId', [param('usuarioId').isUUID()], validar, c.pagosDeUsuario);
  
  router.get('/:id/comprobante', [param('id').isUUID()], validar, c.comprobantePdf);
  
  router.get('/:id', [param('id').isUUID()], validar, c.obtenerPago);

  return router;
}

module.exports = { crearPagosRouter };