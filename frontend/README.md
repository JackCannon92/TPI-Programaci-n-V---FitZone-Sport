# FitZone Sports — Aplicación Web

Frontend en HTML, CSS y JavaScript vanilla (sin frameworks, ver ADR-006 y ADR-012). Habla con la API del backend en `http://localhost:3000/api` (se cambia en `services/api.js`).

## Cómo abrirla

- **Con Docker** (desde la raíz del repositorio): `docker compose up --build` y abrir http://localhost:8080.
- **Sin Docker:** levantar el backend (en `backend/`, `npm start`), abrir la carpeta `frontend/src` en VS Code y, con clic derecho en `portal/index.html`, **Open with Live Server**.

Después, ingresar con el DNI de un usuario de prueba (ver el README de la raíz) o crear uno desde "Crear usuario".

## Pantallas

| Pantalla | Archivo | Qué hace | Requerimientos |
|---|---|---|---|
| Ingresar / Crear usuario | `portal/index.html`, `portal/registro.html` | Ingreso por DNI y alta de socios o clientes externos | RF-01 |
| Inicio | `portal/dashboard.html` | Membresía, próximas reservas y aforo de la sede | RF-02, RF-05 |
| Reservar cancha | `portal/reservar.html` | Grilla de turnos, precio dinámico con su detalle, pago y QR de ingreso | RF-10, RF-11, RF-13, RN-02 |
| Clases | `portal/clases.html` | Reservar lugar, lista de espera y QR de asistencia | RF-06 a RF-08, RN-03 |
| Mis reservas | `portal/mis-reservas.html` | Pagar lo pendiente, cancelar, QR, comprobante PDF e historial de pagos | RF-14 |
| Mi acceso | `portal/acceso.html` | QR del socio que cambia cada minuto y QR sin conexión; el externo ve el QR de sus reservas | RF-04, ADR-016 |
| Recepción | `admin/recepcion.html` | Escanea cualquier QR (cámara o código pegado), registra ingreso y salida, aforo en vivo | RF-04, RF-05, RN-01, ADR-016 |
| Gestión | `admin/gestion.html` | Alta de sedes, canchas y clases; cancha en mantenimiento | RF-12 |
| Usuarios | `admin/usuarios.html` | Listado con búsqueda y estado de la membresía | RF-02 |

## Estructura

```
src/
├── index.html                   Entrada: lleva al ingreso del portal
├── portal/                      Portal responsive del socio y del cliente externo
│   ├── index.html · login.js    Ingreso por DNI
│   ├── registro.html · registro.js
│   ├── dashboard.html · dashboard.js
│   ├── reservar.html · reservar.js
│   ├── clases.html · clases.js
│   ├── mis-reservas.html · mis-reservas.js
│   └── acceso.html · acceso.js
├── admin/                       Consola de administración
│   ├── recepcion.html · recepcion.js   Lector de QR, aforo y terminal sin conexión (ADR-007)
│   ├── gestion.html · gestion.js       Sedes, canchas y clases
│   └── usuarios.html · usuarios.js
├── components/                  Piezas de interfaz compartidas
│   ├── styles.css               Estilos (azul tinta + coral, tipografía Barlow)
│   ├── ui.js                    Barra de navegación, formatos, avisos, modal y el "pase" del QR
│   └── reservas-comun.js        Pago y QR compartidos por Reservar, Mis reservas, Clases y Mi acceso
├── services/                    Capa de servicio
│   ├── api.js                   Todas las llamadas a la API
│   └── terminal-offline.js      Clave pública, cola de ingresos y sincronización (ADR-007)
└── store/
    └── sesion.js                Estado global: la sesión (el backend no tiene contraseñas)
```

## Notas

- La pasarela de pago es simulada: cualquier tarjeta sirve, salvo las terminadas en 0000, que se rechazan.
- Recepción y Gestión se muestran a todos los usuarios porque todavía no hay roles con contraseña; cuando el backend tenga autenticación, se ocultan según el rol (RECEPCIONISTA, GERENTE).
- El lector de QR por cámara usa la librería jsQR desde un CDN (necesita internet). Sin internet se puede pegar el código.
