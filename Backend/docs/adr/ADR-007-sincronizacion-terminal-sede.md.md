# ADR-007 — Sincronización del terminal de sede: replicación local, frecuencia y resolución de conflictos

- **Estado:** Aceptado
- **Fecha:** 2026-10-28
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
   - **Cola local de movimientos (*append-only*):** Mientras no hay conexión con la API, cada validación exitosa de `validarQrOffline` o lectura de egreso se persiste en una cola local del terminal con `{ eventoId, usuarioId, sedeId, tipoMovimiento, timestampLocal }`.

2. **Frecuencia de sincronización:**
   - **Clave pública:** Se obtiene al iniciar el terminal y se refresca cada **24 horas** (en sintonía con `HORAS_DE_VALIDEZ = 24` configurado en `qr-offline.js`) o de inmediato si falla la verificación de firma por rotación de la semilla `QR_OFFLINE_SEMILLA`.
   - **Cola de accesos pendientes:** Mientras hay conectividad, el terminal envía los registros en tiempo real (`POST /api/acceso/ingreso` y `POST /api/acceso/egreso`). Tras un corte, un proceso en segundo plano reintenta vaciar la cola en lotes cada **30 segundos** y dispara un envío inmediato al detectar el evento de reconexión de red (`online`).

3. **Resolución de conflictos al reconectar:**
   - **Idempotencia ante reintentos de red:** El servidor central deduplica los eventos recibidos mediante su `eventoId` (o la terna `usuarioId`, `sedeId`, `timestampLocal`), evitando duplicar filas en `registros_acceso` si se corta la respuesta HTTP durante el envío.
   - **Conflicto de sesión abierta (RN-01):** Si al sincronizar un ingreso *offline* el servidor detecta que el usuario aún tenía un registro abierto (`fechaEgreso: null`) en otra sede o en la misma (por un egreso no registrado antes del corte), prevalece la realidad física ya ocurrida: el servidor cierra automáticamente el registro anterior marcando una observación de auditoría e inserta el nuevo `RegistroAcceso` respetando el `timestampLocal` original.
   - **Superación de aforo máximo (RF-05):** Si los ingresos ocurridos sin conexión hacen que `actual > sede.aforoMaximo` al sincronizar, los registros históricos se aceptan igual para no perder trazabilidad; el servidor mantiene bloqueados nuevos ingresos *online* (HTTP 409) hasta que los egresos normalicen el cupo.
   - **Membresía suspendida durante el corte:** Si una membresía fue dada de baja en el servidor mientras el terminal estaba aislado pero el socio entró con un QR *offline* aún dentro de su ventana de 24 horas (`exp`), el ingreso queda registrado como histórico auditado y el servidor bloquea futuras renovaciones de QR (`403 Forbidden`).

El criterio determinante fue evitar la replicación pesada de tablas relacionales en las 25 sedes y garantizar una reconciliación determinista sin intervención manual.

## Consecuencias

- **Positivas:** El terminal no almacena bases de datos de socios; los movimientos ocurridos sin conexión no se pierden ni se duplican; las reglas RN-01 y RF-05 se reconcilian automáticamente sin bloquear a posteriori un paso físico ya efectuado.
- **Negativas:** Durante la caída de internet, el aforo consultado en `GET /api/acceso/aforo/:sedeId` refleja solo los registros previos al corte, pudiendo producirse un leve sobrepaso temporal de capacidad si la sede estaba al límite.
- **Deuda asumida:** En el código actual (`acceso.routes.js` y `registro-acceso.model.js`) ya está implementada la emisión/validación Ed25519 sin base de datos (`qr-offline.js`), pero falta desarrollar: (1) el *worker* de cola persistente en el cliente del torno y (2) el *endpoint* `POST /api/acceso/sincronizar` con columnas de trazabilidad (`evento_id`, `origen: 'ONLINE' | 'OFFLINE'`) en `registros_acceso` para aceptar marcas de tiempo históricas en lugar de `DataTypes.NOW`.

## Requisitos relacionados

RNF-01, RF-04, RF-05, RN-01