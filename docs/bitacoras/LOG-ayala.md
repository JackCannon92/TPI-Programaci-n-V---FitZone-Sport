# Bitácora — Franco Ayala — Arquitecto / Backend Lead

> **Nota sobre los commits:** Los commits de agosto y principios de septiembre (`740fea1`, `55ea8de`, `a7e6b2b`, `f50f89d`) pertenecen al repositorio inicial. En este repositorio el código se subió de una sola vez el 15/10 (`ef6fd8a`), así que el trabajo de fines de septiembre y octubre no tiene commits individuales. Desde el 05/11 subo cada cambio en un commit separado por tema y lo cito acá.

## Sprint 1 — Unidad I (Arquitectura) — Semana del 2026-08-27

### 2026-08-29 · 5 h
**Actividad**
Modelado de diagramas C4 de nivel 1 (contexto con los cuatro actores y sistemas externos) y nivel 2 (contenedores: Aplicación Web, Backend API y PostgreSQL en Supabase), junto con la redacción de los ADR iniciales entregados en docs/TP_FitZone_Unidad_I_ADR.pdf. Revisión del material asistida con Gemini, verificando cada observación contra los archivos reales y descartando las que no aplicaban al caso.
**Decisión**
Adoptar un estilo arquitectónico de monolito modular (ver ADR-001) sobre PostgreSQL (ver ADR-002), contemplar la validación de ingreso ante caídas de red (ver ADR-003) y unificar la interfaz en un único contenedor web para todos los roles con vistas dinámicas según el perfil (ver ADR-006), evitando transacciones distribuidas para un equipo de tres integrantes.
**Problema o bloqueo**
El caso exige reglas que cruzan módulos como no vender dos veces la misma cancha (RN-02), lo que se definió resolver mediante transacciones locales y un índice único en la base de datos dentro del monolito (ver ADR-004). Además, los ADR habían quedado encerrados dentro del PDF y no se podían referenciar desde el código ni versionar por separado; los migré a archivos Markdown individuales en docs/adr/ (ADR-001 a ADR-006) con su índice y plantilla.
**Commits**
`740fea1` migración de ADRs a archivos individuales en docs/adr (repositorio inicial)

---

## Sprint 1 — Unidad II (Frameworks) — Semana del 2026-09-03

### 2026-09-07 · 2 h
**Actividad**
Armado del scaffolding del monolito modular en Express, estructurando cada módulo con sus rutas, controladores y servicios ensamblados desde un composition root mediante inyección de dependencias manual (ver ADR-005).
**Decisión**
Mantener la configuración de la base de datos fuera del código fuente utilizando la variable DATABASE_URL dentro del archivo .env (excluido del repositorio) con conexión SSL obligatoria, en línea con el ADR-002.
**Problema o bloqueo**
Sequelize tenía que conectarse a la base remota en Supabase, lo que exigía configurar el usuario del proyecto, forzar SSL y elegir entre el pooler de sesión y el de transacción. Se dejó configurada la conexión segura por entorno y, junto con Martín, se programó el comando db:check para probar la conexión de forma aislada antes de levantar todo el servidor.
**Commits**
`55ea8de` scaffolding del monolito modular en Express y configuración de conexión a Supabase (repositorio inicial)

---

### 2026-09-07 · 2 h
**Actividad**
Resolución del Laboratorio 1 aplicando inyección de dependencias sobre el módulo de usuarios y redacción del documento de selección de framework.
**Decisión**
Formalizar la elección de Express, la inversión de control manual y Sequelize en el ADR-005, refactorizando UsuariosService como una función fábrica que recibe sus dependencias por parámetro desde src/core/compositionRoot.js.
**Problema o bloqueo**
Para ejecutar las pruebas unitarias de UsuariosService sin conectarse a la base de datos remota, el servicio no podía instanciar ni requerir su propio repositorio o modelo internamente. Al transformarlo en una función fábrica, el composition root le inyecta la implementación real en ejecución y la suite de pruebas le pasa un repositorio en memoria (ADR-014), logrando cubrir siete casos de prueba.
**Commits**
`a7e6b2b` refactorización de UsuariosService con inyección de dependencias y tests, rama refactor-di (repositorio inicial)

---

### 2026-09-07 · 3 h
**Actividad**
Resolución del Laboratorio 2 definiendo el archivo openapi.yaml como fuente de verdad, implementación del cliente tipado con JSDoc y auditoría de rendimiento en las consultas a la base de datos.
**Decisión**
Aplicar versionado explícito por URL bajo la ruta /api/v1 y validar automáticamente la correspondencia entre Express y la especificación OpenAPI.
**Problema o bloqueo**
Para evitar que la documentación se desactualizara respecto del código, armé una suite con cincuenta casos de prueba que comparan cada ruta contra el contrato. Durante las pruebas detecté consultas N+1 en dos endpoints críticos: el listado de presentes ejecutaba 501 consultas con 500 personas y reportes/resumen llegaba a 303 consultas con 50 sedes; tras medirlos con un contador de consultas y optimizar las cargas, bajaron a 2 y 8 consultas respectivamente (documentado en docs/informe-medicion-n+1.md).
**Commits**
`f50f89d` contrato openapi.yaml, suite de validación y corrección de consultas N+1, rama contrato-api (repositorio inicial)

---

### 2026-09-09 · 1 h
**Actividad**
Estandarización de la estructura de carpetas dentro de src/modules/, preparando los directorios de dominio para el resto de los módulos del sistema.
**Decisión**
Reservar explícitamente en la estructura de directorios los lugares destinados a los patrones GoF que se implementan en la siguiente unidad.
**Problema o bloqueo**
Al estructurar el módulo de canchas, el cálculo de tarifas devolvía siempre un precio fijo simulado y los archivos de patrones estaban vacíos. Dejé el mock marcado como deuda técnica documentada para completarlo con el patrón Strategy en la Unidad III.
**Commits**
`ef6fd8a` incluido en la carga unificada del código al repositorio definitivo (15/10)

---

## Sprint 2 — Unidad II (Frameworks) — Semana del 2026-09-10

### 2026-09-16 · 5 h
**Actividad**
Liderazgo del Sprint 2 (semanas 3 y 4): preparación del check-in de avance con la guía elaborada por Martín y diseño del esquema físico de la base de datos. No pude asistir al check-in del 17/09; lo presenté el 01/10, después de la mesa de exámenes del 22 al 28/09.
**Decisión**
Construir las tablas mediante un script SQL versionado (docs/esquema-base.sql) en lugar de delegar la creación del esquema a la sincronización automática de Sequelize, tal como quedó asentado en los ADR-002 y ADR-005.
**Problema o bloqueo**
La generación de tablas desde Sequelize chocaba con los tipos ENUM de PostgreSQL y no permitía expresar reglas críticas a nivel motor. Se resolvió definiendo restricciones CHECK en lugar de ENUM, incorporando el índice único parcial que protege la regla RN-02 contra reservas simultáneas (ADR-004) y creando el trigger para el control de cupos en las clases.
**Commits**
`ef6fd8a` incluido en la carga unificada del código al repositorio definitivo (15/10)

---

## Sprint 3 — Unidad II y III (Frameworks y Patrones) — Semana del 2026-09-24

### 2026-09-28 · 3 h
**Actividad**
Desarrollo e integración en el composition root de los módulos de Sedes, Acceso (QR firmado según ADR-003 y control de aforo), Canchas, Clases (agenda, reservas y lista de espera) y Pagos (pasarela simulada y generación de comprobante PDF), dejando la base lista para que Martín aplicara los patrones Strategy, Repository y Observer en octubre. Presenté el check-in del 01/10, que se corrió por la mesa de exámenes del 22 al 28/09.
**Decisión**
Mapear sistemáticamente los nombres de columnas entre la convención con guion bajo de PostgreSQL (created_at, sede_id) y la convención camelCase de JavaScript (createdAt, sedeId) en todos los modelos.
**Problema o bloqueo**
Las diferencias de nomenclatura entre el motor relacional y el código provocaban fallos recién al ejecutar cada consulta contra la base real; se configuraron las propiedades field y underscored en Sequelize para alinear los modelos con el script SQL versionado.
**Commits**
`ef6fd8a` incluido en la carga unificada del código al repositorio definitivo (15/10)


---

## Sprint 4 — Unidad IV (Componentes) — Semana del 2026-10-08

### 2026-10-15 · 2 h
**Actividad**
Trabajo conjunto con Martín en la integración de la capa de servicio del contenedor web único (`frontend/src/services/api.js`, definido en el ADR-006) con los endpoints reales del backend en Express (ADR-005), a partir del contrato documentado en OpenAPI/Swagger, sobre las pantallas que él estaba armando (ingreso, panel, usuarios y los avances de reservas, pagos y validación de QR).
**Decisión**
Centralizar el consumo de la API desde el cliente web mediante un único módulo de peticiones fetch acoplado al contrato REST y estandarizar las respuestas de error HTTP del backend (400, 404 y 409 Conflict por concurrencia en RN-02 según ADR-004) para que la interfaz gestione los rechazos sin duplicar lógica de dominio.
**Problema o bloqueo**
Al conectar esas pantallas con el servidor Express aparecieron bloqueos por políticas de origen cruzado (CORS) en el navegador y diferencias en el formato de los payloads de reservas, pagos y validación de QR. Se resolvió habilitando el middleware CORS en `backend/src/app.js` y alineando los campos enviados por el frontend con los esquemas validados con express-validator y Swagger.
**Commits**
`ef6fd8a` incluido en la carga unificada del 15/10 (trabajo previo al ordenamiento por tema del 05/11)

---

## Sprint 5 — Unidad V (Testing y CI/CD) — Semana del 2026-10-22

### 2026-10-30 · 2 h
**Actividad**
Sprint 5 (semanas 9 y 10), que me correspondía liderar según el plan; el check-in del 29/10 lo presentó Martín. Revisión de las pruebas unitarias y de integración sobre los módulos de backend (incluido Usuarios y Membresías, dentro de la suite con Jest y Supertest) y seguimiento de los ajustes que pidió la cátedra en el check-in del 15/10 y que Santi le pasó al equipo el 27/10.
**Decisión**
Priorizar que las reglas de negocio y endpoints pasaran las pruebas automatizadas con repositorios en memoria (ADR-014) antes de cerrar Docker y el pipeline CI/CD en el siguiente tramo.
**Problema o bloqueo**
Las tareas que pidió la cátedra el 15/10, encaradas desde el 27/10, desplazaron la configuración de Docker y GitHub Actions fuera del sprint; quedó abierto el cierre de infraestructura, integración de punta a punta y documentación final para el Sprint 6.
**Commits**
Sin commit individual (etapa previa al ordenamiento por tema del 05/11)

---

## Sprint 6 — Integración y documentación — Semana del 2026-11-05

### 2026-11-17 · 2 h
**Actividad**
Revisión y reescritura de los documentos de decisión arquitectónica asignados (ADR-001 a ADR-004, ADR-011 sobre versionado en /api/v1 y ADR-012 sobre el reemplazo de la app móvil por la web responsive), actualización del esquema SQL versionado junto con el script de datos iniciales (25 sedes y los 4 roles del sistema), carga de los usuarios de GitHub del equipo en el README y actualización de la bitácora personal.
**Decisión**
Unificar el formato de los ADR con contexto, alternativas descartadas y consecuencias verificables contra el código actual, y dejar los scripts de base de datos listos en `backend/db/` (01-esquema.sql y 02-seed.sql) para que se ejecuten automáticamente al inicializar el contenedor de PostgreSQL en Docker.
**Problema o bloqueo**
Los ADR redactados al inicio del cuatrimestre habían quedado desactualizados respecto de la implementación final y faltaban decisiones incorporadas después, como el versionado explícito de la API y la sustitución de la aplicación móvil. Además, el esquema inicial de septiembre solo creaba las tablas sin datos de prueba suficientes; se completó el seed con las 25 sedes y los 4 perfiles exigidos para que el entorno quede operable apenas se levanta.
**Commits**
`bd48c52` ADR-001 al ADR-004, ADR-011 y ADR-012 · `ace9ac7` esquema SQL y datos de prueba (25 sedes y 4 roles) · `3273b98` usuarios de GitHub en el README · `5f08a17` actualización de bitácora personal

---

### 2026-11-17 · 4 h
**Actividad**
Elaboración de los diagramas de arquitectura y datos con código fuente editable en Mermaid (.mmd) y exportación a PNG —C4 nivel 1 (Contexto), C4 nivel 2 (Contenedores), DER físico y Diagrama de Despliegue—, redacción del Manual Técnico del sistema y posterior revisión y actualización de su contenido final.
**Decisión**
Versionar el código fuente .mmd junto con cada imagen exportada para mantener la documentación editable, y estructurar el Manual Técnico a partir de la arquitectura real del monolito modular, el composition root y las guías de extensión del sistema.
**Problema o bloqueo**
Al exportar los diagramas desde Mermaid aparecieron problemas de legibilidad y solapamiento: en el diagrama de Despliegue la nota del modo offline pisaba las flechas hacia la API, y en el C4 de Contenedores el estilo de renderizado y las etiquetas HTML volvían ilegible el texto dentro de las cajas. Se corrigió el código fuente ajustando subgrafos, espaciado y sintaxis Markdown nativa, y en una segunda pasada sobre el Manual Técnico se terminaron de alinear las referencias técnicas con los diagramas y el esquema SQL definitivos.
**Commits**
`2a4bbd5` diagramas C4 de contexto y contenedores, DER y despliegue · `05c0596` manual técnico · `bc15e18` actualización del manual técnico