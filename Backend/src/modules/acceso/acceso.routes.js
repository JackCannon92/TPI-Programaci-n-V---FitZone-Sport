'use strict';

const { Router } = require('express');
const { ingresoValidators, tokenValidators, egresoValidators, usuarioIdParam, sedeIdParam } = require('./acceso.validators');
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
/**
 * @swagger
 * /api/acceso/ingreso-reserva:
 *   post:
 *     summary: Ingreso a la sede con el QR de una reserva de cancha (QR 1 — ADR-016)
 *     description: >
 *       Para quien alquiló una cancha, sobre todo el cliente externo, que no tiene
 *       membresía. Valida la firma, el horario (desde 30 minutos antes del turno),
 *       la sede y que la reserva siga confirmada. Aplica RN-01 y el aforo.
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
 *                 description: Token que devuelve GET /api/canchas/reservas/{id}/qr
 *               sedeId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ingreso registrado
 *       401:
 *         description: QR inválido, todavía no vigente o vencido
 *       403:
 *         description: La reserva es de otra sede
 *       409:
 *         description: Reserva cancelada, RN-01 o aforo completo
 *
 * /api/acceso/qr-offline/{usuarioId}:
 *   get:
 *     summary: QR de acceso sin conexión para un socio activo (QR 2 — ADR-016)
 *     description: >
 *       Firmado con Ed25519 y válido por 24 horas (o hasta que vence la membresía).
 *       El torno lo valida sin internet, solo con la clave pública.
 *     tags: [Acceso]
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Token, validez e imagen SVG
 *       403:
 *         description: El usuario no es un socio con la membresía activa
 *
 * /api/acceso/validar-offline:
 *   post:
 *     summary: Valida un QR sin conexión como lo haría el torno, sin consultar la base (QR 2)
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
 *     responses:
 *       200:
 *         description: "{ valido: true, usuarioId, nombre, venceMembresia } o { valido: false, motivo }"
 *
 * /api/acceso/clave-publica:
 *   get:
 *     summary: Clave pública que se instala en los tornos para validar el QR sin conexión (QR 2)
 *     tags: [Acceso]
 *     responses:
 *       200:
 *         description: Clave pública Ed25519 en formato PEM
 */
function crearAccesoRouter(c) {
  const router = Router();
  router.get('/qr/:usuarioId', usuarioIdParam, validar, c.qr);
  router.get('/qr/:usuarioId.svg', usuarioIdParam, validar, c.qrSvg);
  router.post('/ingreso', ingresoValidators, validar, c.ingreso);
  router.post('/egreso', egresoValidators, validar, c.egreso);
  router.post('/ingreso-reserva', ingresoValidators, validar, c.ingresoReserva);
  router.get('/qr-offline/:usuarioId', usuarioIdParam, validar, c.qrOffline);
  router.post('/validar-offline', tokenValidators, validar, c.validarOffline);
  router.get('/clave-publica', c.clavePublica);
  router.get('/aforo/:sedeId', sedeIdParam, validar, c.aforo);
  router.get('/presentes/:sedeId', sedeIdParam, validar, c.presentes);
  return router;
}

module.exports = { crearAccesoRouter };
