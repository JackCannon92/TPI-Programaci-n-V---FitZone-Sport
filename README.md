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
docker-compose.yml   Levanta base de datos, API y aplicación web con un comando
.github/workflows/   Pipeline de integración continua (pruebas, imagen y entorno de pruebas)
Backend/             API REST: Node.js + Express 5, Sequelize y PostgreSQL
  src/               Monolito modular: un módulo por dominio, armado en core/compositionRoot.js
  test/              Pruebas con Jest y Supertest (unitarias e integración)
  db/                Esquema de la base y datos de prueba (seed)
  docs/              ADR, bitácora del equipo y bitácoras personales
  swagger.json       Contrato OpenAPI exportado
Frontend/            Aplicación web: HTML, CSS y JavaScript sin framework (en curso)
```

Cada carpeta tiene su propio `README.md` con el detalle.

## Cómo levantarlo

### Con Docker (recomendado)

**Requisito:** Docker Desktop (o Docker Engine con Compose).

```bash
docker compose up --build
```

| Qué | Dónde |
|---|---|
| Aplicación web | http://localhost:8080 |
| API | http://localhost:3000/api/v1 |
| Swagger | http://localhost:3000/api-docs |

La primera vez se crean las tablas y se cargan los datos de prueba (`Backend/db/`). Para empezar de cero: `docker compose down -v` y volver a levantar. Las claves se toman de un `.env` en la raíz (copiar `.env.example`); si no existe, se usan valores de desarrollo.

### Sin Docker

**Requisitos:** Node.js 20 o superior y un PostgreSQL (Supabase o propio) donde se hayan corrido `Backend/db/01-esquema.sql` y `Backend/db/02-seed.sql`.

```bash
cd Backend
npm install
cp .env.example .env      # completar DATABASE_URL y QR_SECRET
npm start                 # http://localhost:3000 · Swagger en /api-docs
```

La aplicación web se abre con Live Server (o cualquier servidor estático) sobre `Frontend/`, con la API corriendo.

> Los archivos `.env` tienen contraseñas: **nunca se suben** (están en `.gitignore`). Solo se suben los `.env.example`.

## Usuarios de prueba

Los carga el seed, uno por cada rol del sistema más los casos de la demo. El sistema todavía no maneja contraseñas: se ingresa con el DNI.

| Rol | Nombre | DNI | Para qué sirve |
|---|---|---|---|
| Socio (CLIENTE) | Lucía Fernández | 30111222 | Socia al día: descuento en canchas, clases, QR de acceso |
| Socio en mora (CLIENTE) | Diego Romero | 30222333 | Membresía vencida: paga las canchas como externo y no puede entrar |
| Cliente externo (CLIENTE) | Paula Gómez | 35444555 | Alquila canchas sin membresía y entra con el QR de su reserva |
| Recepcionista | Carla Benítez | 28555666 | Recepción: lee los QR y controla el aforo |
| Administrador de sede | Sergio Ledesma | 27666777 | Gestión de la sede: canchas y clases |
| Gerente central | Graciela Ruiz | 25777888 | Gestión de toda la cadena |

Además hay 25 sedes, canchas de pádel y fútbol en cada una (una en mantenimiento), tres clases por sede para mañana, una clase de cupo reducido para probar la lista de espera, y 20 socios más.

## Pruebas y cobertura

```bash
cd Backend
npm test            # 100 pruebas: unitarias e integración, sin base de datos
npm run test:cov    # además genera el reporte de cobertura en Backend/coverage/
```

Cobertura al 08/11/2026: **80,8 % de líneas y 58,1 % de ramas**. El umbral mínimo (ADR-008) es 70 % de líneas y 50 % de ramas: si un cambio lo baja, las pruebas fallan. El pipeline de GitHub Actions las corre en cada Pull Request.

## Documentación

| Qué | Dónde |
|---|---|
| Decisiones de arquitectura (ADR) | [`Backend/docs/adr/`](Backend/docs/adr/) |
| Bitácora del equipo y anexos de la Unidad III | [`Backend/docs/LOG.md`](Backend/docs/LOG.md) |
| Bitácoras personales | [`Backend/docs/bitacoras/`](Backend/docs/bitacoras/) |
| Documentación de la API | Swagger, en `http://localhost:3000/api-docs`, y el contrato exportado en [`Backend/swagger.json`](Backend/swagger.json) (`npm run swagger:export`) |

## Estado

| Unidad | Estado |
|---|---|
| I · Arquitectura | Hecha |
| II · Frameworks | Hecha |
| III · Patrones de diseño | Hecha: Strategy, Repository y Observer, con un ADR por patrón |
| IV · Aplicación Web | En curso |
| V · Testing y CI/CD | Pruebas con Jest y Supertest, umbral de cobertura, Docker y pipeline en GitHub Actions |
| VI · Móvil | No obligatoria: se descartó (ADR-012) |

## Uso de inteligencia artificial

Usamos herramientas de IA durante el trabajo y lo declaramos acá, como piden los lineamientos de la cátedra:

- **Gemini**: revisión del material de la Unidad I. Cada observación se verificó contra los archivos antes de aplicarla y algunas se descartaron.
- **Claude**: generación y corrección de código (patrones, tests, códigos QR y pantallas de la Aplicación Web), explicación de conceptos (mocks, CQRS, Swagger) y ayuda con la documentación.

Todo lo generado con IA se probó antes de subirlo (Swagger, `npm test` y la aplicación). El detalle de cómo la usó cada uno está en su bitácora personal.
