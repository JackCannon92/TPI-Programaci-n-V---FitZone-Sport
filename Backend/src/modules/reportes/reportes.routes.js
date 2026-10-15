'use strict';

const { Router } = require('express');
const { query } = require('express-validator');
const { validar } = require('../../common/validar');

/**
 * @swagger
 * /api/reportes/ocupacion:
 *   get:
 *     summary: Tablero del gerente — ocupación de canchas por sede en un mes (CQRS nivel 2)
 *     description: >
 *       Consulta de solo lectura con SQL propio. No pasa por el repositorio de
 *       reservas ni por los modelos. Si no se mandan anio y mes, usa el mes actual.
 *     tags: [Reportes]
 *     parameters:
 *       - in: query
 *         name: anio
 *         schema:
 *           type: integer
 *           example: 2026
 *       - in: query
 *         name: mes
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *           example: 10
 *     responses:
 *       200:
 *         description: Ocupación, reservas e ingresos por sede, más los totales de la red
 *       400:
 *         description: Año o mes inválidos
 */
function crearReportesRouter({ ocupacionQuery }) {
  const router = Router();

  router.get(
    '/ocupacion',
    [
      query('anio').optional().isInt({ min: 2020, max: 2100 }),
      query('mes').optional().isInt({ min: 1, max: 12 }),
    ],
    validar,
    async (req, res, next) => {
      try {
        // En Express 5 req.query es de solo lectura: convertimos acá y no con .toInt().
        const hoy = new Date();
        const anio = req.query.anio !== undefined ? Number(req.query.anio) : hoy.getFullYear();
        const mes = req.query.mes !== undefined ? Number(req.query.mes) : hoy.getMonth() + 1;
        res.json(await ocupacionQuery.porMes({ anio, mes }));
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}

module.exports = { crearReportesRouter };
