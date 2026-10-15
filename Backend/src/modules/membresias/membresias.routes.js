'use strict';

const { Router } = require('express');

const crearMembresiasRouter = (membresiasController) => {
    const router = Router();

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

    return router;
};

module.exports = { crearMembresiasRouter };