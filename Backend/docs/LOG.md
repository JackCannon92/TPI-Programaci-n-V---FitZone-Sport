# Bitácora del equipo — FitZone Sports (LOG.md)

**Programación V** · Licenciatura en Sistemas · FCAD-UNER · Prof. Lic. Juan José Aguirre

Cada integrante documenta por unidad sus actividades, decisiones y problemas encontrados, vinculando el registro a los commits del repositorio (ver consigna, Cierre Integrador).

Formato de cada entrada: `[fecha] (commit) Qué se hizo · Decisión tomada · Problema encontrado y cómo se resolvió`

**Estado al 15/10/2026:** semana 8 de 13. Unidades I, II y III cerradas; Unidad IV en curso.

| Integrante | Rol | Unidades a cargo |
|---|---|---|
| Franco Ayala | Arquitecto / Backend Lead | I y II |
| Martín Emiliano Sirizzotti | Backend Developer / QA-DevOps | III y V |
| Santiago Agustín Villagra | Frontend Developer | IV |

### Liderazgo rotativo (cada 2 semanas)

| Sprint | Semanas | Fechas | Líder |
|---|---|---|---|
| 1 | 1 y 2 | 27/08 – 09/09 | Martín Emiliano Sirizzotti |
| 2 | 3 y 4 | 10/09 – 23/09 | Franco Ayala |
| 3 | 5 y 6 | 24/09 – 07/10 | Santiago Agustín Villagra |
| 4 | 7 y 8 | 08/10 – 21/10 | Martín Emiliano Sirizzotti |
| 5 | 9 y 10 | 22/10 – 04/11 | Franco Ayala |
| 6 | 11 y 12 | 05/11 – 18/11 | Santiago Agustín Villagra |
| 7 | 13 | 19/11 – 25/11 | Martín Emiliano Sirizzotti |

---

## Decisiones del equipo (trabajo conjunto)

- **[27/08]** Debate arquitectónico de la semana 1, entre los tres. · **Decisión:** monolito modular sobre Node.js + Express, con un módulo por dominio (usuarios, membresías, acceso, clases, canchas, pagos). Se descartan los microservicios: evitar la sobreventa de canchas (RN-02) exigiría transacciones distribuidas, y un equipo de 3 no tiene la escala operativa que piden. → ADR-003 y ADR-001. · **Problema:** la cátedra sugiere un equipo de 4 roles y somos 3 → se fusionan los roles, pero cada unidad mantiene un responsable claro.
- **[29/08]** · **Decisión:** se descartan TypeScript, NestJS y React; backend y frontend en JavaScript vanilla. La curva de aprendizaje de esas herramientas se comía el tiempo que la materia pide dedicar a arquitectura, patrones y persistencia. → ADR-001 (revisado).
- **[29/08]** La cátedra indica que la Unidad VI (ecosistema móvil) no es obligatoria. · **Decisión:** se elimina la app móvil y todos los roles usan una única Aplicación Web; el QR del socio (RF-04) es una página pensada para verse en el celular. Las semanas de la Unidad VI pasan a ser de refuerzo. → ADR-006. En la misma fecha se elige Supabase (plan gratuito) como hosting de PostgreSQL. → ADR-004.
- **[29/08 – 16/09]** Revisión externa del material de la Unidad I con otra IA (Gemini). · **Decisión:** cada observación se verificó contra los archivos antes de aplicarla. Se aplicaron las válidas (consistencia de nombres, secciones faltantes en los ADR, pruebas de humo vía Swagger) y se descartaron dos (un error de tipeo que no existía, y pasar a ES Modules, que contradecía el código en CommonJS).
- **[03/09]** Plan de tareas del TI: 13 semanas (27/08 al Demo Day del 20/11), 76 horas prácticas, liderazgo rotativo cada dos semanas y tareas semanales repartidas entre los tres. · **Problema:** el plan se corrigió dos veces, una por la fecha real de inicio y otra para comprimirlo de 16 a 13 semanas sin perder horas. Ahora se sigue en una planilla con el estado de cada tarea.

---

## Franco Ayala — Arquitecto / Backend Lead

### Unidad I — Arquitectura
- **[27/08 – 29/08]** Modelado C4: nivel 1 (Contexto, con los 4 actores y los sistemas externos) y nivel 2 (Contenedores: Aplicación Web, Backend API y PostgreSQL en Supabase). · **Decisión:** un solo contenedor web para todos los roles, con vistas según el rol. · Entregable: `docs/TP_FitZone_Unidad_I_ADR.pdf`.
- **[27/08 – 29/08]** Documento de ADR de la Unidad I, con cuatro decisiones: monolito modular, persistencia, patrones GoF y sin app móvil. · **Problema:** los ADR estaban solo dentro del PDF → se pasaron a archivos individuales en `docs/adr/`, con índice y plantilla (commit `740fea1`, 07/09). Se renumeraron como ADR-003 a ADR-006 porque la cátedra fija ADR-001 y ADR-002 para los laboratorios.

### Unidad II — Frameworks
- **[07/09]** (commit `55ea8de`) Scaffolding del monolito modular en Express: cada módulo con sus rutas, controladores y servicios, todo armado desde un composition root (inyección de dependencias manual, sin contenedor).
- **[07/09]** (commit `a7e6b2b`, rama `refactor-di`) **Laboratorio 1.** `UsuariosService` pasa a ser una factory que recibe su repositorio; el composition root le inyecta el real y los tests uno en memoria (7 tests unitarios que no necesitan base). · Entregable: `ADR-001-seleccion-framework.md`.
- **[07/09]** (commit `f50f89d`, rama `contrato-api`) **Laboratorio 2.** Contrato `openapi.yaml` como fuente de verdad, versionado por URL `/api/v1` (ADR-002), cliente tipado con JSDoc (44 métodos, 45 tipos) y un test de 50 casos que verifica que Express cumple el contrato. · **Problema:** dos endpoints tenían consultas N+1 → se midieron con un contador de consultas y se corrigieron: `presentes` pasó de 501 a 2 consultas (con 500 personas) y `reportes/resumen` de 303 a 8 (con 50 sedes). Entregable: `docs/informe-medicion-n+1.md`.
- **[09/09]** Estructura de carpetas del backend en `src/modules/`, con los lugares reservados para los patrones de la Unidad III (`canchas/strategies/` y `clases/observer/`).
- **[26/09 – 01/10]** Módulos de Usuarios y Membresías, Sedes, Acceso (QR dinámico firmado con HMAC y control de aforo), Canchas (índice único parcial para RN-02), Clases (reservas y lista de espera) y Pagos (pasarela simulada y comprobante PDF), cableados en el composition root. · **Nota:** el precio de las canchas quedó simulado y los archivos de patrones vacíos; se completaron en la Unidad III.

### Cierre
- [ ] Pendiente (semanas 12 y 13).

---

## Martín Emiliano Sirizzotti — Backend Developer / QA-DevOps

### Unidades I y II — apoyo
- **[27/08 – 09/09]** Líder del Sprint 1 (semanas 1 y 2).
- **[10/09]** (commits `edafca8`, `262497e`, `2160fb6`) Conexión a Supabase como opción por defecto (`DATABASE_URL` con SSL), comando `db:check` para probar la conexión y modo local con SQLite para trabajar sin Supabase. · **Problema:** `db:check` daba error aunque la conexión anduviera, porque fallaba al leer información extra → se separó lo crítico (la conexión) de lo opcional.
- **[16/09]** Guía para el check-in del Sprint 2 (lo presenta Franco como líder). · **Decisión:** mostrar solo lo que corresponde a esas semanas según el plan, no adelantar trabajo de semanas posteriores.

### Unidad III — Patrones de diseño
- **[01/10]** Revisión del backend que armó Franco y creación de las tablas en Supabase con el script SQL del equipo. · **Problema 1:** el modelo de `usuarios` usa borrado lógico (`paranoid: true`) y el script no tenía la columna `deleted_at` → se agregó. · **Problema 2:** crear las tablas con `sequelize.sync({ alter: true })` falló con los ENUM de Postgres ("default for column rol cannot be cast") → se usa solo el script SQL, que define esos campos como VARCHAR con CHECK.
- **[02/10]** Backend levantado en local y prueba de humo de los endpoints vía Swagger. · **Problema:** el script `npm run dev` usa `nodemon`, que no estaba en las dependencias del `package.json` → se agregó como dependencia de desarrollo.
- **[13/10]** Relevamiento de olores sobre el código existente: 14 olores, con archivo, línea, evidencia y decisión (Anexo B).
- **[13/10]** **Strategy (RF-11).** Las tres reglas de precio (base, −15 % socio, +20 % de 19 a 21 hs) en los archivos reservados, más un `Tarifador` que las aplica en orden. · **Decisión:** Strategy y no Decorator. Las reglas se acumulan, pero así cada una se prueba sola y se agrega a una lista sin anidar objetos.
- **[13/10]** **Repository** para Reserva de cancha y Membresía: puerto con dos adaptadores (Sequelize y memoria). El adaptador traduce el error de la base de RN-02 a `TurnoYaReservadoError` (409). · **Decisión:** el plan lo ubicaba en Pagos; se movió a Reserva y Membresía porque la Clase 2 lo reserva para los agregados con reglas ricas, y en Pagos sería un "repositorio vacío".
- **[13/10]** **Observer (RF-08).** Al cancelar una reserva de clase se publica el evento `CupoLiberado`, y un oyente avisa al primero de la lista de espera. · **Decisión:** usar el `EventEmitter` de Node en lugar de escribir el patrón a mano, con aislamiento de fallas entre oyentes.
- **[13/10]** **CQRS nivel 2.** `GET /api/reportes/ocupacion` para el tablero del gerente, con SQL propio que no pasa por el repositorio. · **Decisión:** nivel 2 y no 3: misma base, sin consistencia eventual.
- **[13/10]** Arreglo de `AppError`. · **Problema:** el manejador de errores leía `status` y la clase guardaba `statusCode`, así que todo error de negocio salía como 400 y el 409 de RN-02 nunca llegaba al cliente → se corrigió en una línea.
- **[13/10]** Verificación: 32 tests automáticos y un recorrido de la API (27 chequeos) contra dos bases distintas (Anexo C). · **Problema:** en una base creada por Sequelize la lista de espera no funcionaba, porque el cupo de las clases lo descuenta un trigger que esa base no tenía → se dejó el script del trigger en `docs/trigger-cupos-clases.sql`.
- **[15/10]** ADR-007 (patrones de la Unidad III) y esta bitácora. · **Desvío del plan:** los patrones estaban planificados para las semanas 4 y 5 y se aplicaron en la semana 7, dentro de la ventana que fija la cátedra para el laboratorio (semanas 6 y 7).

### Unidad IV — apoyo
- **[02/10]** Pantallas base conectadas al backend real (login por DNI, registro de socios y clientes, panel con datos de membresía y aforo de la sede, listado de usuarios), para validar la integración de punta a punta. · **Problema:** el backend todavía no maneja contraseñas → la sesión se simula en el navegador (sessionStorage), y queda documentado en el código.

### Unidad V — Testing y CI/CD
- [ ] Semanas 9 y 10: tests unitarios y de integración; pipeline CI/CD; Dockerfile y docker-compose.

### Cierre
- [ ] Pendiente (semanas 12 y 13).

---

## Santiago Agustín Villagra — Frontend Developer

- **[24/09 – 07/10]** Líder del Sprint 3 (semanas 5 y 6).

### Unidad IV — Componentes (Aplicación Web vanilla)
- [ ] **Semana 6 (01/10 – 07/10):** estructura base HTML/CSS/JS, login, dashboard y listado de usuarios. *(Completa Santiago.)*
- [ ] **Semana 7 (08/10 – 14/10):** modularización de la UI y pantallas de reserva de canchas y de clases. *(Completa Santiago.)*
- [ ] **Semana 8 (15/10 – 21/10, en curso):** capa de servicio del frontend e integración real con el backend.

### Cierre
- [ ] Pendiente (semanas 12 y 13).

---

# Anexos — Unidad III (Patrones de diseño)

Detalle que pide la consigna del laboratorio. La justificación formal de cada patrón está en `docs/ADR-007-patrones-unidad-iii.md`.

## Anexo A — Patrones aplicados y descartados

| Patrón | Requerimiento | Dónde está en el código |
|---|---|---|
| Strategy | RF-11 · precio dinámico de canchas | `src/modules/canchas/strategies/` |
| Repository | RN-02 y RF-02 · reservas de cancha y membresías | `src/modules/canchas/repositorio/` y `src/modules/membresias/repositorio/` |
| Observer | RF-08 · aviso a la lista de espera | `src/common/bus-eventos.js` y `src/modules/clases/observer/` |
| CQRS (nivel 2) | Tablero del gerente: ocupación entre sedes | `src/modules/reportes/` |

Criterio: un patrón se justifica con una variación real y conocida, no con una imaginada.

| Descartado | Dónde se evaluó | Por qué no |
|---|---|---|
| Decorator | Precio de canchas | Alternativa a Strategy para RF-11; ver la entrada del 13/10. |
| Builder | Crear una Reserva | Pocos campos, la mitad se calculan en el servicio y no hay opcionales. |
| State | Membresía (Activo / Vencido / Suspendido) | Solo dos lugares preguntan por el estado. Es el siguiente candidato si aparecen reglas por estado o se pide auditar las transiciones. |
| Chain of Responsibility | Validaciones antes de reservar | Cortan en el primer error y no se pide devolverlos todos juntos. |
| Template Method | Comprobante de pago | Hay un solo formato (PDF). |
| Adapter | Pasarela de pagos | La pasarela es un simulador propio. Aparece cuando se integre un SDK real. |
| Abstract Factory | Pasarela + comprobante | Hay un solo país y una sola pasarela. |
| Command | Operaciones de mostrador | No hay deshacer, cola ni reintento que lo paguen. |
| Singleton | Servicios | El composition root ya crea una sola instancia de cada servicio y la inyecta. |

## Anexo B — Planilla de olores de código

Relevamiento sobre el código **antes** de aplicar los patrones; las líneas son las del código original.

| # | Archivo : línea | Olor | Evidencia | Decisión |
|---|---|---|---|---|
| O-1 | `canchas/canchas.service.js:67` y `canchas/strategies/*.js` | Abstracción especulativa / requerimiento simulado | `cotizar()` dice `// MOCK DIRECTO (Sin Strategy)` y devuelve siempre `precioHora`. Los tres archivos de `strategies/` pesan 0 bytes. | **Corregido → Strategy.** No fue un refactoring puro: no había un `if/else` que refactorizar, había un mock. Primero se implementó RF-11 (cambio funcional, con tests) y después se le dio la estructura. |
| O-2 | `canchas/canchas.service.js:61` | Número mágico duplicado | El horario pico `h >= 19 && h < 21` estaba escrito a mano en la grilla, y RF-11 lo necesitaba de nuevo. | **Corregido.** `esHorarioPico()` es la única definición y la usan la grilla y el recargo. |
| O-3 | `canchas/canchas.service.js` | El dominio conoce la infraestructura | Usaba `ReservaCanchaModel`, `Op.between` y atrapaba `SequelizeUniqueConstraintError`. | **Corregido → Repository.** |
| O-4 | `canchas/canchas.repository.js:4` | Código muerto (y roto) | Nadie lo importa, y `require('./cancha.model')` apunta a un archivo que no existe. | **Borrar.** Lo reemplaza `canchas/repositorio/`. |
| O-5 | `membresias/membresias.service.js:10` y `:67`, frontend `registro.js:26` | Sentencia switch repetida | El mismo cálculo de meses por plan en tres lugares. | **Corregido en parte** (Extract Method `calcularVencimiento`: queda un solo switch en el backend). **No se lleva a Strategy:** tres planes fijos y estables, sin colaboradores. |
| O-6 | `membresias/membresias.service.js:87` | Condicional muerto | Pregunta `estado !== 'ACTIVO'` justo después de asignar `ACTIVO`, así que al renovar una vencida no se actualiza `fecha_inicio`. | **No se corrige en el refactoring:** es un cambio de comportamiento. Queda fijado por un test de caracterización y va en un commit funcional aparte. |
| O-7 | `membresias/membresias.service.js:64` | Fechas ambiguas (detectado en las pruebas) | `new Date('2026-11-13')` se interpreta en UTC: renovar por 3 meses deja el vencimiento en el 12/02/2027, y el socio pierde un día en cada renovación. | **No se corrige en el refactoring.** Commit funcional aparte. |
| O-8 | `common/app-error.js:6` y `app.js:39` | Contrato roto entre dos piezas | `AppError` guarda `statusCode`, pero el manejador lee `status`: todo error de negocio salía como 400. | **Corregido** en un commit `fix:` separado. |
| O-9 | `clases/clases.service.js:64` y `:82` | Responsabilidad repartida | El cupo lo descuenta un trigger de la base, pero lo suma el servicio. Sin el trigger, la clase nunca se llena y RF-08 no se puede usar. | **Documentado.** Aplicar `docs/trigger-cupos-clases.sql` si falta. Queda para decidir en equipo un único dueño del cupo. |
| O-10 | `clases/clases.service.js:78` | Dato que se pierde en silencio | Se asigna `conPenalidad`, pero el modelo no tiene ese campo. | **No se corrige** (cambio funcional). Anotado. |
| O-11 | `usuarios/usuarios.service.js:48`, `membresias/membresias.service.js:37` | Errores inconsistentes | "No encontrado" sale como 400 en vez de 404. | **No se corrige en este refactoring.** |
| O-12 | `pagos/comprobante-pdf.js:25`, `acceso/acceso.service.js:57` y `:77` | Nombre de campo equivocado | Lee `nombreCompleto`, pero el campo es `nombre_completo`: el comprobante dice "Cliente: undefined". | **Fuera del alcance de patrones.** Commit `fix:` aparte. |
| O-13 | `core/errorHandler.js`, `membresias/membresias.validators.js` | Archivos vacíos | Dos archivos de 0 bytes que nadie importa. | **Borrar.** |
| O-14 | `usuarios/usuarios.service.js:21` | Dos caminos de escritura del mismo agregado | Al registrar un socio, la membresía se crea salteando el repositorio. | **No se corrige ahora:** ocurre dentro de la transacción del registro, y el repositorio todavía no acepta transacciones. |

Resumen: 4 corregidos, 1 corregido en parte, 2 marcados para borrar y 7 documentados sin corregir a propósito. Los controladores no tienen reglas de negocio (no hay "controlador gordo").

## Anexo C — Verificación

- **32 tests automáticos** (`node --test`), todos en verde, también con la zona horaria de Argentina. Corren en menos de un segundo, sin base de datos.
  - `precios.test.js`: cada regla sola, la combinación, los bordes del horario pico y una regla nueva agregada sin tocar el `Tarifador`.
  - `reservas-cancha.test.js`: el servicio real con el repositorio en memoria. RN-02 (409), la cancelación que libera el turno y la grilla de disponibilidad.
  - `membresias.test.js`: tests de **caracterización**, verificados también contra el servicio original. Incluyen la rareza O-6.
  - `lista-espera.test.js`: el aviso al primero de la lista, la entrega del evento a varios oyentes y el aislamiento de fallas.
- **Recorrido de la API:** 27 chequeos de punta a punta contra dos bases (una creada con el script SQL del equipo y otra creada por Sequelize). Pasaron todos; en la segunda, la lista de espera recién funcionó después de agregar el trigger (O-9).
- **Adaptación de la consigna:** la consigna pide tests de caracterización sobre el precio actual, pero el precio era un mock sin comportamiento que caracterizar. Se hicieron sobre Membresías, que sí tenía reglas, incluida una rareza.

## Anexo D — Estado de los entregables de la consigna

| # | Entregable | Estado | Dónde |
|---|---|---|---|
| 1 | Tests de caracterización, incluida una rareza | Hecho (sobre Membresías) | `test/membresias.test.js` |
| 2 | Planilla de olores (mínimo 5) | Hecho: 14 olores | Anexo B |
| 3 | Refactoring del módulo de precios, un commit por paso | Código hecho; **falta subir el historial** | Anexo E |
| 4 | Repositorio de dominio para Reserva y Membresía, con traducción de RN-02 y test en memoria | Hecho | `*/repositorio/*` |
| 5 | Consulta de lectura separada (CQRS nivel 2) | Hecho | `modules/reportes/*` |
| 6 | ADR de patrones | Hecho | `docs/ADR-007-patrones-unidad-iii.md` |

## Anexo E — Commits previstos de la Unidad III

1. `fix: AppError expone status para el manejador de errores (O-8)`
2. `feat: RF-11 estrategias de precio y Tarifador`
3. `feat: RF-11 cotizar usa el Tarifador; esHorarioPico en la grilla (O-1, O-2)`
4. `refactor: Repository para reservas de cancha, con traducción de RN-02 (O-3)`
5. `refactor: Repository para membresías + Extract Method calcularVencimiento (O-5)`
6. `feat: RF-08 aviso a la lista de espera con eventos de dominio (Observer)`
7. `feat: tablero del gerente con consulta de lectura separada (CQRS nivel 2)`
8. `chore: borrar código muerto (O-4, O-13)`
9. `docs: ADR-007 y bitácora de la Unidad III`

Cuando estén subidos, se agrega el hash de cada uno a las entradas del 13/10 y 15/10.
