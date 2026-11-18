# RNF-03 · Rendimiento de la consulta de disponibilidad

> La consulta de disponibilidad de canchas debe responder en pocos milisegundos (índices en base de datos).

## Cómo se cumple

`GET /api/v1/canchas/{id}/disponibilidad?fecha=AAAA-MM-DD` arma la grilla del día con una sola consulta: los turnos ocupados de esa cancha entre las 8 y las 23 (`turnosOcupados()` en `backend/src/canchas/repositorio/reservas.sequelize.js`). La resuelve el índice único parcial de RN-02, que ya está ordenado por cancha y hora (`backend/db/01-esquema.sql`):

```sql
CREATE UNIQUE INDEX uq_reserva_cancha_turno_activo
  ON reservas_cancha (cancha_id, fecha_hora_inicio)
  WHERE estado IN ('PENDIENTE_PAGO', 'CONFIRMADA');
```

## Medición (18/11/2026)

Para que la medición tenga sentido se cargó **un año de turnos confirmados en las 64 canchas** del seed: 349.377 filas en `reservas_cancha`. Después se borraron.

Plan de PostgreSQL para la consulta de un día:

```
Index Only Scan using uq_reserva_cancha_turno_activo on reservas_cancha
  Index Cond: ((cancha_id = '…') AND (fecha_hora_inicio >= …) AND (fecha_hora_inicio <= …))
  Heap Fetches: 0
Execution Time: 0.121 ms
```

La misma consulta sin poder usar índices recorre toda la tabla (`Parallel Seq Scan`): **39,8 ms**, unas 330 veces más.

Tiempo de respuesta de la API completa (HTTP, validación, consulta y armado de la grilla), 100 pedidos seguidos:

| Promedio | Mediana | p95 | Máximo |
|---|---|---|---|
| 3,4 ms | 3,2 ms | 5,4 ms | 9,6 ms |

Otros índices de la base para consultas frecuentes: `idx_registros_acceso_sede_fecha` (aforo y presentes), `idx_clases_sede_fecha` (clases por sede y día), `idx_reservas_cancha_usuario` y `idx_reservas_clase_usuario` (mis reservas).

## Límite

Medido en una máquina local, con un solo usuario a la vez. No hay prueba de carga con usuarios concurrentes.
