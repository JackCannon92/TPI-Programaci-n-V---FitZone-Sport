# Bitácora del equipo — FitZone Sports (LOG.md)

**Programación V** · Licenciatura en Sistemas · FCAD-UNER · Prof. Lic. Juan José Aguirre

Este archivo reúne las decisiones del equipo y los anexos de la Unidad III. Lo que hizo cada integrante, con sus complejidades, está en su bitácora personal (`docs/bitacoras/`).

Formato de cada entrada: `[fecha] (commit) Qué se hizo · Decisión tomada · Problema encontrado y cómo se resolvió`

**Estado al 02/11/2026:** semana 10 de 13. Unidades I, II y III cerradas; Unidad IV en curso; Unidad V en curso (semana 9, tests: hecha; semana 10, CI/CD: pendiente).

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

- **[27/08]** Debate arquitectónico de la semana 1, entre los tres. · **Decisión:** monolito modular sobre Node.js + Express, con un módulo por dominio (usuarios, membresías, acceso, clases, canchas, pagos). Se descartan los microservicios: evitar la sobreventa de canchas (RN-02) exigiría transacciones distribuidas, y un equipo de 3 no tiene la escala operativa que piden. → ADR-001 y ADR-005. · **Problema:** la cátedra sugiere un equipo de 4 roles y somos 3 → se fusionan los roles, pero cada unidad mantiene un responsable claro.
- **[29/08]** · **Decisión:** se descartan TypeScript, NestJS y React; backend y frontend en JavaScript vanilla. La curva de aprendizaje de esas herramientas se comía el tiempo que la materia pide dedicar a arquitectura, patrones y persistencia. → ADR-005 (revisado).
- **[29/08]** La cátedra indica que la Unidad VI (ecosistema móvil) no es obligatoria. · **Decisión:** se elimina la app móvil y todos los roles usan una única Aplicación Web; el QR del socio (RF-04) es una página pensada para verse en el celular. Las semanas de la Unidad VI pasan a ser de refuerzo. → ADR-012. En la misma fecha se elige Supabase (plan gratuito) como hosting de PostgreSQL. → ADR-002.
- **[29/08 – 16/09]** Revisión externa del material de la Unidad I con otra IA (Gemini). · **Decisión:** cada observación se verificó contra los archivos antes de aplicarla. Se aplicaron las válidas (consistencia de nombres, secciones faltantes en los ADR, pruebas de humo vía Swagger) y se descartaron dos (un error de tipeo que no existía, y pasar a ES Modules, que contradecía el código en CommonJS).
- **[03/09]** Plan de tareas del TI: 13 semanas (27/08 al Demo Day del 20/11), 76 horas prácticas, liderazgo rotativo cada dos semanas y tareas semanales repartidas entre los tres. · **Problema:** el plan se corrigió dos veces, una por la fecha real de inicio y otra para comprimirlo de 16 a 13 semanas sin perder horas. Ahora se sigue en una planilla con el estado de cada tarea.
- **[27/10]** Indicaciones de la cátedra en el check-in (líder: Santiago): (1) mantener el plan de actividades en una hoja de Google y enviarlo por mail; (2) no usar CQRS; (3) cada patrón de diseño con su propio ADR; (4) se pueden usar dos QR (a definir con la cátedra qué alcance tiene). · **Decisión:** el 28/10 se quita CQRS del código y de la documentación, el ADR de patrones se separa en ADR-013 (Strategy), ADR-014 (Repository) y ADR-015 (Observer), y el plan pasa a Google Sheets.
- **[28/10]** Se aclara la indicación (4): se puede usar más de un código QR para resolver necesidades del sistema. · **Decisión:** además del QR del socio (RF-04) se suman cuatro, cada uno con un solo propósito: (1) reserva de cancha, para que el cliente externo pueda entrar a la sede; (2) acceso sin conexión, para que el torno valide sin internet; (3) asistencia a clase, que por fin usa el estado `ASISTIO`; (4) verificación del comprobante PDF. → ADR-016.
- **[30/10]** La cátedra pide que la bitácora sea personalizada y registre las complejidades encontradas. · **Decisión:** una bitácora por integrante en `docs/bitacoras/`, con una tabla de complejidades (qué pasó, cómo se resolvió y qué se aprendió) y el uso de IA; este archivo queda para las decisiones conjuntas y los anexos.
- **[05/11]** Ordenamos el repositorio de GitHub: hasta ahora el código se había subido de una sola vez (15/10). · **Decisión:** desde hoy cada cambio se sube en commits separados por tema, cada integrante desde su propia cuenta, y las bitácoras citan esos commits.

---

## Bitácoras personales

Desde el 30/10, por indicación de la cátedra, cada integrante lleva su propia bitácora, en primera persona, con lo que hizo, las decisiones que tomó y las complejidades con las que se encontró y cómo las resolvió.

| Integrante | Rol | Bitácora |
|---|---|---|
| Franco Ayala | Arquitecto / Backend Lead | [`docs/bitacoras/LOG-ayala.md`](bitacoras/LOG-ayala.md) |
| Martín Emiliano Sirizzotti | Backend Developer / QA-DevOps | [`docs/bitacoras/LOG-sirizzotti.md`](bitacoras/LOG-sirizzotti.md) |
| Santiago Agustín Villagra | Frontend Developer | [`docs/bitacoras/LOG-villagra.md`](bitacoras/LOG-villagra.md) |

Los nombres siguen los lineamientos de entrega (`LOG-<apellido>.md`). Cada integrante sube y actualiza su propia bitácora desde su cuenta.

Cada uno tuvo su frente difícil: Franco, la **base de datos** (conectar el backend con Supabase, el esquema y los nombres de columnas); Martín, los **tests** (pasar a Jest, probar sin depender de Supabase, entender los dobles de prueba); y Santiago, el **frontend** (armar la interfaz sin framework y conectarla con la API). Para resolver muchos problemas usamos herramientas de IA: Gemini para revisar el material de la Unidad I, y Claude (Martín) para código, explicaciones y documentación. Todo lo generado se probó antes de entregarlo. El detalle está en cada bitácora personal.

---

# Anexos — Unidad III (Patrones de diseño)

Detalle que pide la consigna del laboratorio. Cada patrón tiene su propio ADR: `docs/adr/ADR-013-strategy-precio-canchas.md`, `ADR-014-repository-reservas-membresias.md` y `ADR-015-observer-lista-espera.md`.

## Anexo A — Patrones aplicados y descartados

| Patrón | Requerimiento | Dónde está en el código | ADR |
|---|---|---|---|
| Strategy | RF-11 · precio dinámico de canchas | `src/modules/canchas/strategies/` | ADR-013 |
| Repository | RN-02 y RF-02 · reservas de cancha y membresías | `src/modules/canchas/repositorio/` y `src/modules/membresias/repositorio/` | ADR-014 |
| Observer | RF-08 · aviso a la lista de espera | `src/common/bus-eventos.js` y `src/modules/clases/observer/` | ADR-015 |

CQRS (nivel 2) se aplicó el 13/10 para el tablero del gerente y se quitó el 28/10 por indicación de la cátedra.

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
| O-12 | `pagos/comprobante-pdf.js:25`, `acceso/acceso.service.js:57` y `:77` | Nombre de campo equivocado | Lee `nombreCompleto`, pero el campo es `nombre_completo`: el comprobante dice "Cliente: undefined". | **Corregido el 28/10** (en acceso y en el comprobante), en un commit `fix:` aparte. |
| O-13 | `core/errorHandler.js`, `membresias/membresias.validators.js` | Archivos vacíos | Dos archivos de 0 bytes que nadie importa. | `errorHandler.js` **se usó** (28/10): ahí vive el manejador global de errores. `membresias.validators.js`: **borrar**. |
| O-14 | `usuarios/usuarios.service.js:21` | Dos caminos de escritura del mismo agregado | Al registrar un socio, la membresía se crea salteando el repositorio. | **No se corrige ahora:** ocurre dentro de la transacción del registro, y el repositorio todavía no acepta transacciones. |
| O-15 | `pagos/pagos.service.js` (detectado el 28/10) | Nombre de columna equivocado | El historial de pagos ordena por `createdAt`, pero la columna es `created_at`: `GET /api/pagos/usuario/{id}` respondía error. | **Corregido el 28/10**, commit `fix:` aparte. |

Resumen (al 28/10): 6 corregidos (O-12 y O-15 después de la Unidad III), 1 corregido en parte, 2 marcados para borrar y 6 documentados sin corregir a propósito. Los controladores no tienen reglas de negocio (no hay "controlador gordo").

## Anexo C — Verificación

- **Tests automáticos:** en la Unidad III fueron 32, con el runner de Node. El 28/10 (Unidad V) se pasaron a Jest y se sumaron los de integración con Supertest (54). Con los de los códigos QR hoy son **99** (`npm test`: 72 unitarios y 27 de integración), todos en verde, también con la zona horaria de Argentina, y sin base de datos.
  - `test/unit/precios.test.js`: cada regla sola, la combinación, los bordes del horario pico y una regla nueva agregada sin tocar el `Tarifador`.
  - `test/unit/reservas-cancha.test.js`: el servicio real con el repositorio en memoria. RN-02 (409), la cancelación que libera el turno y la grilla de disponibilidad.
  - `test/unit/membresias.test.js`: tests de **caracterización**, verificados también contra el servicio original. Incluyen la rareza O-6.
  - `test/unit/lista-espera.test.js`: el aviso al primero de la lista, la entrega del evento a varios oyentes y el aislamiento de fallas.
  - `test/integracion/*.api.test.js` y `app.test.js`: la API por HTTP con Supertest.
  - `test/unit/qr-*.test.js` y `test/integracion/qr.api.test.js`: los cuatro QR (firma, vigencia, tipo equivocado, QR adulterado, uso repetido, sede equivocada).
- **Recorrido de la API:** 27 chequeos de punta a punta contra dos bases (una creada con el script SQL del equipo y otra creada por Sequelize). Pasaron todos; en la segunda, la lista de espera recién funcionó después de agregar el trigger (O-9).
- **Adaptación de la consigna:** la consigna pide tests de caracterización sobre el precio actual, pero el precio era un mock sin comportamiento que caracterizar. Se hicieron sobre Membresías, que sí tenía reglas, incluida una rareza.

## Anexo D — Estado de los entregables de la consigna

| # | Entregable | Estado | Dónde |
|---|---|---|---|
| 1 | Tests de caracterización, incluida una rareza | Hecho (sobre Membresías) | `test/unit/membresias.test.js` |
| 2 | Planilla de olores (mínimo 5) | Hecho: 14 olores | Anexo B |
| 3 | Refactoring del módulo de precios, un commit por paso | Código hecho; **falta subir el historial** | Anexo E |
| 4 | Repositorio de dominio para Reserva y Membresía, con traducción de RN-02 y test en memoria | Hecho | `*/repositorio/*` |
| 5 | Consulta de lectura separada (CQRS nivel 2) | Hecha el 13/10 y **quitada el 28/10 por indicación de la cátedra** | — |
| 6 | ADR de patrones | Hecho: un ADR por patrón | `docs/adr/ADR-013` (Strategy), `ADR-014` (Repository), `ADR-015` (Observer) |

## Anexo E — Commits previstos

**Unidad III**
1. `fix: AppError expone status para el manejador de errores (O-8)`
2. `feat: RF-11 estrategias de precio y Tarifador`
3. `feat: RF-11 cotizar usa el Tarifador; esHorarioPico en la grilla (O-1, O-2)`
4. `refactor: Repository para reservas de cancha, con traducción de RN-02 (O-3)`
5. `refactor: Repository para membresías + Extract Method calcularVencimiento (O-5)`
6. `feat: RF-08 aviso a la lista de espera con eventos de dominio (Observer)`
7. `chore: borrar código muerto (O-4, O-13)`
8. `docs: un ADR por patrón (ADR-013 Strategy, ADR-014 Repository, ADR-015 Observer) y bitácora`

**Unidad V (semana 9)**
9. `refactor: el manejador global de errores pasa a core/errorHandler.js`
10. `test: tests unitarios con Jest`
11. `test: tests de integración de la API con Supertest`

**Códigos QR (ADR-016)**
12. `fix: leer nombre_completo en acceso y en el comprobante (O-12)`
13. `fix: historial de pagos ordenado por created_at (O-15)`
14. `feat: QR firmados; QR de reserva de cancha para el ingreso del cliente externo`
15. `feat: QR de acceso sin conexión con firma Ed25519`
16. `feat: QR de asistencia a clase (estado ASISTIO)`
17. `feat: comprobante con QR de ingreso y QR de verificación`
18. `test: tests de los códigos QR`
19. `docs: ADR-016 códigos QR, bitácora y README`

Cuando estén subidos, se agrega el hash de cada uno a sus entradas.
