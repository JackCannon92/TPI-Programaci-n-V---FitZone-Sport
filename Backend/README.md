# FitZone Sports — Backend

Plataforma de gestión para una cadena de gimnasios con varias sedes: socios y membresías, control de acceso con QR, clases grupales con lista de espera, alquiler de canchas y pagos.

**Trabajo Integrador · Programación V** · Licenciatura en Sistemas · FCAD-UNER · Prof. Lic. Juan José Aguirre · 2026

| Integrante | Rol |
|---|---|
| Franco Ayala | Arquitecto / Backend Lead |
| Martín Emiliano Sirizzotti | Backend Developer / QA-DevOps |
| Santiago Agustín Villagra | Frontend Developer |

---

## Stack

- **Node.js + Express 5**, en JavaScript (CommonJS), sin TypeScript
- **PostgreSQL** alojado en **Supabase**, accedido con el ORM **Sequelize**
- **Swagger** (swagger-jsdoc + swagger-ui-express) para documentar y probar la API
- **express-validator** para validar las peticiones, **pdfkit** para los comprobantes y **qrcode** para el acceso
- **Jest** para los tests unitarios y **Supertest** para los tests de integración de la API

La Aplicación Web (HTML, CSS y JavaScript vanilla) consume esta API.

## Arquitectura

Es un **monolito modular**: un solo proceso de Express, con un módulo por dominio de negocio. Cada módulo tiene sus rutas, controlador, servicio y modelos. Los módulos no se llaman por HTTP, sino a través de funciones que reciben sus dependencias (**inyección de dependencias manual**). Todo se arma en un único lugar: `src/core/compositionRoot.js`.

Las decisiones de arquitectura están documentadas como ADR (ver [Documentación](#documentación)).

```
src/
├── app.js                  Express: middlewares, rutas y manejo de errores
├── server.js               Arranque: conexión a la base y puerto
├── core/
│   ├── compositionRoot.js  Arma servicios, controladores y rutas (y los patrones)
│   ├── db.js               Conexión Sequelize y relaciones entre modelos
│   ├── errorHandler.js     Manejo global de errores (lo comparten la API y los tests)
│   └── swagger.js          Documentación en /api-docs
├── common/                 Errores, enums, validación, bus de eventos y firma de QR
└── modules/
    ├── usuarios/           Alta de socios y clientes externos (RF-01)
    ├── membresias/         Planes, vencimiento, renovación y suspensión (RF-02, RF-03)
    ├── sedes/              Sedes y aforo máximo
    ├── acceso/             QR del socio (RF-04), QR sin conexión, ingreso con reserva y aforo (RF-05)
    ├── clases/             Clases grupales, reservas y lista de espera (RF-06 a RF-08)
    ├── canchas/            Canchas, disponibilidad, precio dinámico y reservas (RF-09 a RF-12)
    └── pagos/              Pasarela simulada y comprobante PDF (RF-13, RF-14)
test/
├── unit/                   Tests unitarios (Jest)
├── integracion/            Tests de la API por HTTP (Supertest)
└── dobles/                 Datos y dobles de prueba compartidos
docs/                       Bitácora, ADR y scripts SQL
```

## Cómo levantarlo

**Requisitos:** Node.js 20 o superior, y acceso al proyecto de Supabase del equipo (o uno propio).

1. **Clonar e instalar dependencias**
   ```bash
   git clone <url-del-repositorio>
   cd Backend
   npm install
   ```

2. **Configurar las variables de entorno.** Copiar `.env.example` como `.env` y completar `DATABASE_URL` con la cadena de conexión de Supabase y `QR_SECRET` con un texto largo cualquiera. `URL_PUBLICA` (la dirección que va impresa en el QR del comprobante) ya viene con `http://localhost:3000`. El `.env` tiene la contraseña de la base: está en el `.gitignore` y no se sube nunca.

3. **Crear las tablas (solo la primera vez).** En Supabase → **SQL Editor** → **New query**, pegar el contenido de [`docs/esquema-base.sql`](docs/esquema-base.sql) y ejecutarlo. Crea las 11 tablas, los índices y el trigger que descuenta los cupos de las clases.
   > Si la base ya existía y se había creado desde Sequelize, falta el trigger de cupos: correr solo [`docs/trigger-cupos-clases.sql`](docs/trigger-cupos-clases.sql). Sin ese trigger, las clases nunca se llenan y la lista de espera no se puede usar.

4. **Levantar la API**
   ```bash
   npm start        # o npm run dev, que reinicia solo al guardar cambios
   ```
   Tiene que aparecer `🚀 Servidor de FitZone corriendo en http://localhost:3000`.

5. **Probarla.** La documentación interactiva está en **http://localhost:3000/api-docs**: cada endpoint se prueba con *Try it out* → *Execute*.

## Tests

```bash
npm test
```

Son 99 tests (72 unitarios y 27 de integración) que corren en un par de segundos y **no necesitan base de datos**: los servicios reales se prueban con repositorios en memoria. Para correr uno solo: `npm test -- precios`.

| Archivo | Tipo | Qué prueba |
|---|---|---|
| `test/unit/precios.test.js` | Unitario | Las reglas de precio de canchas, una por una y combinadas (RF-11) |
| `test/unit/reservas-cancha.test.js` | Unitario | Reservas de cancha: un mismo turno no se puede reservar dos veces (RN-02) |
| `test/unit/membresias.test.js` | Unitario | Asignación, vencimiento, renovación y suspensión de membresías |
| `test/unit/lista-espera.test.js` | Unitario | El aviso a la lista de espera cuando se libera un cupo (RF-08) |
| `test/unit/qr-firmado.test.js` | Unitario | La firma de los QR: vigencia, tipo equivocado y QR adulterado |
| `test/unit/qr-reserva.test.js` | Unitario | QR de reserva de cancha: el externo entra solo en su turno y en su sede |
| `test/unit/qr-offline.test.js` | Unitario | QR de acceso sin conexión: el torno valida con la clave pública, sin base |
| `test/unit/qr-asistencia.test.js` | Unitario | QR de asistencia a clase: marca `ASISTIO` una sola vez |
| `test/unit/qr-comprobante.test.js` | Unitario | QR de verificación del comprobante: detecta un monto cambiado |
| `test/integracion/canchas.api.test.js` | Integración | La API de canchas por HTTP: precio, reservas, 409 de RN-02, validaciones y 404 |
| `test/integracion/membresias.api.test.js` | Integración | La API de membresías por HTTP: consulta, renovación y suspensión |
| `test/integracion/qr.api.test.js` | Integración | Los cuatro QR por HTTP |
| `test/integracion/app.test.js` | Integración | La aplicación completa arma todos los módulos y responde (health, Swagger) |

## API

Todas las rutas empiezan con `/api`. El detalle de cada una (parámetros, cuerpos y respuestas) está en Swagger.

| Módulo | Endpoints |
|---|---|
| Salud | `GET /health` |
| Usuarios | `POST /usuarios` · `GET /usuarios` · `GET /usuarios/{id}` · `PUT /usuarios/{id}` |
| Membresías | `GET /membresias/{id_usuario}` · `PUT /membresias/{id_usuario}/renovar` · `PATCH /membresias/{id_usuario}/suspender` |
| Sedes | `POST /sedes` · `GET /sedes` · `GET /sedes/{id}` · `PATCH /sedes/{id}` |
| Acceso | `GET /acceso/qr/{usuarioId}` · `POST /acceso/ingreso` · `POST /acceso/egreso` · `GET /acceso/aforo/{sedeId}` · `GET /acceso/presentes/{sedeId}` · `POST /acceso/ingreso-reserva` · `GET /acceso/qr-offline/{usuarioId}` · `POST /acceso/validar-offline` · `GET /acceso/clave-publica` |
| Canchas | `POST /canchas` · `GET /canchas/sede/{sedeId}` · `GET /canchas/{id}` · `GET /canchas/{id}/disponibilidad?fecha=` · `GET /canchas/{id}/precio?usuarioId=&inicio=` · `PATCH /canchas/{id}/estado` |
| Reservas de cancha | `POST /canchas/reservas` · `GET /canchas/reservas/{id}` · `GET /canchas/reservas/usuario/{usuarioId}` · `PATCH /canchas/reservas/{id}/cancelar` · `GET /canchas/reservas/{id}/qr` |
| Clases | `POST /clases` · `GET /clases` · `GET /clases/{id}` · `POST /clases/reservas` · `GET /clases/reservas/usuario/{usuarioId}` · `PATCH /clases/reservas/{id}/cancelar` · `GET /clases/reservas/{id}/qr` · `POST /clases/asistencia` · `POST /clases/lista-espera` · `GET /clases/{id}/lista-espera` |
| Pagos | `POST /pagos` · `GET /pagos/{id}` · `GET /pagos/{id}/comprobante` · `GET /pagos/usuario/{usuarioId}` · `GET /pagos/verificar/{token}` |

## Reglas de negocio destacadas

- **RN-02 · Sin sobreventa de canchas.** Si dos personas reservan la misma cancha en el mismo horario, solo una lo logra. Lo garantiza PostgreSQL con un índice único parcial (`uq_reserva_cancha_turno_activo`); la API responde **409** a la segunda.
- **RN-03 · Socios al día.** Solo un socio con la membresía activa puede reservar clases y tener el descuento en canchas; un socio vencido paga como cliente externo.
- **RF-11 · Precio dinámico de canchas.** Precio base, **−15 %** para socios y **+20 %** entre las 19 y las 21 hs. El recargo se calcula sobre el precio ya descontado.
- **RF-08 · Lista de espera.** Cuando alguien cancela una reserva de clase, se avisa al primero de la lista de espera.
- **RF-04 · QR de acceso.** Firmado con HMAC y válido por un minuto: una captura de pantalla vieja deja de servir.

## Códigos QR

Además del QR del socio hay cuatro, cada uno para una sola cosa ([ADR-016](docs/adr/ADR-016-codigos-qr.md)). Ninguno se guarda en la base: llevan sus datos firmados, y un QR de un tipo no sirve para otro.

| QR | Para qué | Cómo se obtiene → dónde se usa | Vigencia |
|---|---|---|---|
| Reserva de cancha | Que quien alquiló una cancha (sobre todo el cliente externo) entre a la sede | `GET /canchas/reservas/{id}/qr` o el comprobante PDF → `POST /acceso/ingreso-reserva` | De 30 min antes del turno hasta que termina, solo en esa sede y solo si está paga |
| Acceso sin conexión | Que el torno valide al socio sin internet (firma Ed25519) | `GET /acceso/qr-offline/{usuarioId}` → el torno, con `GET /acceso/clave-publica` (se simula con `POST /acceso/validar-offline`) | 24 h, o hasta que vence la membresía |
| Asistencia a clase | Registrar que el socio vino (`ASISTIO`) | `GET /clases/reservas/{id}/qr` → `POST /clases/asistencia` | De 30 min antes a 60 min después del inicio, una sola vez |
| Verificación del comprobante | Comprobar que un ticket es auténtico y que no le cambiaron el monto | Impreso en el comprobante PDF → `GET /pagos/verificar/{token}` | Sin vencimiento |

## Patrones de diseño

Cada patrón tiene su propio ADR, con el requerimiento que lo motiva, las alternativas que se descartaron y cómo se verifica.

| Patrón | Para qué | Dónde | ADR |
|---|---|---|---|
| **Strategy** | Precio dinámico de canchas (RF-11): cada regla es una estrategia y el `Tarifador` las aplica en orden | `src/modules/canchas/strategies/` | [ADR-013](docs/adr/ADR-013-strategy-precio-canchas.md) |
| **Repository** | Aislar la base de datos en Reserva de cancha y Membresía, y traducir el error de RN-02 a un 409 | `src/modules/canchas/repositorio/` · `src/modules/membresias/repositorio/` | [ADR-014](docs/adr/ADR-014-repository-reservas-membresias.md) |
| **Observer** | Avisar a la lista de espera cuando se libera un cupo, sin acoplar la cancelación al aviso (RF-08) | `src/common/bus-eventos.js` · `src/modules/clases/observer/` | [ADR-015](docs/adr/ADR-015-observer-lista-espera.md) |

Los patrones que se evaluaron y no se aplicaron (Builder, State, Chain of Responsibility, Template Method, Abstract Factory, Command y Singleton), con su motivo, están en el Anexo A de [`docs/LOG.md`](docs/LOG.md).

## Documentación

| Documento | Contenido |
|---|---|
| [`docs/LOG.md`](docs/LOG.md) | Bitácora del equipo: decisiones conjuntas y anexos de la Unidad III |
| [`docs/bitacoras/`](docs/bitacoras/) | Bitácora personal de cada integrante, con las complejidades que encontró y cómo las resolvió |
| [`docs/adr/`](docs/adr/README.md) | Registro de decisiones de arquitectura (ADR-005 a ADR-016) |
| [`docs/esquema-base.sql`](docs/esquema-base.sql) | Script para crear la base completa en Supabase |
| [`docs/trigger-cupos-clases.sql`](docs/trigger-cupos-clases.sql) | Solo el trigger de cupos, para bases ya existentes |

Todos los ADR del equipo (Unidades I, II y III) están en [`docs/adr/`](docs/adr/README.md), con su índice.
