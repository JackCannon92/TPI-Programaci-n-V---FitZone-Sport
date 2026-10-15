# ADR-007 — Patrones de diseño aplicados en el backend (Unidad III)

- **Estado:** Aceptado
- **Fecha:** 15/10/2026
- **Unidad:** III — Patrones de diseño
- **Responsable de la unidad:** Martín Emiliano Sirizzotti
- **Relacionado:** amplía y reemplaza en parte a ADR-005 (patrones GoF, Unidad I). Es el "ADR de patrones" que pide la consigna de la Unidad III como ADR-003; en nuestro registro ese número ya corresponde al monolito modular, así que toma el siguiente libre.

## Qué cambia respecto de ADR-005

- **Strategy y Observer:** se mantienen como se decidieron en la Unidad I, ahora implementados.
- **Repository:** ADR-005 preveía un `BookingRepository` general. Siguiendo la Clase 2 de la Unidad III, se aplica solo a los dos agregados con reglas ricas (Reserva de cancha y Membresía).
- **CQRS nivel 2:** decisión nueva, para el tablero del gerente.

## Contexto

El backend de FitZone (monolito modular, Node.js + Express + Sequelize sobre PostgreSQL/Supabase) tenía cuatro puntos donde un requerimiento concreto pedía una decisión de diseño:

1. El precio de una cancha (RF-11) estaba simulado: siempre devolvía el precio base.
2. Las reglas de reserva conocían a Sequelize, y no se podían probar sin una base.
3. La lista de espera de clases (RF-08) se cargaba, pero nadie avisaba cuando se liberaba un cupo.
4. El gerente central necesita leer la ocupación de todas las sedes juntas, y reservar necesita consistencia fuerte (RN-02): dos necesidades opuestas.

El criterio de la cátedra es aplicar un patrón **solo donde hay una variación real y conocida**. Por eso son pocos, y cada uno lleva su justificación.

## Decisión

### 1. Strategy — precio de canchas (RF-11)

- **Requerimiento que lo motiva:** RF-11 define tres maneras de llegar al precio (estándar, descuento de socio, recargo por horario pico), y se esperan más (promociones, precios por sede).
- **Alternativa descartada:** Decorator. Como las reglas se *acumulan* sobre el mismo precio, la intención es la de un Decorator, y de hecho recorrer la lista con `reduce` es una cadena de decoradores armada desde afuera. Elegimos el nombre y la forma de Strategy porque cada regla se prueba sola y se agrega a una lista, sin anidar objetos.
- **Por qué:** una regla nueva es un archivo nuevo más una línea en `compositionRoot.js`, y el `Tarifador` no se toca (principio abierto/cerrado). El orden (primero el descuento, después el recargo) es una decisión de negocio escrita en un solo lugar.
- **Dónde:** `canchas/strategies/` (`tarifador.js` es el contexto; `standarPricing.js`, `memberDiscountPricing.js` y `peakHourPricing.js` son las estrategias). La cadena se arma en `core/compositionRoot.js`.

### 2. Repository — Reserva de cancha y Membresía

- **Requerimiento que lo motiva:** RN-02 (dos socios no pueden reservar el mismo turno) y las reglas de vencimiento y renovación de RF-02 tienen que poder probarse sin levantar una base.
- **Alternativa descartada:** abstraer todas las entidades. Un repositorio para sedes, canchas o clases solo delegaría uno a uno en el modelo (el "repositorio vacío"): agrega un archivo y no traduce nada.
- **Por qué:** cada puerto (`*.puerto.js`) habla el idioma del negocio (`turnosOcupados`, `registrar`, `deUsuario`), devuelve objetos planos y tiene dos adaptadores: Sequelize y memoria. El adaptador traduce el error de infraestructura al del dominio: `SequelizeUniqueConstraintError` → `TurnoYaReservadoError` (409).
- **Importante:** el patrón no resuelve la concurrencia de RN-02, solo la ubica. Quién gana la carrera lo decide PostgreSQL con el índice único parcial `uq_reserva_cancha_turno_activo`, y el repositorio decide dónde se traduce ese error.

### 3. Observer — aviso a la lista de espera (RF-08)

- **Requerimiento que lo motiva:** cuando se cancela una reserva de clase, hay que avisar a la lista de espera. Después se pueden sumar más interesados (tablero de ocupación, métricas, mail).
- **Alternativa descartada:** llamar al aviso directamente desde `cancelarReserva()`. Cada interesado nuevo obligaría a editar ese método, y si fallara el aviso se caería la cancelación.
- **Por qué:** `cancelarReserva()` publica el hecho `CupoLiberado` y termina, sin saber quién escucha. Usamos el `EventEmitter` de Node en vez de escribir el patrón a mano, y le agregamos aislamiento de fallas: un oyente que falla no arrastra a los demás.

| Evento | Lo publica | Oyentes | Qué hace el oyente |
|---|---|---|---|
| `CupoLiberado` | `clases.service.cancelarReserva` (después de guardar) | `clases/observer/waitlistNotifier.js` | Marca como notificado al primero de la lista de espera y deja el aviso en el log. |

Avisar no es reservar: el socio avisado tiene que entrar y reservar. Limitación conocida: el evento vive en memoria, y si el proceso se cae justo después de guardar, el aviso se pierde. Si el aviso fuera crítico haría falta una bandeja de salida en la base, pero eso queda fuera del alcance del TI.

### 4. CQRS nivel 2 — tablero del gerente

- **Requerimiento que lo motiva:** el conflicto central del caso: "transaccionalidad en la reserva vs. reportes centralizados entre sedes".
- **Alternativa descartada:** CQRS nivel 3 (una base aparte para lectura, sincronizada por eventos). Trae consistencia eventual y su costo operativo, y con nuestro volumen no hay ninguna medición que lo justifique.
- **Por qué:** `GET /api/reportes/ocupacion` ejecuta SQL propio con `GROUP BY` y devuelve un DTO plano. No pasa por el repositorio ni por los modelos, y no abre transacciones de escritura. Sigue siendo la misma base, así que los números siempre están al día.

## Patrones evaluados y descartados

| Patrón | Dónde se evaluó | Por qué no |
|---|---|---|
| Builder | Crear una Reserva | Tiene seis campos y la mitad se derivan en el servicio (fin, precio, detalle). No hay campos opcionales ni constructores telescópicos. |
| State | Membresía (Activo / Vencido / Suspendido) | Hoy solo dos lugares preguntan por el estado (`esSocioActivo` y el vencimiento en `obtenerMembresia`). Si aparecen reglas por estado (precio, ingreso) o una auditoría de transiciones, es el siguiente candidato. |
| Chain of Responsibility | Validaciones antes de reservar | Las validaciones cortan en la primera falla, y no se pide devolver todos los errores juntos. |
| Abstract Factory | Pasarela de pagos | Hay una sola pasarela y un solo país: no existe una segunda familia de productos. |
| Singleton | Servicios | El `compositionRoot` crea una instancia de cada servicio y la inyecta (DI manual): no hace falta acceso global. |

## Consecuencias

- **Ganamos:** reglas probadas sin base de datos (32 tests con `node --test`, menos de un segundo), reglas de precio y oyentes nuevos sin tocar código existente, y RN-02 con un error del dominio y un 409 real.
- **Pagamos:** más archivos para seguir un flujo (precio: servicio → tarifador → reglas; cancelación: servicio → bus → oyente), y la indirección del Observer, que hace que no se vea en el servicio quién escucha. Esto último lo compensa la tabla de eventos de arriba y que todas las suscripciones estén en `compositionRoot.js`.
- **Requisito de base:** el cupo de las clases lo descuenta el trigger `fn_actualizar_cupos_clase`. Si la base se creó con Sequelize y no lo tiene, hay que correr `docs/trigger-cupos-clases.sql` (ver olor O-9).
