'use strict';

const { Router } = require('express');
const v = require('./canchas.validators');
const { validar } = require('../../common/validar');
/**
 * @swagger
 * tags:
 *   name: Canchas
 *   description: Gestión de espacios deportivos, disponibilidad y turnos (RF-09 al RF-12)
 * 
 * /api/canchas:
 *   post:
 *     summary: Alta de canchas por sede con costo y tipo (RF-09)
 *     tags: [Canchas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sedeId, nombre, tipo, precioHora]
 *             properties:
 *               sedeId:
 *                 type: string
 *               nombre:
 *                 type: string
 *               tipo:
 *                 type: string
 *                 enum: [FUTBOL, PADEL, TENIS, BASQUET]
 *               precioHora:
 *                 type: number
 *     responses:
 *       201:
 *         description: Cancha creada exitosamente
 * 
 * /api/canchas/sede/{sedeId}:
 *   get:
 *     summary: Lista todas las canchas de una sucursal específica
 *     tags: [Canchas]
 *     parameters:
 *       - in: path
 *         name: sedeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Arreglo de canchas disponibles en la sede
 * 
 * /api/canchas/{id}/disponibilidad:
 *   get:
 *     summary: Devuelve la grilla horaria de turnos disponibles y ocupados (RF-10)
 *     tags: [Canchas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: fecha
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *           example: "2026-10-15"
 *     responses:
 *       200:
 *         description: Lista de slots horarios con bandera indicando si están libres o son hora pico
 * 
 * /api/canchas/{id}/precio:
 *   get:
 *     summary: Cotiza el valor de una reserva (Precio base fijo por hora)
 *     tags: [Canchas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: inicio
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *           example: "2026-10-15T19:00:00Z"
 *     responses:
 *       200:
 *         description: Precio base de la cancha calculado exitosamente
 * 
* /api/canchas/{id}/estado:
 *   patch:
 *     summary: Inhabilita la cancha por mantenimiento bloqueando reservas futuras (RF-12)
 *     tags: [Canchas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: UUID de la cancha
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [DISPONIBLE, MANTENIMIENTO, INACTIVA]
 *     responses:
 *       200:
 *         description: Estado actualizado exitosamente
 * 
 * /api/canchas/reservas:
 *   post:
 *     summary: Reserva un turno resolviendo la concurrencia en BD (RN-02)
 *     tags: [Canchas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [canchaId, usuarioId, fechaHoraInicio]
 *             properties:
 *               canchaId:
 *                 type: string
 *               usuarioId:
 *                 type: string
 *               fechaHoraInicio:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Reserva creada con éxito
 *       409:
 *         description: Conflicto - La cancha está en mantenimiento o el turno acaba de ser tomado por otro usuario
 */
function crearCanchasRouter(c) {
  const router = Router();
  router.post('/', v.crearCanchaValidators, validar, c.crear);
  router.get('/sede/:sedeId', v.sedeIdParam, validar, c.listarPorSede);
  router.post('/reservas', v.reservarValidators, validar, c.reservar);
  router.get('/reservas/usuario/:usuarioId', v.usuarioIdParam, validar, c.reservasDeUsuario);
  router.get('/reservas/:id', v.idParam, validar, c.obtenerReserva);
  router.patch('/reservas/:id/cancelar', v.idParam, validar, c.cancelarReserva);
  router.get('/:id/disponibilidad', v.idParam, v.disponibilidadValidators, validar, c.disponibilidad);
  router.get('/:id/precio', v.idParam, v.cotizarValidators, validar, c.cotizar);
  router.patch('/:id/estado', v.idParam, v.estadoValidators, validar, c.cambiarEstado);
  router.get('/:id', v.idParam, validar, c.obtener);
  return router;
}

module.exports = { crearCanchasRouter };
