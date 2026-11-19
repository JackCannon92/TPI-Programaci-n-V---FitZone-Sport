# Bitácora — Sirizzotti, Martín Emiliano — Rol P2 y P4

**Rol:** P2 · Backend Developer y P4 · QA / DevOps · **Unidades a cargo:** III (Patrones de diseño) y V (Testing y CI/CD) · **Usuario de Git:** JackCannon92 · **Líder de check-in:** 03/09 y 29/10 (la rotación quedó corrida un turno desde el sprint 2; ver `docs/planificacion/03-cronograma.md`)

Programación V · FCAD-UNER · Prof. Lic. Juan José Aguirre · Actualizada al 18/11/2026

**Sobre los commits.** En septiembre trabajé en otro repositorio (`edafca8`, `262497e`, `2160fb6`). En este, el código se subió de una sola vez el 15/10 (`ef6fd8a`), así que el trabajo de septiembre y octubre está dentro de ese commit. Desde el 05/11 cada cambio tiene su commit propio, y lo cito en la entrada que corresponde.

**Sobre las horas.** Hasta el 05/11 no anoté las horas de cada sesión, así que esas entradas dicen *s/r* (sin registro). Del 05 al 17/11 estimo unas 22 horas en total. Es una de las lecciones del análisis de desvíos (`docs/planificacion/08-analisis-de-desvios.md`).

---

## Las complejidades más importantes

| # | Complejidad | Qué pasó | Cómo la resolví | Qué aprendí |
|---|---|---|---|---|
| 1 | **Los tests** | Los primeros 32 tests estaban hechos con el runner de Node y el plan pedía Jest; además había que probar la API sin depender de Supabase, y no sabía bien qué era un mock. | Pasé los tests a Jest, separé unitarios e integración, y usé dobles de prueba: repositorio en memoria, datos falsos compartidos y `jest.fn()`. Para montar las rutas en los tests tuve que sacar el manejador de errores de `app.js` a `core/errorHandler.js`. | Qué es un mock, un stub y un fake; y que un código bien inyectado (composition root) se prueba fácil. |
| 2 | Un test mostró un error que nadie había visto | El test de integración de membresías dejó a la vista que "no encontrado" responde 400 y no 404 (O-11). | Lo dejé fijado con un test de caracterización para corregirlo aparte, sin mezclarlo con el trabajo de tests. | Para qué sirve un test además de "dar verde": documenta cómo se comporta el sistema hoy. |
| 3 | Crear las tablas en Supabase | `sequelize.sync({ alter: true })` falló con los ENUM de Postgres. | Dejé de crear las tablas desde Sequelize y usé el script SQL del equipo, que define esos campos como VARCHAR con CHECK. | Con una base compartida es mejor un script versionado que todos corran igual. |
| 4 | Levantar el backend en mi compu | Primero `MODULE_NOT_FOUND` (faltaba `npm install`) y después "nodemon no se reconoce como comando". | Instalé las dependencias y agregué `nodemon` como dependencia de desarrollo. | Que copiar la carpeta de otro no alcanza: las dependencias se instalan en cada máquina. |
| 5 | La base de Supabase dejó de responder | El 28/10 el servidor no arrancaba: "tenant/user not found". Lo más probable: el plan gratis pausa el proyecto si no se usa. | Lo reactivé desde el panel. Como los tests no usan la base, pude seguir trabajando. | Conviene que los tests no dependan de un servicio externo. |
| 6 | Todos los errores salían como 400 | El 409 de "turno ya reservado" (RN-02) nunca llegaba al cliente: `AppError` guardaba `statusCode` y el manejador leía `status`. | Lo encontré probando la API y lo corregí en una línea (olor O-8). | Un error así aparece cuando se prueba el camino completo, no leyendo el código. |
| 7 | Patrones sobre código sin comportamiento | La consigna pedía tests de caracterización sobre el precio, pero el precio era un mock. | Los hice sobre Membresías, que sí tenía reglas (y una rareza, O-6); para el precio primero implementé RF-11 y después le di la forma de Strategy. | A adaptar la consigna al código real y dejar escrito por qué. |
| 8 | La lista de espera no avisaba nunca | En una base creada por Sequelize las clases nunca se llenaban: el cupo lo descuenta un trigger que esa base no tenía. | Dejé el trigger en un script aparte (`docs/entregables/trigger-cupos-clases.sql`) y lo anoté como olor O-9. | Que una regla de negocio escondida en la base es fácil de perder. |
| 9 | **El front** | Las pantallas de la Unidad IV se atrasaron: el front tenía solo login, panel y usuarios. | Las armé sobre la base existente, con una capa de servicio y piezas comunes. | A organizar un front sin framework para no repetir código. |
| 10 | Detalles del front contra la base real | El backend no tiene contraseñas; la base solo acepta fútbol y pádel; de noche la grilla del día quedaba vacía; el lector por cámara necesita internet. | Sesión simulada (documentada), alta de canchas con esos dos tipos, la grilla pasa al día siguiente, y en Recepción se puede pegar el código. | Que probar con datos y horarios reales muestra cosas que en el papel no aparecen. |
| 11 | Entender "CQRS" y "QR" | Cuando la cátedra dijo "no usar CQRS" y "se pueden usar dos QR" pensé que eran lo mismo. | Lo consulté: CQRS es separar lecturas de escrituras; QR es el código. Saqué CQRS y sumé los QR (ADR-016). | A preguntar antes de suponer. |

## Uso de inteligencia artificial

Usé IA para resolver muchos de estos problemas. Con **Claude** generé y corregí código (patrones, tests, códigos QR, pantallas, sincronización sin conexión), le pedí que me explicara conceptos (mock, CQRS, Swagger, WebCrypto) y me ayudó con la documentación. Con **Gemini** revisamos el material de la Unidad I. Mi forma de trabajar fue decidir qué había que hacer, pedirlo, probarlo (Swagger, `npm test` y la aplicación) y corregir cuando algo no andaba o no era lo que pedía la consigna.

---

## Sprint 1 — Unidad I — Semana del 2026-08-27

### 2026-09-03 · s/r

**Actividad**
Fui líder del check-in del sprint 1, con el primer plan de tareas del equipo.

**Decisión**
—

**Problema o bloqueo**
El plan se tuvo que corregir dos veces: por la fecha real de inicio (27/08) y para comprimirlo de 16 a 13 semanas sin perder horas.

**Commits**
Sin commits: fue el check-in.

---

## Sprint 2 — Unidad II — Semana del 2026-09-10

### 2026-09-10 · s/r

**Actividad**
Conexión a Supabase como opción por defecto (`DATABASE_URL` con SSL), comando `db:check` para probar la conexión y modo local con SQLite para trabajar sin Supabase.

**Decisión**
Supabase por defecto y SQLite como modo local, para poder trabajar sin Supabase.

**Problema o bloqueo**
`db:check` daba error aunque la conexión anduviera, porque fallaba al leer información extra del servidor. Separé lo crítico (la conexión) de lo opcional.

**Commits**
`ef6fd8a` subida del 15/10 que lo contiene · en el repositorio anterior: `edafca8`, `262497e`, `2160fb6`

### 2026-09-16 · s/r

**Actividad**
Preparé la guía para el check-in del sprint 2, que le tocaba presentar a Franco.

**Decisión**
Mostrar solo lo que correspondía a esas semanas según el plan.

**Problema o bloqueo**
Franco no pudo asistir el 17/09 y la semana siguiente fue de mesa de exámenes: el check-in pasó al 01/10 y la rotación quedó corrida un turno.

**Commits**
Sin commits: fue preparación del check-in.

---

## Sprint 3 — Unidades II, III y IV — Semana del 2026-09-24

### 2026-10-01 · s/r

**Actividad**
Revisé el backend que armó Franco y creé las tablas en Supabase con el script SQL.

**Decisión**
Crear el esquema con el script del equipo y no con `sequelize.sync` (complejidad 3).

**Problema o bloqueo**
El modelo de `usuarios` usa borrado lógico y el script no tenía `deleted_at`: la agregué. Después, el error de los ENUM con `sync({ alter: true })`.

**Commits**
`ef6fd8a` subida del 15/10 que lo contiene

### 2026-10-02 · s/r

**Actividad**
Levanté el backend en local, probé los endpoints de Acceso y Canchas por Swagger y armé las pantallas base del frontend conectadas al backend real: login por DNI, registro, panel con membresía y aforo, y listado de usuarios.

**Decisión**
El backend no maneja contraseñas, así que la sesión se simula en el navegador, documentada en el código.

**Problema o bloqueo**
`nodemon` no estaba en el `package.json` (complejidad 4).

**Commits**
`ef6fd8a` subida del 15/10 que lo contiene

---

## Sprint 4 — Unidad III — Semana del 2026-10-08

### 2026-10-12 · s/r

**Actividad**
Por Discord le fui pasando a Santi las pantallas de reservas en las que estaba trabajando, y él las revisó y corrigió contra lo que teníamos que entregar.

**Decisión**
—

**Problema o bloqueo**
—

**Commits**
`ef6fd8a` subida del 15/10 que contiene esas pantallas

### 2026-10-13 · s/r

**Actividad**
Relevé 14 olores del código con archivo, línea, evidencia y decisión. Apliqué los tres patrones: **Strategy** para el precio de canchas (RF-11: base, −15 % socio, +20 % de 19 a 21 hs, con un `Tarifador` que aplica las reglas en orden); **Repository** para reservas de cancha y membresías, con un adaptador para Sequelize y otro en memoria; **Observer** para la lista de espera (RF-08), con el evento `CupoLiberado`. Corregí `AppError` (O-8) y armé un tablero CQRS para el gerente.

**Decisión**
Strategy y no Decorator: cada regla se prueba sola y se suma a una lista sin anidar objetos (ADR-013). Repository en reservas y membresías y no en Pagos, como decía el plan, porque ahí están las reglas (ADR-014). Observer con el `EventEmitter` de Node y aislamiento de fallas (ADR-015).

**Problema o bloqueo**
No había un `if/else` que refactorizar: el precio era un mock (complejidad 7). El trigger de cupos no existía en una base creada por Sequelize (complejidad 8). Todos los errores salían como 400 (complejidad 6).

**Commits**
`ef6fd8a` subida del 15/10 que lo contiene

### 2026-10-15 · s/r

**Actividad**
Escribí el ADR de patrones y mi bitácora, y subí todo el código al repositorio nuevo.

**Decisión**
—

**Problema o bloqueo**
Lo subí desde la web de GitHub en un solo commit, así que el historial de septiembre y octubre quedó en el repositorio anterior.

**Commits**
`ef6fd8a` Add files via upload

---

## Sprint 5 — Unidades III, IV y V — Semana del 2026-10-22

### 2026-10-27 · s/r

**Actividad**
Segunda revisión de las pantallas con Santi por Discord, antes de terminarlas: yo se las pasaba y él las corregía contra lo que había que entregar.

**Decisión**
—

**Problema o bloqueo**
—

**Commits**
`e8b8d74` pantallas (subidas el 05/11)

### 2026-10-28 · s/r

**Actividad**
Ajustes por las indicaciones de la cátedra del 27/10: saqué CQRS, separé el ADR de patrones en uno por patrón y agregué cuatro códigos QR (reserva de cancha, acceso sin conexión con Ed25519, asistencia a clase y verificación del comprobante). Pasé los tests a Jest, sumé tests de integración con Supertest y tests de los QR: 99 en total. Terminé las pantallas de reservas, clases, mis reservas, mi acceso, recepción y gestión.

**Decisión**
Clave pública para el QR sin conexión, porque con HMAC el molinete necesitaría el secreto (ADR-016). Sacar el manejador de errores de `app.js` para usarlo igual en la API y en los tests.

**Problema o bloqueo**
Supabase dejó de responder (complejidad 5). Al probar contra la base real aparecieron tres errores: "Cliente: undefined" en el comprobante (O-12), "undefined: $NaN" en el detalle del precio y una columna mal nombrada en el historial de pagos (O-15). Los corregí los tres.

**Commits**
Subidos el 05/11 (ver la entrada siguiente): `d6170be`, `21e1539`, `b7a6848`, `674c08f`, `e8b8d74`

### 2026-10-29 · s/r

**Actividad**
Fui líder del check-in del sprint 5.

**Decisión**
—

**Problema o bloqueo**
Docker y el pipeline, que eran de esas semanas, quedaron sin hacer por las tareas agregadas el 27/10.

**Commits**
Sin commits: fue el check-in.

---

## Sprint 6 — Integración y documentación — Semana del 2026-11-05

### 2026-11-05 · s/r

**Actividad**
Ordené el repositorio: `.gitignore` para que nunca se suba el `.env`, borré archivos que sobraban (O-4 y O-13) y subí el trabajo de octubre en commits separados por tema.

**Decisión**
Un commit por tema, para que el historial se pueda leer y cruzar con las bitácoras.

**Problema o bloqueo**
No sabía usar Git más allá de la web de GitHub: aprendí a usar GitHub Desktop y a separar cambios en commits.

**Commits**
`3e12d52` gitignore y limpieza · `d6170be` sin CQRS · `21e1539` un ADR por patrón · `b7a6848` códigos QR · `674c08f` tests con Jest y Supertest · `e8b8d74` pantallas · `e846505` README y bitácoras

### 2026-11-07 · s/r

**Actividad**
Con los lineamientos nuevos del 06/11 (10 ADR obligatorios), reescribí ADR-008 (estrategia de pruebas) con la plantilla del Anexo B, y después ADR-005, ADR-009 y los de patrones y QR renumerados.

**Decisión**
Respetar la numeración que pide la cátedra (ADR-001 a ADR-010) y mover los de patrones a ADR-013 a ADR-016.

**Problema o bloqueo**
Al renumerar quedaron ADR duplicados en el repositorio, y uno se pisó con otro al subirlo (el de Repository quedó como ADR-014). Borré los duplicados el 16/11.

**Commits**
`ae1bfd2` ADR-008 · `86faafc` ADR nuevos y actualización · `fc21ae9` borrar los duplicados

### 2026-11-16 · s/r

**Actividad**
Docker (imagen de la API), `docker-compose` con base, API y web, y el pipeline de GitHub Actions en tres etapas. Corregí lo que apareció al levantar todo junto: la API pasó a `/api/v1`, se agregó el rol de administrador de sede y la base local sin SSL.

**Decisión**
Que el entorno de pruebas se levante con un solo comando, con una base PostgreSQL propia en lugar de Supabase (ADR-009).

**Problema o bloqueo**
La conexión exigía SSL siempre, y la base de Docker no lo tiene: agregué `DB_SSL=false`. El rol ADMIN_SEDE no existía en el modelo y el seed lo usaba.

**Commits**
`5ff08ac6` API en /api/v1, rol y base sin SSL · `63892b2` Docker, compose y pipeline · `0b7e59b` README

### 2026-11-17 · s/r

**Actividad**
Diagramas C4 de componentes, clases, secuencias y pipeline; corrección de nombres de ADR y del lugar de la bitácora de Franco; manual de instalación. Implementé ADR-007: Recepción valida el QR sin conexión en el navegador (WebCrypto Ed25519) y anota los ingresos en una cola local; al volver la conexión los manda a `POST /api/v1/acceso/sincronizar`. Quedan 113 tests.

**Decisión**
Deduplicar por persona + sede + hora en lugar de agregar una columna `evento_id`, para no cambiar el esquema de Supabase a días de la entrega. El servidor vuelve a verificar cada firma con la hora del ingreso: no confía en el terminal.

**Problema o bloqueo**
Que la pantalla siga andando si se recarga sin servidor (también hubo que guardar las sedes) y que el ingreso quede con la hora en que la persona pasó, no con la hora en que se sincroniza.

**Commits**
`303d221` nombres de ADR · `c96f322` diagramas · `bd16e21` manual y README · `9b14f0b` sincronización en el servidor · `69c1292` Recepción sin conexión · `3941987` documentación de ADR-007

### 2026-11-18 · s/r

**Actividad**
Reorganicé el repositorio según el punto 4 de los lineamientos (`backend/`, `frontend/src/portal` y `admin`, `docs/` en la raíz). Agregué la prueba de concurrencia de RN-02 contra PostgreSQL real y la evidencia de los cuatro RNF en `docs/rnf/`. Subí la planificación revisada con el equipo.

**Decisión**
Probar RN-02 contra la base real en una prueba aparte, sin cambiar la decisión de ADR-008 (ADR-017).

**Problema o bloqueo**
La mudanza cambiaba casi todos los archivos de lugar: la armé de una sola vez, con todas las rutas de `require`, Docker, pipeline y documentación, y recorrí las pantallas con los seis usuarios de prueba antes de subirla. Comprobé que la prueba de concurrencia falla si se borra el índice único.

**Commits**
`6cc09e1` reorganización · `c8c161e` concurrencia y RNF · `95728c4` planificación

---

## Sprint 7 — Cierre — Semana del 2026-11-19

*Pendiente: entrega del 19/11.*

## Sprint 8 — Defensa — Semana del 2026-11-23

*Pendiente: defensa del 23 al 29/11.*
