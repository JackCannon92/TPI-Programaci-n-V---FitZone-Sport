# ADR-004 — Control de concurrencia en la reserva de canchas: índice único parcial en la base

- **Estado:** Aceptado
- **Fecha:** 2026-08-27
- **Autor:** Ayala, Franco
- **Sprint:** 1

## Contexto

RN-02 establece que, si dos personas intentan reservar la misma cancha en el mismo horario en el mismo instante, solo una puede tener éxito. Es el riesgo central del módulo de canchas: con 25 sedes y el horario pico de 19 a 21, dos pedidos simultáneos para el mismo turno son esperables.

El problema es una condición de carrera. Si la aplicación primero pregunta "¿está libre?" y después guarda, dos pedidos que llegan casi juntos pueden recibir los dos un "sí" antes de que cualquiera haya guardado, y el turno queda vendido dos veces. Además, una reserva cancelada tiene que liberar el turno para que otro lo tome.

## Alternativas consideradas

| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| Verificar en la aplicación antes de guardar (`SELECT` previo) | Simple de escribir y de leer. | No resuelve la carrera: entre la consulta y el guardado otro pedido puede pasar la misma verificación. | Falla justo en el caso que RN-02 quiere evitar. |
| Bloqueo pesimista (`SELECT … FOR UPDATE`) | Garantiza exclusión mientras dura la transacción. | Bloquea filas que **ya existen**; una reserva nueva no tiene fila que bloquear. Habría que bloquear la cancha entera o la tabla, frenando a todos los que reservan otros turnos de esa cancha. | Bloquea de más y agrega esperas en el horario pico. |
| Bloqueo optimista (columna de versión) | No bloquea; detecta el conflicto al guardar. | Sirve para **modificar** un registro existente que dos personas editan a la vez; para **crear** reservas nuevas no hay versión que comparar. | No aplica al problema de crear. |
| Tabla de turnos precargada (una fila por cancha y hora) con bloqueo | Habilita el bloqueo pesimista u optimista sobre la fila del turno. | Hay que generar y mantener millones de filas (25 sedes × canchas × horas × días). | Costo de mantenimiento desproporcionado. |
| **Índice único parcial en la base de datos** | La base garantiza la unicidad de forma atómica, sin importar cuántos pedidos lleguen ni en qué orden. El "parcial" permite que las reservas canceladas no ocupen el turno. | Depende de PostgreSQL (ADR-002); el que pierde recibe un error y tiene que elegir otro turno. | **Elegida.** |

## Decisión

La garantía de RN-02 la da **PostgreSQL con un índice único parcial**:

```sql
CREATE UNIQUE INDEX uq_reserva_cancha_turno_activo
  ON reservas_cancha (cancha_id, fecha_hora_inicio)
  WHERE estado IN ('PENDIENTE_PAGO', 'CONFIRMADA');
```

Si dos pedidos intentan guardar la misma cancha y horario, la base acepta el primero y rechaza el segundo. El repositorio de reservas (`reservas.sequelize.js`) traduce ese rechazo a un error del dominio, `TurnoYaReservadoError`, y la API responde **409** con el mensaje "Ese turno acaba de ser reservado por otro usuario (RN-02)". Como el índice solo cuenta las reservas activas, cancelar una reserva libera el turno.

El criterio determinante fue que **la única forma de que no exista la carrera es que la decida la base**, que es atómica; cualquier verificación en la aplicación llega tarde.

Para los cupos de las clases sí usamos bloqueo pesimista (`lock: UPDATE` sobre la fila de la clase dentro de una transacción): ahí existe una fila que todos modifican, el contador de cupos, y es el caso donde ese bloqueo corresponde.

## Consecuencias

- **Positivas:** es imposible confirmar dos reservas activas para el mismo turno, aunque el código tenga un error o haya muchos pedidos simultáneos; el cliente recibe un 409 claro y puede elegir otro horario; no hay bloqueos que hagan esperar a los demás.
- **Negativas:** la regla depende de una característica de PostgreSQL (los índices parciales; MySQL no los tiene); el intento perdedor ve un error en lugar de una espera; las pruebas sin base usan un repositorio en memoria que imita el índice, por lo que la garantía real solo se verifica contra PostgreSQL.
- **Deuda asumida:** falta una prueba de concurrencia automatizada contra una base PostgreSQL real (dos pedidos en paralelo) y una reserva "en espera" que libere el turno si el pago no se concreta en cierto tiempo.

## Requisitos relacionados

RN-02, RF-10, RF-07
