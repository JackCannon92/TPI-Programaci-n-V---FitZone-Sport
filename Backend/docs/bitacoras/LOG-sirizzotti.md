# Bitácora personal — Martín Emiliano Sirizzotti

**Rol:** Backend Developer / QA-DevOps · **Unidades a cargo:** III (Patrones de diseño) y V (Testing y CI/CD) · **Líder:** Sprint 1 (semanas 1 y 2), Sprint 4 (semanas 7 y 8) y Sprint 7 (semana 13)

Programación V · FCAD-UNER · Prof. Lic. Juan José Aguirre · Actualizada al 05/11/2026 (semana 10 de 13)

En esta bitácora cuento lo que hice en el TPI, las decisiones que tomé y, sobre todo, las complejidades con las que me encontré y cómo las resolví. Lo que decidimos entre los tres está en la bitácora del equipo (`docs/LOG.md`).

---

## Las complejidades más importantes

| # | Complejidad | Qué pasó | Cómo la resolví | Qué aprendí |
|---|---|---|---|---|
| 1 | **Los tests** | Los primeros 32 tests estaban hechos con el runner de Node y el plan pedía Jest; además había que probar la API sin depender de Supabase, y no sabía bien qué era un mock. | Pasé los tests a Jest, separé unitarios e integración, y usé dobles de prueba: repositorio en memoria, datos falsos compartidos y `jest.fn()`. Para montar las rutas en los tests tuve que sacar el manejador de errores de `app.js` a `core/errorHandler.js`. | Qué es un mock, un stub y un fake; y que un código bien inyectado (composition root) se prueba fácil. Hoy son 99 tests que corren en segundos. |
| 2 | Un test mostró un error que nadie había visto | El test de integración de membresías dejó a la vista que "no encontrado" responde 400 y no 404 (O-11). | Lo dejé fijado con un test de caracterización para corregirlo aparte, sin mezclarlo con el trabajo de tests. | Para qué sirve un test además de "dar verde": documenta cómo se comporta el sistema hoy. |
| 3 | Crear las tablas en Supabase | `sequelize.sync({ alter: true })` falló con los ENUM de Postgres ("default for column rol cannot be cast automatically to type enum_usuarios_rol"). | Dejé de crear las tablas desde Sequelize y usé el script SQL del equipo, que define esos campos como VARCHAR con CHECK. | Que el ORM cree el esquema es cómodo, pero con una base compartida es mejor un script versionado que todos corran igual. |
| 4 | Levantar el backend en mi compu | Primero `MODULE_NOT_FOUND` (faltaba `npm install`) y después "nodemon no se reconoce como comando". | Instalé las dependencias y agregué `nodemon` como dependencia de desarrollo; mientras tanto usé `npm start`. | Que copiar la carpeta de otro no alcanza: las dependencias se instalan en cada máquina. |
| 5 | La base de Supabase dejó de responder | El 28/10 el servidor no arrancaba: "tenant/user not found". La causa más probable: el plan gratis de Supabase pausa el proyecto si no se usa por una semana. | Revisé el proyecto en el panel de Supabase hasta que volvió a conectar. Como los tests no usan la base, pude seguir trabajando mientras tanto. | Depender de un servicio gratuito tiene sus riesgos; conviene que los tests no dependan de él. |
| 6 | Todos los errores salían como 400 | El 409 de "turno ya reservado" (RN-02) nunca llegaba al cliente. `AppError` guardaba `statusCode` y el manejador leía `status`. | Lo encontré probando la API y lo corregí en una línea (olor O-8). | Un error así no se ve leyendo el código: aparece cuando se prueba el camino completo. |
| 7 | Patrones sobre código que no tenía comportamiento | La consigna pedía tests de caracterización sobre el precio, pero el precio era un mock que siempre devolvía lo mismo. | Hice los tests de caracterización sobre Membresías, que sí tenía reglas (y una rareza, O-6), y para el precio primero implementé RF-11 y después le di la forma de Strategy. | A adaptar la consigna al código real y dejar escrito por qué. |
| 8 | La lista de espera no avisaba nunca | En una base creada por Sequelize las clases nunca se llenaban: el cupo lo descuenta un trigger que esa base no tenía. | Dejé el trigger en un script aparte (`docs/trigger-cupos-clases.sql`) y lo anoté como olor O-9. | Que una regla de negocio escondida en la base es fácil de perder. |
| 9 | **El front** | Al encarar las pantallas de la Unidad IV, el front tenía solo login, panel y listado de usuarios: faltaban las de reservas, clases y acceso, y conectarlas con la API real. | Las estoy armando sobre la base existente, con una capa de servicio (`js/api.js`) y piezas comunes (`js/ui.js`). | A organizar un front sin framework para no repetir código en cada pantalla. |
| 10 | Detalles del front contra la base real | El backend no tiene contraseñas; la base solo acepta canchas de fútbol y pádel; de noche no quedaban turnos para el día y la grilla aparecía vacía; el lector de QR por cámara necesita internet. | Sesión simulada en el navegador (documentada), alta de canchas solo con esos dos tipos, la grilla pasa sola al día siguiente si hoy no hay turnos, y en Recepción se puede pegar el código si no hay cámara. | Que probar con datos y horarios reales muestra cosas que en el papel no aparecen. |
| 11 | Entender qué era "CQRS" y qué era "QR" | Cuando la cátedra dijo "no usar CQRS" y "se pueden usar dos QR" pensé que eran lo mismo. | Lo consulté: CQRS es separar lecturas de escrituras; QR es el código. Saqué CQRS y sumé los QR (ADR-010). | A preguntar antes de suponer. |

---

## Uso de inteligencia artificial

Para resolver muchos de estos problemas usé IA. Con **Claude** generé y corregí código (los patrones, los tests, los QR y las pantallas del front), le pedí que me explicara conceptos (mock, CQRS, Swagger) y me ayudó a armar la documentación. Con **Gemini** revisamos el material de la Unidad I (ver la bitácora del equipo).

Mi forma de trabajar fue: decidir qué había que hacer, pedirlo, probarlo en mi compu (Swagger, `npm test` y la aplicación) y corregir cuando algo no andaba o no era lo que pedía la consigna. Todo lo que se entregó lo probé, y lo que no entendía lo pregunté hasta poder explicarlo.

---

## Registro por unidad

Formato: `[fecha] (commit) Qué hice · Decisión · Complejidad y cómo la resolví`

> **Sobre los commits.** Los commits de septiembre (`edafca8`, `262497e`, `2160fb6`) están en el repositorio que usamos al principio. En este repositorio el código se subió de una sola vez el 15/10 (`ef6fd8a`), así que el trabajo de octubre no tiene commits propios. Desde el 05/11 subo cada cambio en un commit separado por tema y lo cito acá.

### Unidades I y II — apoyo
- **[27/08 – 09/09]** Fui líder del Sprint 1 (semanas 1 y 2).
- **[10/09]** (commits `edafca8`, `262497e`, `2160fb6`) Conexión a Supabase como opción por defecto (`DATABASE_URL` con SSL), comando `db:check` para probar la conexión y modo local con SQLite para trabajar sin Supabase. · **Complejidad:** `db:check` daba error aunque la conexión anduviera, porque fallaba al leer información extra → separé lo crítico (la conexión) de lo opcional.
- **[16/09]** Guía para el check-in del Sprint 2 (lo presentó Franco como líder). · **Decisión:** mostrar solo lo que corresponde a esas semanas según el plan.

### Unidad III — Patrones de diseño
- **[01/10]** Revisé el backend que armó Franco y creé las tablas en Supabase con el script SQL. · **Complejidad 1:** el modelo de `usuarios` usa borrado lógico y el script no tenía la columna `deleted_at` → la agregué. · **Complejidad 2:** el error de los ENUM con `sync({ alter: true })` (ver tabla, n.º 3).
- **[02/10]** Levanté el backend en local y probé los endpoints con Swagger. · **Complejidad:** `nodemon` no estaba en el `package.json` (ver tabla, n.º 4).
- **[13/10]** Relevé los olores del código existente: 14 olores con archivo, línea, evidencia y decisión (bitácora del equipo, Anexo B).
- **[13/10]** **Strategy (RF-11):** las tres reglas de precio (base, −15 % socio, +20 % de 19 a 21 hs) y un `Tarifador` que las aplica en orden. · **Decisión:** Strategy y no Decorator: cada regla se prueba sola y se agrega a una lista sin anidar objetos. · **Complejidad:** no había un `if/else` que refactorizar, el precio era un mock (ver tabla, n.º 7).
- **[13/10]** **Repository** para Reserva de cancha y Membresía, con un adaptador para Sequelize y otro en memoria. El adaptador traduce el error de RN-02 a `TurnoYaReservadoError` (409). · **Decisión:** el plan lo ponía en Pagos; lo moví a Reserva y Membresía porque ahí están las reglas, y en Pagos sería un "repositorio vacío".
- **[13/10]** **Observer (RF-08):** al cancelar una reserva de clase se publica `CupoLiberado` y un oyente avisa al primero de la lista de espera. · **Decisión:** usar el `EventEmitter` de Node con aislamiento de fallas. · **Complejidad:** el trigger de cupos (ver tabla, n.º 8).
- **[13/10]** Arreglo de `AppError` (ver tabla, n.º 6).
- **[13/10]** CQRS nivel 2 para el tablero del gerente. · Se quitó el 28/10 por indicación de la cátedra.
- **[15/10]** ADR de patrones y bitácora. Los patrones se aplicaron en la semana 7, dentro de la ventana que fija la cátedra para el laboratorio de la Unidad III (semanas 6 y 7).
- **[28/10]** Ajustes por las indicaciones de la cátedra: saqué CQRS y separé el ADR de patrones en uno por patrón (ADR-007 Strategy, ADR-008 Repository, ADR-009 Observer).

### Unidad IV — apoyo
- **[02/10]** Pantallas base conectadas al backend real: login por DNI, registro, panel con membresía y aforo, y listado de usuarios. · **Complejidad:** el backend no maneja contraseñas → sesión simulada en el navegador, documentada en el código.
- **[28/10]** **En curso:** pantallas de las semanas 7 y 8 del plan. Avance: reservar cancha (grilla de turnos, precio con su detalle, pago y QR), clases (reserva, lista de espera y QR de asistencia), mis reservas, mi acceso (QR que se renueva cada minuto y QR sin conexión), recepción (lee los QR con la cámara) y gestión. · **Decisión:** JavaScript sin framework, multipágina, con capa de servicio en `js/api.js`. · **Complejidad:** ver tabla, n.º 9 y 10.

### Unidad V — Testing y CI/CD
- **[28/10]** **Semana 9, tests unitarios con Jest:** pasé los 32 tests de la Unidad III a Jest y sumé casos (validación del `Tarifador`, bordes del horario pico con `test.each`). Los dobles de prueba quedaron en `test/dobles/fitzone.js`. · **Complejidad:** ver tabla, n.º 1.
- **[28/10]** **Semana 9, tests de integración con Supertest:** la API por HTTP de punta a punta, con el repositorio en memoria en lugar de Supabase. · **Decisión:** saqué el manejador de errores de `app.js` a `core/errorHandler.js` para usarlo igual en la API y en los tests. · **Complejidad:** el 400 en vez de 404 (ver tabla, n.º 2).
- **[28/10]** Tests de los códigos QR: 36 unitarios y 9 de integración. → En total **99 tests** (72 unitarios y 27 de integración).
- [ ] **Semana 10:** pipeline CI/CD con GitHub Actions, Dockerfile y docker-compose.

### Códigos QR (indicación de la cátedra del 27/10) → ADR-010
- **[28/10]** Cuatro QR además del del socio: reserva de cancha (para que entre el cliente externo), acceso sin conexión (el molinete valida sin internet, firma Ed25519), asistencia a clase (estado `ASISTIO`) y verificación del comprobante PDF. · **Decisión:** clave pública para el QR sin conexión, porque con HMAC el molinete necesitaría el secreto. · **Complejidad:** al probar contra una base real aparecieron tres errores: el comprobante decía "Cliente: undefined" (O-12), el detalle del precio salía "undefined: $NaN" (un error que había quedado de la Unidad III) y el historial de pagos fallaba por el nombre de una columna (O-15). Los corregí los tres.

### Repositorio
- **[05/11]** Ordené el repositorio de GitHub: agregué `.gitignore` (para que nunca se suba el `.env` con la contraseña de la base), borré archivos que sobraban (olores O-4 y O-13) y subí el trabajo de octubre en commits separados por tema. · **Complejidad:** el código se había subido de una sola vez desde la web de GitHub, sin historial → aprendí a usar GitHub Desktop y a separar los cambios en commits.

### Cierre
- [ ] Pendiente (semanas 12 y 13).
