[README.md](https://github.com/user-attachments/files/33641811/README.md)
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
- **node:test**, el test runner que trae Node, para las pruebas unitarias

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
│   └── swagger.js          Documentación en /api-docs
├── common/                 Errores, enums, validación y bus de eventos
└── modules/
    ├── usuarios/           Alta de socios y clientes externos (RF-01)
    ├── membresias/         Planes, vencimiento, renovación y suspensión (RF-02, RF-03)
    ├── sedes/              Sedes y aforo máximo
    ├── acceso/             QR dinámico (RF-04) y control de aforo (RF-05)
    ├── clases/             Clases grupales, reservas y lista de espera (RF-06 a RF-08)
    ├── canchas/            Canchas, disponibilidad, precio dinámico y reservas (RF-09 a RF-12)
    ├── pagos/              Pasarela simulada y comprobante PDF (RF-13, RF-14)
    └── reportes/           Tablero del gerente: ocupación por sede
test/                       Tests unitarios (sin base de datos)
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

2. **Configurar las variables de entorno.** Copiar `.env.example` como `.env` y completar `DATABASE_URL` con la cadena de conexión de Supabase. El `.env` tiene la contraseña de la base: está en el `.gitignore` y no se sube nunca.

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

Son 32 tests unitarios que corren en menos de un segundo, **sin base de datos**: cada regla se prueba con repositorios en memoria.

| Archivo | Qué prueba |
|---|---|
| `test/precios.test.js` | Las reglas de precio de canchas, una por una y combinadas (RF-11) |
| `test/reservas-cancha.test.js` | Reservas de cancha: un mismo turno no se puede reservar dos veces (RN-02) |
| `test/membresias.test.js` | Asignación, vencimiento, renovación y suspensión de membresías |
| `test/lista-espera.test.js` | El aviso a la lista de espera cuando se libera un cupo (RF-08) |

## API

Todas las rutas empiezan con `/api`. El detalle de cada una (parámetros, cuerpos y respuestas) está en Swagger.

| Módulo | Endpoints |
|---|---|
| Salud | `GET /health` |
| Usuarios | `POST /usuarios` · `GET /usuarios` · `GET /usuarios/{id}` · `PUT /usuarios/{id}` |
| Membresías | `GET /membresias/{id_usuario}` · `PUT /membresias/{id_usuario}/renovar` · `PATCH /membresias/{id_usuario}/suspender` |
| Sedes | `POST /sedes` · `GET /sedes` · `GET /sedes/{id}` · `PATCH /sedes/{id}` |
| Acceso | `GET /acceso/qr/{usuarioId}` · `POST /acceso/ingreso` · `POST /acceso/egreso` · `GET /acceso/aforo/{sedeId}` · `GET /acceso/presentes/{sedeId}` |
| Canchas | `POST /canchas` · `GET /canchas/sede/{sedeId}` · `GET /canchas/{id}` · `GET /canchas/{id}/disponibilidad?fecha=` · `GET /canchas/{id}/precio?usuarioId=&inicio=` · `PATCH /canchas/{id}/estado` |
| Reservas de cancha | `POST /canchas/reservas` · `GET /canchas/reservas/{id}` · `GET /canchas/reservas/usuario/{usuarioId}` · `PATCH /canchas/reservas/{id}/cancelar` |
| Clases | `POST /clases` · `GET /clases` · `GET /clases/{id}` · `POST /clases/reservas` · `GET /clases/reservas/usuario/{usuarioId}` · `PATCH /clases/reservas/{id}/cancelar` · `POST /clases/lista-espera` · `GET /clases/{id}/lista-espera` |
| Pagos | `POST /pagos` · `GET /pagos/{id}` · `GET /pagos/{id}/comprobante` · `GET /pagos/usuario/{usuarioId}` |
| Reportes | `GET /reportes/ocupacion?anio=&mes=` |

## Reglas de negocio destacadas

- **RN-02 · Sin sobreventa de canchas.** Si dos personas reservan la misma cancha en el mismo horario, solo una lo logra. Lo garantiza PostgreSQL con un índice único parcial (`uq_reserva_cancha_turno_activo`); la API responde **409** a la segunda.
- **RN-03 · Socios al día.** Solo un socio con la membresía activa puede reservar clases y tener el descuento en canchas; un socio vencido paga como cliente externo.
- **RF-11 · Precio dinámico de canchas.** Precio base, **−15 %** para socios y **+20 %** entre las 19 y las 21 hs. El recargo se calcula sobre el precio ya descontado.
- **RF-08 · Lista de espera.** Cuando alguien cancela una reserva de clase, se avisa al primero de la lista de espera.
- **RF-04 · QR de acceso.** Firmado con HMAC y válido por un minuto: una captura de pantalla vieja deja de servir.

## Patrones de diseño

| Patrón | Para qué | Dónde |
|---|---|---|
| **Strategy** | Precio dinámico de canchas (RF-11): cada regla es una estrategia y el `Tarifador` las aplica en orden | `src/modules/canchas/strategies/` |
| **Repository** | Aislar la base de datos en Reserva de cancha y Membresía; traducir el error de RN-02 a un 409 | `src/modules/canchas/repositorio/` · `src/modules/membresias/repositorio/` |
| **Observer** | Avisar a la lista de espera cuando se libera un cupo, sin acoplar la cancelación al aviso (RF-08) | `src/common/bus-eventos.js` · `src/modules/clases/observer/` |
| **CQRS (nivel 2)** | El tablero del gerente lee con SQL propio, sin pasar por el modelo de escritura | `src/modules/reportes/` |

Por qué estos y por qué no otros (Builder, State, Decorator, Chain of Responsibility, entre otros): ver [`docs/adr/ADR-007-patrones-unidad-iii.md`](docs/adr/ADR-007-patrones-unidad-iii.md).

## Documentación

| Documento | Contenido |
|---|---|
| [`docs/LOG.md`](docs/LOG.md) | Bitácora del equipo: actividades, decisiones y problemas por integrante y unidad |
| [`docs/adr/`](docs/adr/README.md) | Registro de decisiones de arquitectura (ADR-001 a ADR-007) |
| [`docs/esquema-base.sql`](docs/esquema-base.sql) | Script para crear la base completa en Supabase |
| [`docs/trigger-cupos-clases.sql`](docs/trigger-cupos-clases.sql) | Solo el trigger de cupos, para bases ya existentes |

Todos los ADR del equipo (Unidades I, II y III) están en [`docs/adr/`](docs/adr/README.md), con su índice.
