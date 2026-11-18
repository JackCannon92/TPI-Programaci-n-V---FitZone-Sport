# FitZone Sports

FitZone Sports es una plataforma web para una cadena de 25 gimnasios. Los socios gestionan su membresía, entran a cualquier sede mostrando un QR en el celular, se anotan en clases y alquilan canchas de pádel y fútbol pagando en línea. El personal usa una consola para controlar los ingresos, el aforo de cada sede, las canchas y las clases. Si se corta la conexión, la recepción sigue validando los QR y los ingresos se cargan solos cuando vuelve.

**Trabajo Integrador Final · Programación V** · Licenciatura en Sistemas · FCAD-UNER · Prof. Lic. Juan José Aguirre · 2026

## Equipo

| Integrante | Rol | Usuario de Git |
|---|---|---|
| Franco Ayala | P1 · Arquitecto / Backend Lead | [@orangecraft2](https://github.com/orangecraft2) |
| Martín Emiliano Sirizzotti | P2 · Backend Developer y P4 · QA / DevOps | [@JackCannon92](https://github.com/JackCannon92) |
| Santiago Agustín Villagra | P3 · Frontend Developer | [@Santiago1102](https://github.com/SantiagoV1102) |

## Puesta en marcha

Requisito: [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y abierto.

1. `git clone https://github.com/JackCannon92/TPI-Programaci-n-V---FitZone-Sport.git`
2. `cd TPI-Programaci-n-V---FitZone-Sport`
3. `docker compose up --build`
4. Abrir http://localhost:8080 e ingresar con uno de los DNI de la tabla de abajo.
5. La API y su documentación están en http://localhost:3000/api-docs.

La primera vez se crean las tablas y se cargan los datos de prueba. Para empezar de cero: `docker compose down -v` y volver al paso 3. Sin Docker, con Node.js y un PostgreSQL propio: ver el [manual de instalación](docs/manuales/manual-instalacion-operacion.md).

## Usuarios de prueba

Los carga el seed (`backend/db/02-seed.sql`), uno por cada rol. El sistema no maneja contraseñas: se ingresa con el DNI.

| Rol | Nombre | DNI | Para qué sirve |
|---|---|---|---|
| Socio | Lucía Fernández | 30111222 | Socia al día: descuento en canchas, clases y QR de acceso |
| Socio en mora | Diego Romero | 30222333 | Membresía vencida: paga las canchas como externo y no puede entrar |
| Cliente externo | Paula Gómez | 35444555 | Alquila canchas sin membresía y entra con el QR de su reserva |
| Recepcionista | Carla Benítez | 28555666 | Recepción: lee los QR, controla el aforo, funciona sin conexión |
| Administrador de sede | Sergio Ledesma | 27666777 | Gestión de su sede: canchas y clases |
| Gerente | Graciela Ruiz | 25777888 | Gestión de toda la cadena |

Además hay 25 sedes con canchas de pádel y fútbol (una en mantenimiento), tres clases por sede, una clase de cupo reducido para probar la lista de espera y 20 socios más.

## Documentación

| Qué | Dónde |
|---|---|
| Decisiones de arquitectura (ADR-001 a ADR-017) | [`docs/adr/`](docs/adr/) |
| Diagramas: C4, DER, UML, despliegue y pipeline (fuente y PNG) | [`docs/diagramas/`](docs/diagramas/) |
| Manuales de usuario, de instalación y operación, y técnico | [`docs/manuales/`](docs/manuales/) |
| Bitácoras personales | [`docs/bitacoras/`](docs/bitacoras/) |
| Planificación: plan, cronograma, carga, trazabilidad, seguimiento y riesgos | [`docs/planificacion/`](docs/planificacion/) |
| Evidencia de los requisitos no funcionales | [`docs/rnf/`](docs/rnf/) |
| Entregables por unidad, historial del equipo y dossier | [`docs/entregables/`](docs/entregables/) |
| Contrato de la API | [`backend/swagger.json`](backend/swagger.json) y Swagger UI en http://localhost:3000/api-docs |

## Pruebas y cobertura

```bash
cd backend
npm install
npm test                    # 113 pruebas unitarias y de integración, sin base de datos
npm run test:cov            # además, el reporte de cobertura en backend/coverage/
npm run test:concurrencia   # RN-02 contra PostgreSQL real (necesita DATABASE_URL)
```

Estado al 18/11/2026: **113 pruebas en verde, 82,3 % de líneas y 61,5 % de ramas cubiertas**. El umbral mínimo (ADR-008) es 70 % de líneas y 50 % de ramas: si un cambio lo baja, las pruebas fallan. El pipeline de GitHub Actions corre todo esto, más la prueba de concurrencia y un despliegue de prueba, en cada push a `main`.

## Estructura del repositorio

```
README.md · LICENSE · docker-compose.yml · .env.example
backend/                API REST monolítica modular: Node.js, Express 5, Sequelize y PostgreSQL
  src/usuarios/         M1 · RF-01 a RF-03 (con membresias/ y sedes/)
  src/acceso/           M2 · RF-04, RF-05, RNF-01
  src/clases/           M3 · RF-06 a RF-08
  src/canchas/          M4 · RF-09 a RF-12
  src/pagos/            M5 · RF-13, RF-14
  src/common/           errores, validación, eventos y QR firmados
  src/core/             composition root, base de datos, Swagger
  test/                 unitarias, integración y concurrencia
  db/                   esquema y datos de prueba
  swagger.json          contrato OpenAPI exportado
frontend/src/           aplicación web, HTML, CSS y JavaScript sin framework (ADR-006)
  portal/               portal responsive del socio
  admin/                consola de administración: recepción, gestión y usuarios
  components/           piezas de interfaz compartidas y estilos
  services/             capa de servicio contra la API y terminal sin conexión
  store/                estado global (sesión)
docs/                   adr, diagramas, bitacoras, manuales, planificacion, rnf, entregables
```

## Uso de inteligencia artificial

Usamos herramientas de IA durante el trabajo y lo declaramos, como piden los lineamientos:

- **Gemini**: revisión del material de la Unidad I. Cada observación se verificó contra los archivos antes de aplicarla y algunas se descartaron.
- **Claude**: generación y corrección de código (patrones, pruebas, códigos QR, pantallas, sincronización sin conexión), explicación de conceptos y ayuda con la documentación.

Todo lo generado con IA se probó antes de subirlo. El detalle de cómo la usó cada uno está en su bitácora personal.
