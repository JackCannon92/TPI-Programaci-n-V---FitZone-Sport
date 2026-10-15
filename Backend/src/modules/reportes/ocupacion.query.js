'use strict';

/**
 * Tablero del gerente central — CQRS NIVEL 2 (separar el modelo de lectura).
 *
 * El conflicto central de FitZone: reservar una cancha necesita consistencia
 * fuerte (RN-02), y el tablero del gerente necesita leer 25 sedes juntas y
 * rápido. Son requisitos opuestos.
 *
 * Por eso esta consulta NO pasa por el repositorio de reservas ni por los
 * modelos de Sequelize: es SQL propio, con GROUP BY, que devuelve un DTO plano
 * listo para dibujar. No carga entidades, no abre transacciones de escritura y
 * no conoce las reglas del agregado Reserva. Y está bien que así sea.
 *
 * Seguimos en la MISMA base (nivel 2, no nivel 3): los números son siempre
 * los actuales, sin consistencia eventual.
 */
const { QueryTypes } = require('sequelize');

const ZONA_HORARIA = 'America/Argentina/Buenos_Aires';
// Horario de las canchas: de 8 a 23 (el mismo que usa la grilla de disponibilidad).
const HORAS_HABILES_POR_DIA = 15;

const SQL_OCUPACION_POR_SEDE = `
WITH periodo AS (
  SELECT make_timestamptz(:anio, :mes, 1, 0, 0, 0, :zona)                      AS desde,
         make_timestamptz(:anio, :mes, 1, 0, 0, 0, :zona) + interval '1 month' AS hasta
),
canchas_por_sede AS (
  SELECT sede_id, COUNT(*) AS canchas
  FROM canchas
  GROUP BY sede_id
),
reservas_del_mes AS (
  SELECT c.sede_id,
         COUNT(*) FILTER (WHERE r.estado = 'CONFIRMADA')     AS confirmadas,
         COUNT(*) FILTER (WHERE r.estado = 'PENDIENTE_PAGO') AS pendientes,
         COUNT(*) FILTER (WHERE r.estado = 'CANCELADA')      AS canceladas,
         COALESCE(SUM(EXTRACT(EPOCH FROM (r.fecha_hora_fin - r.fecha_hora_inicio)) / 3600)
                  FILTER (WHERE r.estado = 'CONFIRMADA'), 0) AS horas_confirmadas,
         COALESCE(SUM(r.precio_final) FILTER (WHERE r.estado = 'CONFIRMADA'), 0) AS ingresos
  FROM reservas_cancha r
  JOIN canchas c ON c.id = r.cancha_id
  CROSS JOIN periodo p
  WHERE r.fecha_hora_inicio >= p.desde
    AND r.fecha_hora_inicio <  p.hasta
  GROUP BY c.sede_id
)
SELECT s.id                                         AS "sedeId",
       s.nombre                                     AS "sede",
       COALESCE(cs.canchas, 0)::int                 AS "canchas",
       COALESCE(rm.confirmadas, 0)::int             AS "reservasConfirmadas",
       COALESCE(rm.pendientes, 0)::int              AS "reservasPendientes",
       COALESCE(rm.canceladas, 0)::int              AS "reservasCanceladas",
       ROUND(COALESCE(rm.horas_confirmadas, 0)::numeric, 1)::float AS "horasReservadas",
       COALESCE(rm.ingresos, 0)::float              AS "ingresos",
       CASE WHEN COALESCE(cs.canchas, 0) = 0 THEN 0
            ELSE ROUND((100.0 * COALESCE(rm.horas_confirmadas, 0)
                 / (cs.canchas * :horasPorDia * EXTRACT(DAY FROM (p.hasta - p.desde))))::numeric, 1)::float
       END                                          AS "ocupacionPorcentaje"
FROM sedes s
CROSS JOIN periodo p
LEFT JOIN canchas_por_sede cs ON cs.sede_id = s.id
LEFT JOIN reservas_del_mes rm ON rm.sede_id = s.id
WHERE s.activa = true
ORDER BY "ocupacionPorcentaje" DESC, s.nombre;
`;

function crearOcupacionQuery({ sequelize }) {
  /**
   * Ocupación de canchas por sede en un mes.
   * @param {{ anio: number, mes: number }} periodo
   */
  async function porMes({ anio, mes }) {
    const sedes = await sequelize.query(SQL_OCUPACION_POR_SEDE, {
      replacements: { anio, mes, zona: ZONA_HORARIA, horasPorDia: HORAS_HABILES_POR_DIA },
      type: QueryTypes.SELECT,
    });

    const totales = sedes.reduce((acc, s) => ({
      reservasConfirmadas: acc.reservasConfirmadas + s.reservasConfirmadas,
      horasReservadas: Math.round((acc.horasReservadas + s.horasReservadas) * 10) / 10,
      ingresos: Math.round((acc.ingresos + s.ingresos) * 100) / 100,
    }), { reservasConfirmadas: 0, horasReservadas: 0, ingresos: 0 });

    return { periodo: { anio, mes }, generadoEn: new Date().toISOString(), totales, sedes };
  }

  return { porMes };
}

module.exports = { crearOcupacionQuery };
