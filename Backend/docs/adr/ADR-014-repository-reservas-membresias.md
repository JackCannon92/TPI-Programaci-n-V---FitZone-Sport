# ADR-014 — Repository para Reserva de cancha y Membresía

- **Estado:** Aceptado
- **Fecha:** 2026-10-15
- **Autor:** Sirizzotti, Martín Emiliano
- **Sprint:** 4
- **Relacionado:** RN-02, RF-02, ADR-002 (persistencia), olores O-3, O-4 y O-14 de `docs/LOG.md`

## Contexto

Dos agregados del dominio tienen reglas ricas que hay que poder probar sin levantar una base de datos:

- **Reserva de cancha:** RN-02 exige que dos personas no reserven la misma cancha en el mismo horario. La garantía la da PostgreSQL con el índice único parcial `uq_reserva_cancha_turno_activo`, pero el servicio de canchas usaba `ReservaCanchaModel` y `Op.between` directamente, y atrapaba `SequelizeUniqueConstraintError` para traducirlo. Así el dominio conocía la infraestructura, y no se podía probar sin una base.
- **Membresía (RF-02):** el vencimiento automático, la renovación (que suma meses al vencimiento actual o arranca desde hoy si está vencida) y la suspensión estaban mezclados con llamadas directas al modelo de Sequelize.

En la Unidad I se había previsto un `BookingRepository` general. La Clase 2 de la Unidad III indica aplicar el repositorio de dominio solo a los agregados con reglas ricas, y no a todas las entidades.

## Alternativas consideradas

| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| **Seguir usando los modelos de Sequelize en los servicios** | Cero archivos nuevos. | Las reglas no se prueban sin base, y el error de RN-02 se traduce en el servicio, que así conoce a Sequelize. | Las reglas de RN-02 y de membresías no se podrían probar sin base de datos. |
| **Repository para todas las entidades** (sedes, canchas, clases, pagos) | Uniformidad. | La mayoría solo delegaría uno a uno en el modelo, con el mismo nombre y los mismos tipos: el "repositorio vacío" que la cátedra marca como olor. Agrega archivos y no traduce nada. | Serían repositorios vacíos que solo repiten el modelo: complejidad sin beneficio. |
| **Repository solo para Reserva de cancha y Membresía: un puerto y dos adaptadores** | Las reglas se prueban con un adaptador en memoria. El adaptador traduce nombres, tipos y errores al idioma del dominio. | Hay que mantener dos implementaciones del mismo contrato. Y queda un camino de escritura de Membresía que todavía no pasa por el repositorio (olor O-14). | **Elegida.** |

## Decisión

**Se aplica Repository solo a Reserva de cancha y Membresía.** Cada uno tiene un puerto, que define el contrato, y dos adaptadores que lo cumplen:

| Agregado | Puerto | Adaptador real | Adaptador en memoria |
|---|---|---|---|
| Reserva de cancha | `canchas/repositorio/reservas.puerto.js` | `reservas.sequelize.js` | `reservas.memoria.js` |
| Membresía | `membresias/repositorio/membresias.puerto.js` | `membresias.sequelize.js` | `membresias.memoria.js` |

Reglas adoptadas:

- **El puerto habla el idioma del negocio:** `turnosOcupados`, `registrar`, `cambiarEstado`, `deUsuario`, `guardar`. Ninguna firma menciona Sequelize, SQL ni transacciones.
- **Se devuelven objetos planos, no instancias del ORM.** Nadie fuera del adaptador puede hacer `reserva.save()`: todo cambio pasa por el repositorio.
- **El adaptador traduce los errores de la base a errores del dominio:** `SequelizeUniqueConstraintError` pasa a ser `TurnoYaReservadoError` (409) en reservas y `MembresiaDuplicadaError` (409) en membresías.
- **El patrón ubica la concurrencia de RN-02, pero no la resuelve.** Quién gana la carrera lo decide el índice único de PostgreSQL; el repositorio decide dónde se traduce el error.
- **Las demás entidades siguen usando su modelo directamente.** El archivo viejo `canchas/canchas.repository.js` no lo usa nadie y tiene un `require` roto, así que se borra (olor O-4).

## Consecuencias

**Positivas**
- El servicio de canchas ya no importa nada de Sequelize.
- RN-02 tiene un error propio del dominio y un 409 real hacia el cliente (para lo cual también hubo que corregir `AppError`, olor O-8).
- Las reglas de reservas y membresías se prueban en milisegundos, con el adaptador en memoria.

**Negativas / riesgos**
- Dos implementaciones por contrato. Se mitiga con los mismos tests, que prueban el servicio real sobre el adaptador en memoria.
- Al registrar un socio, la membresía todavía se crea con el modelo directo, porque ocurre dentro de la transacción de `usuariosService.registrarUsuario` (olor O-14). Queda para cuando el repositorio acepte una transacción.

## Cómo se verifica

```bash
npm test -- reservas-cancha   # test/unit/reservas-cancha.test.js: RN-02, cancelación, grilla
npm test -- membresias        # tests unitarios y de integración de membresías
npm test -- canchas.api       # POST /api/canchas/reservas: 201, y 409 en el segundo intento
```

En Swagger: reservar dos veces el mismo turno devuelve `409` con "Ese turno acaba de ser reservado por otro usuario (RN-02)".

## Requisitos relacionados

RN-02, RF-02
