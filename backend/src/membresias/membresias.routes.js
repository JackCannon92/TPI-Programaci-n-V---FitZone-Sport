'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const { validar } = require('../common/validar');

const crearMembresiasRouter = (membresiasController) => {
    const router = Router();

    /**
     * @swagger
     * /api/membresias/precios:
     *   get:
     *     summary: Precio de cada plan de membresía (RF-02)
     *     tags: [Membresías]
     *     responses:
     *       200:
     *         description: "{ MENSUAL, TRIMESTRAL, ANUAL }"
     */
    router.get('/precios', membresiasController.precios);

    /**
     * @swagger
     * /api/membresias/{id_usuario}:
     *   get:
     *     summary: Obtiene el estado actual de la membresía de un usuario (RF-02)
     *     tags: [Membresías]
     *     parameters:
     *       - in: path
     *         name: id_usuario
     *         required: true
     *         schema:
     *           type: string
     *         description: UUID del usuario
     *     responses:
     *       200:
     *         description: Estado de la membresía obtenido con éxito
     *       404:
     *         description: Membresía no encontrada
     */
    router.get('/:id_usuario', membresiasController.obtenerEstado);

    /**
     * @swagger
     * /api/membresias/{id_usuario}/renovar:
     *   put:
     *     summary: Renueva el plan de membresía de un socio (RF-02)
     *     tags: [Membresías]
     *     parameters:
     *       - in: path
     *         name: id_usuario
     *         required: true
     *         schema:
     *           type: string
     *           description: UUID del usuario
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - plan
     *             properties:
     *               plan:
     *                 type: string
     *                 enum: [MENSUAL, TRIMESTRAL, ANUAL]
     *                 example: "ANUAL"
     *     responses:
     *       200:
     *         description: Membresía renovada con éxito
     */
    router.put('/:id_usuario/renovar', membresiasController.renovar);

    /**
     * @swagger
     * /api/membresias/{id_usuario}/suspender:
     *   patch:
     *     summary: Suspende la membresía de un socio (RF-02)
     *     tags: [Membresías]
     *     parameters:
     *       - in: path
     *         name: id_usuario
     *         required: true
     *         schema:
     *           type: string
     *           description: UUID del usuario
     *     responses:
     *       200:
     *         description: Membresía suspendida exitosamente
     */
    router.patch('/:id_usuario/suspender', membresiasController.suspender);


    /**
     * @swagger
     * /api/membresias/{id_usuario}/pagar:
     *   post:
     *     summary: Renueva la membresía pagando con tarjeta por la pasarela (RF-02 y RF-13)
     *     description: Si el pago se rechaza (tarjeta terminada en 0000 en la simulación), responde 402 y la membresía no cambia. Solo se guarda el token y los últimos 4 dígitos (ADR-010).
     *     tags: [Membresías]
     *     parameters:
     *       - in: path
     *         name: id_usuario
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [plan, tarjeta]
     *             properties:
     *               plan:
     *                 type: string
     *                 enum: [MENSUAL, TRIMESTRAL, ANUAL]
     *               tarjeta:
     *                 type: object
     *                 properties:
     *                   numero: { type: string, example: "4111111111111111" }
     *                   titular: { type: string }
     *                   vencimiento: { type: string, example: "12/28" }
     *                   cvv: { type: string, example: "123" }
     *     responses:
     *       201:
     *         description: Pago aprobado y membresía renovada
     *       402:
     *         description: Pago rechazado; la membresía no cambió
     */
    router.post('/:id_usuario/pagar', [
        body('plan').isIn(['MENSUAL', 'TRIMESTRAL', 'ANUAL']),
        body('tarjeta.numero').isString().isLength({ min: 13, max: 19 }),
        body('tarjeta.titular').isString().notEmpty(),
        body('tarjeta.vencimiento').isString().notEmpty(),
        body('tarjeta.cvv').isString().isLength({ min: 3, max: 4 }),
    ], validar, membresiasController.pagar);

    return router;
};

module.exports = { crearMembresiasRouter };