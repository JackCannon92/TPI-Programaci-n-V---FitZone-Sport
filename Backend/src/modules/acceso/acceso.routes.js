'use strict';

const { Router } = require('express');
const { ingresoValidators, egresoValidators, usuarioIdParam, sedeIdParam } = require('./acceso.validators');
const { validar } = require('../../common/validar');
/**
     * @swagger
     * /api/acceso/qr/{usuarioId}:
     *   get:
     *     summary: Genera el token QR dinámico para un socio (RF-04)
     *     tags: [Acceso]
     *     parameters:
     *       - in: path
     *         name: usuarioId
     *         required: true
     *         schema:
     *           type: string
     *         description: UUID del usuario
     *     responses:
     *       200:
     *         description: Token generado exitosamente (vigente por 1 minuto)
     * 
     * /api/acceso/ingreso:
     *   post:
     *     summary: Registra el ingreso validando token, membresía y aforo (RF-04, RF-05, RN-01)
     *     tags: [Acceso]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               token:
     *                 type: string
     *                 description: Token extraído del endpoint generador de QR
     *               sedeId:
     *                 type: string
     *                 description: UUID de la sede a la que intenta ingresar
     *     responses:
     *       201:
     *         description: Ingreso registrado exitosamente
     *       401:
     *         description: QR inválido o vencido
     *       403:
     *         description: Membresía vencida
     *       409:
     *         description: Aforo completo o el usuario ya figura adentro de otra sede
     * 
     * /api/acceso/aforo/{sedeId}:
     *   get:
     *     summary: Consulta la cantidad de personas adentro y los cupos disponibles (RF-05)
     *     tags: [Acceso]
     *     parameters:
     *       - in: path
     *         name: sedeId
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Cálculo de aforo en tiempo real obtenido
     */
    /**
     * @swagger
     * /api/acceso/egreso:
     *   post:
     *     summary: Registra la salida de un usuario liberando el aforo (RF-05)
     *     tags: [Acceso]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - usuarioId
     *               - sedeId
     *             properties:
     *               usuarioId:
     *                 type: string
     *                 description: UUID del usuario que sale
     *               sedeId:
     *                 type: string
     *                 description: UUID de la sede
     *     responses:
     *       200:
     *         description: Egreso registrado correctamente
     *       404:
     *         description: El usuario no figura adentro de esta sede
     */
function crearAccesoRouter(c) {
  const router = Router();
  router.get('/qr/:usuarioId', usuarioIdParam, validar, c.qr);
  router.get('/qr/:usuarioId.svg', usuarioIdParam, validar, c.qrSvg);
  router.post('/ingreso', ingresoValidators, validar, c.ingreso);
  router.post('/egreso', egresoValidators, validar, c.egreso);
  router.get('/aforo/:sedeId', sedeIdParam, validar, c.aforo);
  router.get('/presentes/:sedeId', sedeIdParam, validar, c.presentes);
  return router;
}

module.exports = { crearAccesoRouter };
