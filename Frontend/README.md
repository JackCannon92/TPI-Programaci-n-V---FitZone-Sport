# FitZone Sports — Aplicación Web

Frontend en HTML, CSS y JavaScript vanilla (sin frameworks, ver ADR-006 y ADR-012). Habla con la API del backend en `http://localhost:3000/api` (se cambia en `js/api.js`).

## Cómo abrirla

1. Levantar el backend: en la carpeta `Backend`, `npm start`.
2. Abrir esta carpeta en VS Code, clic derecho en `index.html` → **Open with Live Server**.
3. Ingresar con el DNI de un usuario (o crear uno desde "Crear usuario").

## Pantallas

| Pantalla | Archivo | Qué hace | Requerimientos |
|---|---|---|---|
| Ingresar / Crear usuario | `index.html`, `registro.html` | Ingreso por DNI y alta de socios o clientes externos | RF-01 |
| Inicio | `dashboard.html` | Membresía, próximas reservas y aforo de la sede | RF-02, RF-05 |
| Reservar cancha | `reservar.html` | Grilla de turnos, precio dinámico con su detalle, pago y QR de ingreso | RF-10, RF-11, RF-13, RN-02 |
| Clases | `clases.html` | Reservar lugar, lista de espera y QR de asistencia | RF-06 a RF-08, RN-03 |
| Mis reservas | `mis-reservas.html` | Pagar lo pendiente, cancelar, QR, comprobante PDF e historial de pagos | RF-14 |
| Mi acceso | `acceso.html` | QR del socio que cambia cada minuto y QR sin conexión; el externo ve el QR de sus reservas | RF-04, ADR-016 |
| Recepción | `recepcion.html` | Escanea cualquier QR (cámara o código pegado), registra ingreso y salida, aforo en vivo | RF-04, RF-05, RN-01, ADR-016 |
| Gestión | `gestion.html` | Alta de sedes, canchas y clases; cancha en mantenimiento | RF-12 |
| Usuarios | `usuarios.html` | Listado con búsqueda y estado de la membresía | RF-02 |

## Estructura

```
css/styles.css          Estilos (identidad del comprobante: azul tinta + coral, tipografía Barlow)
js/api.js               Capa de servicio: todas las llamadas a la API
js/sesion.js            Sesión liviana (el backend todavía no tiene contraseñas)
js/ui.js                Barra de navegación, formatos, avisos, modal y el "pase" del QR
js/reservas-comun.js    Pago y QR compartidos por Reservar y Mis reservas
js/<pantalla>.js        Lógica de cada pantalla
```

## Notas

- La pasarela de pago es simulada: cualquier tarjeta sirve, salvo las terminadas en 0000, que se rechazan.
- Recepción y Gestión se muestran a todos los usuarios porque todavía no hay roles con contraseña; cuando el backend tenga autenticación, se ocultan según el rol (RECEPCIONISTA, GERENTE).
- El lector de QR por cámara usa la librería jsQR desde un CDN (necesita internet). Sin internet se puede pegar el código.
