'use strict';

const { Router } = require('express');
const v = require('./clases.validators');
const { validar } = require('../../common/validar');

/**
 * @swagger
 * tags:
 *   name: Clases
 *   description: Gestión de agenda, inscripciones y lista de espera (RF-06 a RF-08)
 * 
 * /api/clases:
 *   post:
 *     summary: Crea una nueva clase grupal con capacidad máxima (RF-06)
 *     tags: [Clases]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sedeId, tipo, instructor, fechaHora, capacidadMaxima]
 *             properties:
 *               sedeId:
 *                 type: string
 *               tipo:
 *                 type: string
 *                 example: "Spinning"
 *               instructor:
 *                 type: string
 *               fechaHora:
 *                 type: string
 *                 format: date-time
 *               capacidadMaxima:
 *                 type: integer
 *                 example: 20
 *     responses:
 *       201:
 *         description: Clase creada exitosamente
 *   get:
 *     summary: Lista las clases programadas (permite filtrar por sede)
 *     tags: [Clases]
 *     parameters:
 *       - in: query
 *         name: sedeId
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Arreglo de clases disponibles
 * 
 * /api/clases/{id}:
 *   get:
 *     summary: Obtiene los detalles de una clase específica
 *     tags: [Clases]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos de la clase
 * 
 * /api/clases/reservas:
 *   post:
 *     summary: Reserva un cupo y lo decrementa de la clase (RF-07)
 *     tags: [Clases]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [claseId, usuarioId]
 *             properties:
 *               claseId:
 *                 type: string
 *               usuarioId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Reserva confirmada
 *       400:
 *         description: La clase no tiene cupos disponibles
 * 
 * /api/clases/reservas/usuario/{usuarioId}:
 *   get:
 *     summary: Lista todas las reservas de clases realizadas por un usuario
 *     tags: [Clases]
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Historial de clases del usuario
 * 
 * /api/clases/reservas/{id}/cancelar:
 *   patch:
 *     summary: Cancela una reserva y aplica penalidad si es con menos de 2hs de aviso (RF-07)
 *     tags: [Clases]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reserva cancelada exitosamente y cupo liberado
 * 
 * /api/clases/lista-espera:
 *   post:
 *     summary: Anota a un usuario en la lista de espera cuando la clase está llena (RF-08)
 *     tags: [Clases]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [claseId, usuarioId]
 *             properties:
 *               claseId:
 *                 type: string
 *               usuarioId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario agregado a la cola de espera
 * 
 * /api/clases/{id}/lista-espera:
 *   get:
 *     summary: Muestra los usuarios anotados en la lista de espera
 *     tags: [Clases]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de espera actual
 */
/**
 * @swagger
 * /api/clases/reservas/{id}/qr:
 *   get:
 *     summary: QR de asistencia de una reserva de clase confirmada (QR 3 — ADR-010)
 *     description: Vale desde 30 minutos antes de la clase hasta 60 minutos después de que empezó.
 *     tags: [Clases]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID de la reserva de clase
 *     responses:
 *       200:
 *         description: Token, ventana de validez e imagen SVG
 *       409:
 *         description: La reserva no está confirmada
 *
 * /api/clases/asistencia:
 *   post:
 *     summary: Marca la asistencia escaneando el QR (la reserva pasa a ASISTIO) (QR 3)
 *     tags: [Clases]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reserva con estado ASISTIO
 *       401:
 *         description: QR inválido o fuera del horario de la clase
 *       409:
 *         description: La asistencia ya estaba registrada o la reserva fue cancelada
 */
function crearClasesRouter(c) {
  const router = Router();
  router.post('/', v.crearClaseValidators, validar, c.crear);
  router.get('/', v.sedeQuery, validar, c.listar);
  router.post('/reservas', v.reservaValidators, validar, c.reservar);
  router.get('/reservas/usuario/:usuarioId', v.usuarioIdParam, validar, c.reservasDeUsuario);
  router.patch('/reservas/:id/cancelar', v.idParam, validar, c.cancelar);
  router.get('/reservas/:id/qr', v.idParam, validar, c.qrAsistencia);
  router.post('/asistencia', v.tokenValidators, validar, c.asistencia);
  router.post('/lista-espera', v.reservaValidators, validar, c.listaEspera);
  router.get('/:id/lista-espera', v.idParam, validar, c.verListaEspera);
  router.get('/:id', v.idParam, validar, c.obtener);
  return router;
}

module.exports = { crearClasesRouter };