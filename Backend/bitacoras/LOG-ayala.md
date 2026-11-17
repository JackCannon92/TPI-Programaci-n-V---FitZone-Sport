# Bitácora — Franco Ayala — Arquitecto / Backend Lead

## Sprint 1 — Unidad I (Arquitectura) — Semana del 2026-08-27

### 2026-08-29 · 5 h
**Actividad**
Modelado de diagramas C4 de nivel 1 (contexto con los cuatro actores y sistemas externos) y nivel 2 (contenedores: Aplicación Web, Backend API y PostgreSQL en Supabase), junto con la redacción de los ADR iniciales entregados en docs/TP_FitZone_Unidad_I_ADR.pdf. Revisión del material asistida con Gemini, verificando cada observación contra los archivos reales y descartando las que no aplicaban al caso.
**Decisión**
Adoptar un estilo arquitectónico de monolito modular (ver ADR-001) y un único contenedor web para todos los roles con vistas dinámicas según el perfil (ver ADR-005), evitando transacciones distribuidas para un equipo de tres integrantes.
**Problema o bloqueo**
El caso exige reglas que cruzan módulos como no vender dos veces la misma cancha (RN-02), lo que se resolvió mediante transacciones locales y un índice único en la base de datos dentro del monolito. Además, los ADR habían quedado encerrados dentro del PDF y no se podían referenciar desde el código ni versionar por separado; los migré a archivos individuales en docs/adr/ con índice y plantilla.

---

## Sprint 1 — Unidad II (Frameworks) — Semana del 2026-09-03

### 2026-09-07 · 2 h
**Actividad**
Armado del scaffolding del monolito modular en Express, estructurando cada módulo con sus rutas, controladores y servicios ensamblados desde un composition root mediante inyección de dependencias manual.
**Decisión**
Mantener la configuración de la base de datos fuera del código fuente leyendo las variables de entorno desde la raíz del proyecto (.env excluido del repositorio) y centralizar el armado de dependencias en src/core/compositionRoot.js.
**Problema o bloqueo**
Al iniciar el servidor desde subdirectorios o importar modelos de forma directa, las variables de entorno no se cargaban a tiempo y las capas quedaban acopladas a Sequelize. Se resolvió fijando la ejecución desde la raíz del proyecto y pasando los modelos y servicios como parámetros de funciones fábrica desde el composition root.

### 2026-09-07 · 2 h
**Actividad**
Resolución del Laboratorio 1 aplicando inyección de dependencias sobre el módulo de usuarios y redacción del documento de selección de framework.
**Decisión**
Formalizar la elección de Express, la inversión de control manual y Sequelize en el ADR-005, refactorizando UsuariosService como una función fábrica que recibe sus dependencias por parámetro desde src/core/compositionRoot.js.
**Problema o bloqueo**
Para ejecutar las pruebas unitarias de UsuariosService sin conectarse a la base de datos remota, el servicio no podía instanciar ni requerir su propio repositorio internamente. Al transformarlo en una función fábrica, el composition root le inyecta la implementación real en ejecución y la suite de pruebas le pasa un repositorio en memoria, logrando cubrir siete casos de prueba.


---

### 2026-09-07 · 3 h
**Actividad**
Resolución del Laboratorio 2 definiendo el archivo openapi.yaml como fuente de verdad, implementación del cliente tipado con JSDoc y auditoría de rendimiento en las consultas a la base de datos.
**Decisión**
Aplicar versionado explícito por URL bajo la ruta /api/v1 y validar automáticamente la correspondencia entre Express y la especificación OpenAPI.
**Problema o bloqueo**
Para evitar que la documentación se desactualizara respecto del código, armé una suite con cincuenta casos de prueba que comparan cada ruta contra el contrato. Durante las pruebas detecté consultas N+1 en dos endpoints críticos: el listado de presentes ejecutaba 501 consultas con 500 personas y reportes/resumen llegaba a 303 consultas con 50 sedes; tras medirlos con un contador de consultas y optimizar las cargas, bajaron a 2 y 8 consultas respectivamente (documentado en docs/informe-medicion-n+1.md).


---

### 2026-09-09 · 1 h
**Actividad**
Estandarización de la estructura de carpetas dentro de src/modules/, preparando los directorios de dominio para el resto de los módulos del sistema.
**Decisión**
Reservar explícitamente en la estructura de directorios los lugares destinados a los patrones GoF que se implementan en la siguiente unidad.
**Problema o bloqueo**
Al estructurar el módulo de canchas, el cálculo de tarifas devolvía siempre un precio fijo simulado y los archivos de patrones estaban vacíos. Dejé el mock marcado como deuda técnica documentada para completarlo con el patrón Strategy en la Unidad III.


---

## Sprint 2 — Unidad II (Frameworks) — Semana del 2026-09-10

### 2026-09-16 · 5 h
**Actividad**
Liderazgo del Sprint 2 (semanas 3 y 4), verificación de la conexión con Supabase utilizando el comando db:check preparado por Martín (10/09), diseño del esquema físico de la base de datos (docs/esquema-base.sql), implementación del Módulo 1 (Usuarios y Membresías) y presentación del check-in de avance con la guía elaborada por Martín.
**Decisión**
Definir el esquema físico en un script SQL versionado (docs/esquema-base.sql) en lugar de delegar la creación de tablas a la sincronización automática de Sequelize, materializando las definiciones de los ADR-002 y ADR-004.
**Problema o bloqueo**
Los modelos del ORM por sí solos no permitían expresar reglas de integridad críticas a nivel motor y presentaban conflictos con los tipos ENUM en PostgreSQL. Se resolvió redactando el script SQL del equipo con restricciones CHECK en lugar de ENUM, el índice único parcial que protege la regla RN-02 contra reservas simultáneas, el soporte polimórfico en la tabla de pagos y el trigger para el control de cupos en clases.


---

## Sprint 3 — Unidad II y III (Frameworks y Patrones) — Semana del 2026-09-24

### 2026-09-28 · 3 h
**Actividad**
Desarrollo y ensamblado en el composition root de los módulos de Sedes, Acceso (QR firmado y control de aforo), Canchas, Clases (agenda, reservas y lista de espera) y Pagos (pasarela simulada y generación de comprobante PDF), dejando preparado el backend para la inyección de los patrones de la Unidad III.
**Decisión**
Mapear sistemáticamente los nombres de columnas entre la convención snake_case de PostgreSQL (created_at, sede_id, aforo_maximo) y la convención camelCase de JavaScript (createdAt, sedeId, aforoMaximo) en todos los modelos de Sequelize.
**Problema o bloqueo**
Las diferencias de nomenclatura entre las tablas del script SQL y los modelos en JavaScript provocaban rechazos de PostgreSQL al ejecutar las consultas desde los endpoints. Se resolvió configurando las propiedades field y underscored: true en la definición de cada modelo y verificando el alta y consulta de los módulos desde Swagger.


---

## Sprint 5 — Unidad V (Testing y CI/CD) — Semana del 2026-10-22

### 2026-10-30 · 2 h
**Actividad**
Liderazgo del Sprint 5 (semanas 9 y 10), validación de las pruebas unitarias y de integración sobre los módulos de backend (99 tests consolidados con Jest y Supertest junto con los nuevos flujos de códigos QR) y revisión de las adecuaciones arquitectónicas indicadas por la cátedra el 27/10 (eliminación de CQRS y separación de los ADR de patrones y QR).
**Decisión**
Asegurar que toda la lógica de negocio y los endpoints pasen las pruebas automatizadas utilizando repositorios en memoria antes de cerrar la configuración del pipeline CI/CD y contenedores de la Semana 10.
**Problema o bloqueo**
Durante las pruebas integrales con datos reales y la revisión de la cátedra surgieron ajustes puntuales en las respuestas de error y en la documentación de las decisiones de diseño; se dejaron alineados los ADR y la bitácora personal para encarar el cierre de integración de las semanas 11 a 13.
