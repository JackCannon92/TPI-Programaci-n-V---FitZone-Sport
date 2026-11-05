# FitZone Sports

Plataforma de gestión para una cadena de gimnasios con varias sedes: socios y membresías, control de acceso con QR, clases grupales con lista de espera, alquiler de canchas con precio dinámico y pagos.

**Trabajo Integrador Final · Programación V** · Licenciatura en Sistemas · FCAD-UNER · Prof. Lic. Juan José Aguirre · 2026

| Integrante | Rol | Usuario de GitHub |
|---|---|---|
| Franco Ayala | Arquitecto / Backend Lead | *(completar)* |
| Martín Emiliano Sirizzotti | Backend Developer / QA-DevOps | [@JackCannon92](https://github.com/JackCannon92) |
| Santiago Agustín Villagra | Frontend Developer | *(completar)* |

---

## Estructura del repositorio

```
Backend/     API REST: Node.js + Express 5, Sequelize y PostgreSQL (Supabase)
  src/       Monolito modular: un módulo por dominio, armado en core/compositionRoot.js
  test/      Tests con Jest y Supertest (unitarios e integración)
  docs/      ADR, bitácora del equipo, bitácoras personales y scripts SQL
Frontend/    Aplicación Web: HTML, CSS y JavaScript sin framework (en curso)
```

Cada carpeta tiene su propio `README.md` con el detalle.

## Cómo levantarlo

**Requisitos:** Node.js 20 o superior y un proyecto de PostgreSQL en Supabase (o una base PostgreSQL propia).

1. **Backend**
   ```bash
   cd Backend
   npm install
   cp .env.example .env      # completar DATABASE_URL y los secretos
   npm start                 # http://localhost:3000 · Swagger en /api-docs
   ```
   La primera vez hay que crear las tablas con `Backend/docs/esquema-base.sql` (y el trigger de `docs/trigger-cupos-clases.sql`).

2. **Tests** (no necesitan base de datos)
   ```bash
   cd Backend
   npm test
   ```

3. **Aplicación Web**: abrir `Frontend/index.html` con Live Server (o cualquier servidor estático) con el backend corriendo.

> El archivo `.env` tiene la contraseña de la base: **nunca se sube** (está en `.gitignore`). Solo se sube `.env.example`.

## Documentación

| Qué | Dónde |
|---|---|
| Decisiones de arquitectura (ADR) | [`Backend/docs/adr/`](Backend/docs/adr/) |
| Bitácora del equipo y anexos de la Unidad III | [`Backend/docs/LOG.md`](Backend/docs/LOG.md) |
| Bitácoras personales | [`Backend/docs/bitacoras/`](Backend/docs/bitacoras/) |
| Documentación de la API | Swagger, en `http://localhost:3000/api-docs` |

## Estado

| Unidad | Estado |
|---|---|
| I · Arquitectura | Hecha |
| II · Frameworks | Hecha |
| III · Patrones de diseño | Hecha: Strategy, Repository y Observer, con un ADR por patrón |
| IV · Aplicación Web | En curso |
| V · Testing y CI/CD | Tests hechos (Jest y Supertest); CI/CD con GitHub Actions y Docker en curso |
| VI · Móvil | No obligatoria: se descartó (ADR-006) |

## Uso de inteligencia artificial

Usamos herramientas de IA durante el trabajo y lo declaramos acá, como piden los lineamientos de la cátedra:

- **Gemini**: revisión del material de la Unidad I. Cada observación se verificó contra los archivos antes de aplicarla y algunas se descartaron.
- **Claude**: generación y corrección de código (patrones, tests, códigos QR y pantallas de la Aplicación Web), explicación de conceptos (mocks, CQRS, Swagger) y ayuda con la documentación.

Todo lo generado con IA se probó antes de subirlo (Swagger, `npm test` y la aplicación). El detalle de cómo la usó cada uno está en su bitácora personal.
