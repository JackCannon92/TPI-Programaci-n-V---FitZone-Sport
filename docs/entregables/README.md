# Entregables

| Entregable | Archivo | Estado |
|---|---|---|
| Dossier del trabajo integrador (PDF del campus) | `PROGV-2026-TIF-EquipoNN-Dossier.pdf` | Se agrega al cerrar la entrega |
| Planificación (PDF) y planilla de registro | `PROGV-2026-TIF-EquipoNN-Planificacion.pdf` · `PROGV-2026-TIF-EquipoNN-Registro.xlsx` | Se agregan al cerrar la entrega; la fuente está en [`../planificacion/`](../planificacion/) |
| Historial del equipo y anexos de la Unidad III (olores de código, patrones evaluados y descartados) | [`historial-del-equipo.md`](historial-del-equipo.md) | Registro de decisiones conjuntas del 27/08 al 05/11. No reemplaza a las bitácoras personales de [`../bitacoras/`](../bitacoras/) |
| Trigger de cupos de clases (olor O-9), para bases ya creadas | [`trigger-cupos-clases.sql`](trigger-cupos-clases.sql) | Incluido en `backend/db/01-esquema.sql` para bases nuevas |

## Entregables por unidad

| Unidad | Qué se entregó | Dónde |
|---|---|---|
| I · Arquitectura | C4 de contexto, contenedores y componentes; ADR-001 a 004, 011 y 012 | [`../diagramas/`](../diagramas/), [`../adr/`](../adr/) |
| II · Frameworks, IoC y ORM | Express con composition root, Sequelize; ADR-005 | `backend/src/core/`, [`../adr/`](../adr/) |
| III · Patrones de diseño | Strategy, Repository y Observer, un ADR por patrón (ADR-013 a 015); anexos de olores y patrones | `backend/src/canchas/strategies/`, `backend/src/*/repositorio/`, `backend/src/clases/observer/`, [`historial-del-equipo.md`](historial-del-equipo.md) |
| IV · Aplicación web | Portal del socio y consola de administración; ADR-006 y ADR-007 | `frontend/src/` |
| V · Pruebas y CI/CD | 113 pruebas, concurrencia contra PostgreSQL, Docker y pipeline; ADR-008 y ADR-009 | `backend/test/`, `docker-compose.yml`, `.github/workflows/ci.yml` |
| VI · Móvil | No obligatoria; reemplazada por el portal responsive (ADR-012) | [`../adr/`](../adr/) |
