# ADR-007 — Sincronización del terminal de sede: replicación local, frecuencia y resolución de conflictos

- **Estado:** Aceptado
- **Fecha:** 2026-10-28 (implementado el 2026-11-17)
- **Autor:** Villagra, Santiago Agustín; Ayala, Franco; Sirizzotti, Martín Emiliano
- **Sprint:** 6

## Contexto

Según lo definido en el ADR-003, los terminales (tornos) de cada sede validan el QR sin conexión de los socios mediante criptografía asimétrica Ed25519 cuando se cae internet (`qr-offline.js`), sin consultar la base de datos central. 

Sin embargo, el módulo de acceso en el servidor (`acceso.service.js`) aplica dos reglas de negocio estrictas al registrar un paso: **RN-01** (un usuario no puede registrar un nuevo ingreso si ya tiene un registro abierto con `fechaEgreso: null` en la misma o en otra sede, devolviendo HTTP 409) y **RF-05** (el aforo actual de `registros_acceso` no puede superar `sede.aforoMaximo`). Para cumplir con RNF-01 sin perder trazabilidad, es necesario definir qué datos conserva localmente el terminal durante un corte, con qué frecuencia sincroniza y cómo se resuelven los conflictos al reconectar.

## Alternativas consideradas

| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| Replicación bidireccional de las tablas `usuarios`, `membresias` y `registros_acceso` en cada sede | El terminal tendría copias locales completas para validar estado de membresía y aforo en tiempo real. | Alto consumo de almacenamiento en el terminal, exposición de datos personales en las 25 sedes y conflictos complejos de escritura bidireccional. | Porque el payload del QR offline ya transporta `usuarioId`, `nombre`, `venceMembresia` y `exp` firmados por el servidor (`qr-offline.js`), haciendo innecesario replicar tablas maestras. |
| Sincronización manual al cierre de la jornada | Implementación simple sin procesos periódicos en segundo plano. | El cálculo de `GET /api/acceso/aforo/:sedeId` y `GET /api/acceso/presentes/:sedeId` queda desactualizado todo el día, bloqueando o falseando el control de capacidad. | Porque degrada la visibilidad operativa del aforo en tiempo real (RF-05) durante horas. |
| **Replicación mínima de clave pública + cola local de eventos (*append-only*) con sincronización periódica** | Almacenamiento mínimo en el terminal, sin colisiones de escritura sobre datos maestros y recuperación automática al restablecerse la red. | Durante el corte de red, el contador de aforo centralizado y la verificación multi-sede (RN-01) operan con retraso hasta que se vacía la cola. | **Elegida.** |

## Decisión

Se adoptó una arquitectura de **replicación mínima y cola local de eventos** en el terminal de sede con las siguientes reglas:

1. **Qué se replica localmente:**
   - **Clave pública Ed25519:** El terminal descarga y almacena en caché local únicamente la clave pública en formato PEM obtenida desde `GET /api/acceso/clave-publica`. No replica nóminas de socios ni credenciales.
   - **Cola local de ingresos (*append-only*):** Mientras no hay conexión con la API, cada QR sin conexión que el terminal valida con la clave pública se guarda en una cola local (`localStorage` del navegador de Recepción) con `{ id, token, sedeId, fechaIngreso }`. Se guarda el QR completo para que el servidor pueda volver a verificar la firma. También se guarda la lista de sedes, para poder usar la pantalla aunque se recargue sin conexión.
   - **Egresos:** sin conexión no se registran salidas (el terminal no tiene la lista de presentes); se registran al volver, desde «Adentro ahora», y RN-01 se concilia al sincronizar (punto 3).

2. **Frecuencia de sincronización:**
   - **Clave pública:** Se obtiene al iniciar el terminal y se refresca cada **24 horas** (en sintonía con `HORAS_DE_VALIDEZ = 24` configurado en `qr-offline.js`) o de inmediato si falla la verificación de firma por rotación de la semilla `QR_OFFLINE_SEMILLA`.
   - **Cola de ingresos pendientes:** Mientras hay conectividad, el ingreso con QR sin conexión se envía en el momento. Tras un corte, la pantalla reintenta vaciar la cola en lotes de hasta 200 ingresos cada **15 segundos** (el mismo ciclo que refresca el aforo), al detectar el evento `online` y con el botón «Sincronizar ahora». El servidor recibe la cola en `POST /api/v1/acceso/sincronizar`.

3. **Resolución de conflictos al reconectar:**
   - **El servidor no confía en el terminal:** vuelve a verificar la firma Ed25519 de cada QR con la hora del ingreso (no con la hora actual). Rechaza los QR alterados, los que ya estaban vencidos cuando la persona pasó, las fechas futuras o anteriores a la emisión del QR (con 5 minutos de tolerancia de reloj) y los usuarios inexistentes.
   - **Idempotencia ante reintentos de red:** El servidor deduplica por la terna `usuarioId`, `sedeId`, `fechaIngreso`, así no duplica filas en `registros_acceso` si se corta la respuesta HTTP durante el envío. Se eligió la terna en lugar de una columna `evento_id` para no cambiar el esquema de la base a días de la entrega.
   - **Conflicto de sesión abierta (RN-01):** Si al sincronizar un ingreso *offline* el servidor detecta que el usuario aún tenía un registro abierto (`fechaEgreso: null`) en otra sede o en la misma (por un egreso no registrado antes del corte), prevalece la realidad física ya ocurrida: el servidor cierra automáticamente el registro anterior a la hora del ingreso nuevo e inserta el nuevo `RegistroAcceso` con su `fechaIngreso` original. Si el registro abierto es *posterior* al ingreso sin conexión, este se guarda como histórico, cerrado a esa hora. En los dos casos la respuesta trae la observación y el servidor la deja en el log. Con conexión, la pantalla aplica RN-01 como con cualquier QR (no deja pasar a quien figura adentro de la sede).
   - **Superación de aforo máximo (RF-05):** Si los ingresos ocurridos sin conexión hacen que `actual > sede.aforoMaximo` al sincronizar, los registros históricos se aceptan igual para no perder trazabilidad; el servidor mantiene bloqueados nuevos ingresos *online* (HTTP 409) hasta que los egresos normalicen el cupo.
   - **Membresía suspendida durante el corte:** Si una membresía fue dada de baja en el servidor mientras el terminal estaba aislado pero el socio entró con un QR *offline* aún dentro de su ventana de 24 horas (`exp`), el ingreso queda registrado como histórico auditado y el servidor bloquea futuras renovaciones de QR (`403 Forbidden`).

El criterio determinante fue evitar la replicación pesada de tablas relacionales en las 25 sedes y garantizar una reconciliación determinista sin intervención manual.

## Consecuencias

- **Positivas:** El terminal no almacena bases de datos de socios; los movimientos ocurridos sin conexión no se pierden ni se duplican; las reglas RN-01 y RF-05 se reconcilian automáticamente sin bloquear a posteriori un paso físico ya efectuado.
- **Negativas:** Durante la caída de internet, el aforo consultado en `GET /api/acceso/aforo/:sedeId` refleja solo los registros previos al corte, pudiendo producirse un leve sobrepaso temporal de capacidad si la sede estaba al límite.
- **Deuda asumida:** (1) las observaciones de conflicto quedan en la respuesta y en el log, no en una columna de auditoría (`origen`, `observacion`) de `registros_acceso`; (2) sin conexión no se registran egresos; (3) la cola vive en el `localStorage` del navegador, que se pierde si alguien borra los datos del sitio; (4) la validación local necesita un navegador con Ed25519 en WebCrypto (Chrome/Edge 137, Firefox 129, Safari 17) y la página abierta desde `localhost` o `https`.

## Implementación

- Terminal: `Frontend/js/terminal-offline.js` (clave pública, validación local, cola, sincronización) y `Frontend/js/recepcion.js` (panel «Terminal»).
- Servidor: `sincronizarIngresos()` en `Backend/src/modules/acceso/acceso.service.js` y la ruta `POST /api/v1/acceso/sincronizar`.
- Pruebas: `Backend/test/unit/sincronizacion-terminal.test.js` (12 casos) y `Backend/test/integracion/qr.api.test.js`.
- Diagramas: `secuencia-acceso-offline` y `c4-3-acceso` (v1.1).

## Requisitos relacionados

RNF-01, RF-04, RF-05, RN-01