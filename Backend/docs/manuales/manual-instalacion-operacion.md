# Manual de instalación y operación — FitZone Sports

- **Autor:** Sirizzotti, Martín Emiliano
- **Fecha:** 17/11/2026 · **Versión:** 1.0
- **Alcance:** cómo instalar, configurar, desplegar, respaldar y operar el sistema. Sigue el índice del Anexo E de los lineamientos de entrega.
- **Relacionado:** ADR-002 (base de datos), ADR-003 y ADR-007 (operación sin conexión), ADR-008 (pruebas), ADR-009 (despliegue y reversión).

> Este manual se redactó con ayuda de IA (Claude) y se verificó contra el código y la configuración del repositorio. Cada comando se probó en el entorno de desarrollo; donde algo no está probado o no está implementado, se indica.

---

## 1. Requisitos previos · Versiones exactas de software

### Para levantar todo con Docker (recomendado)

| Software | Versión | Para qué |
|---|---|---|
| Docker Desktop (Windows o macOS) o Docker Engine (Linux) | Docker 24 o superior, con Compose v2 (`docker compose`) | Levantar base, API y aplicación web |
| Git o GitHub Desktop | Git 2.40 o superior | Clonar el repositorio |
| Navegador | Chrome, Edge o Firefox actualizados | Usar la aplicación web y Swagger |

En Windows, Docker Desktop necesita WSL 2 activado (el instalador lo ofrece).

Las imágenes que descarga el `docker-compose.yml` son:

| Servicio | Imagen |
|---|---|
| `db` | `postgres:16-alpine` |
| `api` | se construye desde `Backend/Dockerfile`, basada en `node:20-alpine` |
| `web` | `nginx:1.27-alpine` |

### Para levantar el backend sin Docker

| Software | Versión |
|---|---|
| Node.js | 20 LTS (la misma que usa la imagen de Docker) |
| npm | 10 (viene con Node 20) |
| PostgreSQL | 16, propio o en Supabase |

### Dependencias del backend (versiones instaladas, de `Backend/package-lock.json`)

| Paquete | Versión | Uso |
|---|---|---|
| express | 5.2.1 | Servidor HTTP y rutas |
| sequelize | 6.37.8 | ORM |
| pg | 8.23.0 | Driver de PostgreSQL |
| express-validator | 7.3.2 | Validación de las entradas |
| swagger-jsdoc / swagger-ui-express | 6.3.0 / 5.0.1 | Documentación OpenAPI en `/api-docs` |
| pdfkit | 0.20.2 | Comprobantes en PDF |
| qrcode | 1.5.4 | Imágenes de los códigos QR |
| cors | 2.8.6 | Permite que la aplicación web llame a la API |
| dotenv | 17.4.2 | Lee el archivo `.env` |
| jest / supertest | 29.7.0 / 7.3.1 | Pruebas (solo desarrollo) |
| nodemon | 3.1.14 | Reinicio automático en desarrollo |

---

## 2. Puesta en marcha en entorno de desarrollo

### 2.1 Con Docker

```bash
git clone https://github.com/JackCannon92/TPI-Programaci-n-V---FitZone-Sport.git
cd TPI-Programaci-n-V---FitZone-Sport
docker compose up --build
```

La primera vez tarda unos minutos (descarga las imágenes e instala las dependencias). Cuando termina:

| Qué | Dirección |
|---|---|
| Aplicación web | http://localhost:8080 |
| API | http://localhost:3000/api/v1 |
| Documentación de la API (Swagger) | http://localhost:3000/api-docs |
| Estado de la API | http://localhost:3000/api/health |

Al crearse la base por primera vez se ejecutan solos los scripts de `Backend/db/` (sección 5). Para ingresar se usa el DNI de los usuarios de prueba (tabla en el `README.md` de la raíz), por ejemplo `30111222` para la socia al día.

Sin un archivo `.env` en la raíz, el `docker-compose.yml` usa claves de desarrollo. Sirven para probar, **nunca** para producción.

Comandos útiles:

```bash
docker compose ps                # estado de los tres contenedores
docker compose logs -f api       # registros de la API en vivo
docker compose down              # bajar todo (los datos quedan en el volumen)
docker compose down -v           # bajar todo y BORRAR la base (se recarga el seed al volver a levantar)
```

### 2.2 Sin Docker

1. Crear la base. En Supabase: abrir el **SQL Editor**, pegar y ejecutar `Backend/db/01-esquema.sql` y después `Backend/db/02-seed.sql`. En un PostgreSQL propio, lo mismo con `psql -f`.
2. Configurar e instalar el backend:

   ```bash
   cd Backend
   npm install
   cp .env.example .env     # en Windows: copy .env.example .env
   ```

   Completar en `.env` al menos `DATABASE_URL` y `QR_SECRET` (sección 4). Con un PostgreSQL local, poner `DB_SSL=false`.
3. Levantar la API:

   ```bash
   npm start          # o npm run dev, que se reinicia solo al guardar
   ```

   En la consola tiene que aparecer «Conexión a PostgreSQL establecida con éxito».
4. Abrir la aplicación web: `Frontend/index.html` con Live Server (extensión de VS Code) o cualquier servidor estático. La aplicación llama a `http://localhost:3000/api` (se cambia en `Frontend/js/api.js`, constante `API_BASE_URL`).

### 2.3 Pruebas

```bash
cd Backend
npm test            # 100 pruebas (unitarias e integración), no necesitan base de datos
npm run test:cov    # además, reporte de cobertura en Backend/coverage/ (umbral: 70 % de líneas, 50 % de ramas)
```

---

## 3. Puesta en marcha en entorno de producción

> **Estado:** el sistema no está desplegado en un servidor de producción. Este procedimiento es el previsto por el ADR-009 y se probó solo en el entorno de pruebas del pipeline (el propio runner de GitHub Actions).

1. Un servidor Linux con Docker y Compose v2, con los puertos 80 y 443 abiertos.
2. Clonar el repositorio en la versión etiquetada que se quiere desplegar:

   ```bash
   git clone https://github.com/JackCannon92/TPI-Programaci-n-V---FitZone-Sport.git fitzone
   cd fitzone
   git checkout v1.0-entrega
   ```

3. Crear el `.env` de la raíz a partir de `.env.example`, con claves largas y únicas (sección 4). `URL_PUBLICA` tiene que ser la dirección real de la API, porque va impresa en el QR del comprobante.
4. Levantar: `docker compose up -d --build`.
5. Poner delante un proxy inverso con HTTPS (por ejemplo nginx o Caddy con un certificado de Let's Encrypt) que redirija el dominio a los puertos 8080 (web) y 3000 (API). **No implementado:** hoy el compose expone HTTP plano.
6. Ajustes que faltan para producción y no están hechos:
   - la API acepta pedidos de cualquier origen (`app.use(cors())` en `src/app.js`); en producción hay que limitarlo al dominio de la aplicación web;
   - el sistema todavía no tiene autenticación con contraseña: se ingresa por DNI (simulación documentada);
   - si la base está en Supabase en lugar del contenedor `db`, se usa `DATABASE_URL` de Supabase con `DB_SSL=true` y se quita el servicio `db` del compose.

---

## 4. Variables de entorno: tabla completa

Hay dos archivos `.env`, cada uno con su `.env.example`. **Los `.env` no se suben al repositorio** (están en `.gitignore`).

### 4.1 `.env` de la raíz (lo lee el `docker-compose.yml`)

| Variable | Obligatoria | Valor por defecto | Descripción |
|---|---|---|---|
| `POSTGRES_PASSWORD` | No (sí en producción) | `fitzone_local` | Contraseña del PostgreSQL del contenedor `db`. El compose la usa también para armar el `DATABASE_URL` de la API. |
| `QR_SECRET` | No (sí en producción) | `solo-para-desarrollo-cambiar` | Clave con la que se firman los QR (HMAC) y de la que se deriva la clave del QR sin conexión. |
| `URL_PUBLICA` | No | `http://localhost:3000` | Dirección pública de la API; va en el QR de verificación del comprobante. |

### 4.2 `Backend/.env` (lo lee la API cuando corre sin Docker)

| Variable | Obligatoria | Valor por defecto | Descripción |
|---|---|---|---|
| `PORT` | No | `3000` | Puerto de la API. |
| `DATABASE_URL` | **Sí** | — | Cadena de conexión de PostgreSQL. Supabase: la del *connection pooler*. Local: `postgres://usuario:clave@localhost:5432/fitzone`. |
| `DB_SSL` | No | `true` | `true` para Supabase (exige SSL); `false` para un PostgreSQL local o el del compose. |
| `QR_SECRET` | Sí en producción | `fitzone-dev-secret-cambiar-en-produccion` | Igual que en 4.1. Si se cambia, los QR ya emitidos dejan de valer. |
| `URL_PUBLICA` | No | `http://localhost:3000` | Igual que en 4.1. |
| `QR_OFFLINE_SEMILLA` | No | se deriva de `QR_SECRET` | Semilla del par de claves Ed25519 del QR sin conexión (ADR-003). Si se cambia, cambia la clave pública y hay que volver a cargarla en los terminales de sede. |

Dentro del contenedor `api`, el compose fija además `DB_SSL=false` y `TZ=America/Argentina/Buenos_Aires` (los horarios de los turnos y de las clases se calculan en hora argentina).

---

## 5. Base de datos: migraciones, reversión y datos semilla

### 5.1 Scripts

| Archivo | Qué hace |
|---|---|
| `Backend/db/01-esquema.sql` | Crea las 11 tablas con sus claves, restricciones `CHECK`, el índice único parcial `uq_reserva_cancha_turno_activo` (RN-02), el trigger que descuenta los cupos de las clases e índices de consulta. |
| `Backend/db/02-seed.sql` | Datos de prueba: 25 sedes, canchas de pádel y fútbol (una en mantenimiento), 3 clases por sede para el día siguiente, una clase de cupo reducido para probar la lista de espera, un usuario por cada uno de los cuatro roles, un socio en mora y 20 socios más. Las fechas son relativas a «hoy». |
| `Backend/docs/trigger-cupos-clases.sql` | Solo el trigger de cupos, para bases creadas antes de que estuviera en el esquema. |

Con Docker, PostgreSQL ejecuta los scripts de `Backend/db/` en orden alfabético **solo la primera vez**, cuando el volumen `datos-db` está vacío. Si el volumen ya existe, no se vuelven a ejecutar.

Para empezar de cero (borra todos los datos):

```bash
docker compose down -v
docker compose up --build
```

### 5.2 Migraciones

El proyecto no usa una herramienta de migraciones: el esquema completo está versionado en un único script (ADR-002) y Sequelize **no** crea ni modifica tablas (`sync` está desactivado a propósito). Un cambio de esquema se hace así:

1. Se escribe un script nuevo con el cambio (por ejemplo `03-tenis.sql` con un `ALTER TABLE`) y se aplica a la base en uso.
2. Se actualiza `01-esquema.sql` para que una base nueva nazca con el cambio.
3. Ejemplo real: para habilitar canchas de tenis, la restricción se reemplaza con

   ```sql
   ALTER TABLE canchas DROP CONSTRAINT canchas_tipo_check;
   ALTER TABLE canchas ADD CONSTRAINT canchas_tipo_check CHECK (tipo IN ('FUTBOL', 'PADEL', 'TENIS'));
   ```

### 5.3 Reversión de un cambio de base

Los cambios de esquema se escriben **solo agregando** (columnas o tablas nuevas, restricciones más amplias), nunca borrando ni renombrando en el mismo despliegue. Así, si hay que volver a la versión anterior de la API, esa versión sigue funcionando con la base nueva. Si un cambio igual sale mal, se restaura el respaldo tomado antes de aplicarlo (sección 7).

---

## 6. Despliegue: estrategia adoptada y procedimiento de reversión

### 6.1 Estrategia (ADR-009)

Cada push a `main` y cada Pull Request dispara el pipeline de GitHub Actions (`.github/workflows/ci.yml`), que se puede seguir en la pestaña **Actions** del repositorio:

| Etapa | Qué hace | Si falla |
|---|---|---|
| 1 · Pruebas y cobertura | `npm ci`, `npm run test:cov` con el umbral del ADR-008 y verifica que `swagger.json` esté al día | No se construye nada |
| 2 · Imagen de Docker | Construye la imagen de la API etiquetada con el hash del commit | No se despliega |
| 3 · Entorno de pruebas | Levanta el `docker compose` completo y hace una prueba de humo: `/api/health`, que el seed haya cargado al menos 25 sedes y que responda la aplicación web | Muestra los registros de los contenedores |

Cada versión entregada se marca con un tag anotado:

```bash
git tag -a v1.0-entrega -m "Entrega del TIF"
git push origin v1.0-entrega
```

### 6.2 Procedimiento de reversión

Si una versión desplegada falla:

1. **Volver a la versión anterior** en el servidor, sin tocar la base:

   ```bash
   git fetch --tags
   git checkout v1.0-entrega          # la última versión que funcionaba
   docker compose up -d --build api web
   ```

2. **Deshacer el cambio en `main`** sin reescribir el historial:

   ```bash
   git revert <hash-del-commit-que-rompió>
   git push
   ```

   El pipeline vuelve a verificar `main`. En GitHub Desktop: pestaña **History**, clic derecho en el commit, **Revert changes in commit**.
3. Si el problema fue un cambio de base, restaurar el respaldo previo (sección 7).

---

## 7. Respaldo y restauración

### 7.1 Base en el contenedor de Docker

Respaldo (genera `respaldo.sql` en la carpeta actual):

```bash
docker compose exec db pg_dump -U fitzone -d fitzone --clean --if-exists -f /tmp/respaldo.sql
docker compose cp db:/tmp/respaldo.sql ./respaldo.sql
```

Restauración (reemplaza el contenido actual por el del respaldo):

```bash
docker compose cp ./respaldo.sql db:/tmp/respaldo.sql
docker compose exec db psql -U fitzone -d fitzone -f /tmp/respaldo.sql
```

`--clean --if-exists` hace que el respaldo borre y recree cada objeto, así se puede restaurar sobre una base que ya tiene datos. En Windows conviene usar estos comandos (con `-f` y `docker compose cp`) en lugar de redirigir la salida con `>`, porque PowerShell puede cambiar la codificación del archivo.

Se recomienda un respaldo antes de cada despliegue y antes de cualquier cambio de esquema.

### 7.2 Base en Supabase

Supabase hace copias diarias en su panel (**Database → Backups**; la cantidad de días depende del plan). Para un respaldo propio: `pg_dump "<DATABASE_URL>" --clean --if-exists -f respaldo.sql` desde una máquina con el cliente de PostgreSQL 16.

---

## 8. Operación degradada: caída de la conexión principal y resincronización

| Situación | Qué pasa | Estado |
|---|---|---|
| Cae la conexión entre una sede y el servidor central | El socio activo tiene en «Mi acceso → Sin conexión» un QR firmado con Ed25519 que vale 24 horas (o hasta que vence su membresía). Ese QR se valida con la clave pública, sin consultar la base (ADR-003). | Firma y validación implementadas en el backend (`qr-offline.js`, `GET /api/v1/acceso/clave-publica`, `POST /api/v1/acceso/validar-offline`) |
| Validación en el terminal sin red | El terminal de recepción tiene que verificar la firma localmente con la clave pública guardada. | **Pendiente:** hoy la pantalla de Recepción valida el QR sin conexión llamando a `POST /acceso/validar-offline`, o sea, necesita llegar a la API |
| Vuelve la conexión | El terminal envía los ingresos anotados durante el corte a `POST /api/v1/acceso/sincronizar`; los conflictos con RN-01 se registran igual y se marcan para revisión (ADR-007). | **Pendiente de implementar** (ADR-007) |
| Se cae la API o la base | La aplicación web muestra el error de conexión. Con Docker, el contenedor `api` se reinicia solo (`restart: on-failure`); el contenedor `db` tiene control de estado (`pg_isready`). | Implementado |
| Supabase pausa el proyecto (plan gratuito, una semana sin uso) | La API no arranca: «tenant/user not found». | Se reactiva el proyecto desde el panel de Supabase, o se usa la base del compose |

Para verificar que un QR sin conexión es válido mientras la API responde: en Recepción, pegar o escanear el código; la pantalla indica «Válido sin conexión» y hasta cuándo vale.

Si se cambia `QR_SECRET` o `QR_OFFLINE_SEMILLA`, cambia la clave pública: los QR sin conexión emitidos antes dejan de valer y hay que volver a descargar la clave en los terminales.

---

## 9. Alta de una sede nueva sin detener el sistema

Una sede es un registro en la tabla `sedes`: se agrega en caliente, sin reiniciar ni volver a desplegar (RNF-04, ADR-001).

**Desde la aplicación web:** pantalla **Gestión → Sedes**, completar nombre, dirección y aforo máximo. Después, en la misma pantalla, cargar sus canchas y sus clases.

**Desde la API** (o desde Swagger, en `/api-docs`):

```bash
# 1. La sede (nombre de 2 a 80 caracteres, aforo entero mayor o igual a 1)
curl -X POST http://localhost:3000/api/v1/sedes \
  -H "Content-Type: application/json" \
  -d '{"nombre": "FitZone Concordia Sur", "direccion": "Av. Monseñor Rösch 1200", "aforoMaximo": 90}'

# 2. Sus canchas (con el id que devolvió el paso 1; tipo FUTBOL o PADEL)
curl -X POST http://localhost:3000/api/v1/canchas \
  -H "Content-Type: application/json" \
  -d '{"sedeId": "<id-de-la-sede>", "nombre": "Pádel 1", "tipo": "PADEL", "precioHora": 8000}'

# 3. Sus clases
curl -X POST http://localhost:3000/api/v1/clases \
  -H "Content-Type: application/json" \
  -d '{"sedeId": "<id-de-la-sede>", "tipo": "Funcional", "instructor": "Laura Méndez", "fechaHora": "2026-11-25T09:00:00-03:00", "capacidadMaxima": 20}'
```

La sede aparece de inmediato en la aplicación web. Para su terminal de recepción, alcanza con abrir la pantalla de Recepción y elegir la sede.

---

## 10. Monitoreo: registros, métricas y verificación de estado

| Qué | Cómo |
|---|---|
| Estado de la API | `GET /api/health` responde `200` si la API está levantada. El `Dockerfile` lo usa como control de estado del contenedor. |
| Estado de los contenedores | `docker compose ps` (columna *STATUS*: `healthy`, `running`, `restarting`). |
| Registros | `docker compose logs -f api` (o la consola donde corre `npm start`). La API registra el arranque, la conexión a la base, los errores no controlados y los avisos a la lista de espera. |
| Aforo de cada sede | `GET /api/v1/acceso/aforo/{sedeId}` y la pantalla de Recepción, que se actualiza cada 15 segundos. |
| Personas adentro | `GET /api/v1/acceso/presentes/{sedeId}`. |
| Calidad del código | Pestaña **Actions** de GitHub (resultado de cada push) y el reporte de cobertura que el pipeline guarda como artefacto. |

**No implementado:** métricas de rendimiento (tiempos de respuesta, uso de memoria) y alertas automáticas. Para producción se sumaría un recolector de métricas y registros estructurados (por ejemplo en JSON) en lugar de mensajes de consola.

---

## 11. Resolución de problemas de instalación

Problemas que el equipo encontró de verdad durante el desarrollo, y su solución:

| Síntoma | Causa | Solución |
|---|---|---|
| `Error: Cannot find module ...` (`MODULE_NOT_FOUND`) al hacer `npm start` | Faltan las dependencias | `npm install` dentro de `Backend` |
| «`nodemon` no se reconoce como un comando» | No estaba instalado | `npm install` (está como dependencia de desarrollo) o usar `npm start` |
| `tenant/user postgres.xxxx not found` (`ENOTFOUND`) | El proyecto de Supabase se pausó por falta de uso | Reactivarlo en el panel de Supabase |
| `The server does not support SSL connections` | `DB_SSL=true` contra un PostgreSQL local | Poner `DB_SSL=false` en `Backend/.env` |
| `default for column "rol" cannot be cast automatically to type enum` | Se intentó crear las tablas con `sequelize.sync({ alter: true })` | No usar `sync`: crear la base con `Backend/db/01-esquema.sql` |
| `Error: listen EADDRINUSE :::3000` | Otro programa usa el puerto 3000 (por ejemplo otra API levantada) | Cerrarlo, o cambiar `PORT` en `.env` (y el puerto en `Frontend/js/api.js`) |
| Docker levanta pero no hay sedes ni usuarios | El volumen `datos-db` ya existía, así que no se ejecutaron los scripts | `docker compose down -v` y volver a levantar |
| Las clases o los turnos aparecen 3 horas corridos | La base o la API corren en hora UTC | Con Docker ya se fija `TZ`; sin Docker, revisar la zona horaria del servidor de base de datos |
| Una reserva responde `409` | Es RN-02 funcionando: ese turno ya está tomado | Elegir otro horario |
| La aplicación web muestra «No se pudo conectar con el servidor» | La API no está levantada o la URL no coincide | Verificar `http://localhost:3000/api/health` y `API_BASE_URL` en `Frontend/js/api.js` |
| Docker Desktop no arranca en Windows | Falta WSL 2 o la virtualización está desactivada | Instalar WSL 2 (`wsl --install`) y activar la virtualización en la BIOS |
| Git avisa «LF will be replaced by CRLF» | Diferencia de finales de línea entre Windows y Linux | Es solo un aviso; Git lo maneja solo |
