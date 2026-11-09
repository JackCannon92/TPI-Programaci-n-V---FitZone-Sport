# Bitácora — Santiago Agustín Villagra — Rol Frontend Developer

> **Nota sobre los commits:** Todo el código inicial del proyecto se subió de una sola vez al repositorio actual el 15/10 (commit `ef6fd8a`). Por lo tanto, el trabajo de maquetado y componentes de los primeros Sprints está unificado en ese hash. Desde el 05/11 subo cada cambio funcional en un commit separado desde mi cuenta.

## Sprint 1 — Unidad I (Arquitectura y Patrones) — Semana del 2026-08-24
### 2026-08-28 · 5 h
**Actividad**
Análisis colaborativo de los requerimientos funcionales (RF-01 a RF-14) y estudio del material teórico del frontend junto al equipo.
**Decisión**
Se evaluó el uso de React vs. JavaScript Vanilla. Decidimos usar JavaScript Vanilla para evitar la sobrecarga de empaquetadores y herramientas de compilación. Ver ADR-006.
**Problema o bloqueo**
Dudábamos sobre cómo estructurar la reactividad sin un Virtual DOM. Lo resolvimos acordando el uso de manipulación directa del DOM basada en eventos nativos y funciones utilitarias de UI.
**Commits**
`fd81941` agrega ADR-006 sobre arquitectura frontend
---

## Sprint 2 — Unidad II (Backend y Persistencia) — Semana del 2026-09-07
### 2026-09-11 · 6 h
**Actividad**
Maquetado inicial del panel de control (`dashboard.html`) e implementación del cliente de gestión de sesión (`js/sesion.js`).
**Decisión**
Implementar la persistencia del DNI del usuario activo mediante `sessionStorage` para garantizar la navegación entre páginas dentro de la pestaña del navegador.
**Problema o bloqueo**
El backend aún no tenía el módulo de contraseñas/credenciales listo, lo que impedía un flujo de login estándar. Se resolvió creando un esquema de identificación transparente por DNI y documentando la limitación.
**Commits**
`ef6fd8a` Maquetado de dashboard e inicio de sesión por DNI
---

## Sprint 3 — Unidad IV (Componentes - App Web) — Semana del 2026-09-21
### 2026-09-25 · 8 h
**Actividad**
Liderazgo del Sprint 3. Confección de las maquetas e interacción de `index.html`, `registro.html` y `usuarios.html`.
**Decisión**
Definición de los átomos de diseño (paleta de colores, tipografía Barlow y botones) centralizados en `css/styles.css` aplicando el criterio de *Atomic Design*.
**Problema o bloqueo**
La API no tenía un endpoint para buscar usuarios por DNI en el ingreso. Lo resolví consultando la lista general de usuarios y aplicando un filtro en el cliente hasta que el backend desarrolle la ruta.
**Commits**
`ef6fd8a` Maquetado de vistas de ingreso y lista de usuarios
---

## Sprint 4 — Unidad IV (Componentes) — Semana del 2026-10-05
### 2026-10-09 · 7 h
**Actividad**
Desarrollo de la interfaz de reserva de canchas (`reservar.html`, `js/reservar.js`) y catálogo de clases grupales (`clases.html`, `js/clases.js`).
**Decisión**
Extraer los componentes visuales compartidos (encabezado de navegación, avisos de alerta y modales) a un módulo centralizado (`js/ui.js`).
**Problema o bloqueo**
Detecté duplicación masiva de código HTML al armar los modales y las alertas en distintas vistas. Lo resolví creando funciones generadoras dinámicas en `js/ui.js`.
**Commits**
`ef6fd8a` Desarrollo de vistas de reservas y extracción a js/ui.js
---

## Sprint 5 — Unidad IV (Componentes y Servicios) — Semana del 2026-10-19
### 2026-10-23 · 6 h
**Actividad**
Creación del módulo `js/api.js` para abstraer las peticiones HTTP (`fetch`) hacia el backend en un único lugar.
**Decisión**
Centralizar todas las llamadas a la API en `js/api.js` para gestionar errores de red y la URL base (`http://localhost:3000/api`) de forma limpia.
**Problema o bloqueo**
Las peticiones del navegador eran bloqueadas por errores de CORS al correr el frontend en Live Server y el backend en Node (puerto 3000). Se resolvió solicitando la habilitación del middleware CORS en el servidor Express.
**Commits**
`ef6fd8a` Creación del módulo js/api.js e integración CORS
---

## Sprint 6 — Unidad IV (Componentes y Recepción) — Semana del 2026-11-02
### 2026-11-06 · 9 h
**Actividad**
Liderazgo del Sprint 6. Desarrollo de la pantalla de recepción (`recepcion.html`, `js/recepcion.js`) para lectura y validación de códigos QR.
**Decisión**
Cargar la librería `jsQR` dinámicamente desde un CDN solo cuando el recepcionista active la cámara, permitiendo también la opción de pegar el código manualmente.
**Problema o bloqueo**
La cámara re-validaba el mismo código QR múltiples veces por segundo al detectar el stream de video. Lo resolví implementando un control de tiempo (*debounce*) de 4 segundos antes de procesar el mismo token.
**Commits**
`fd81941` agrega ADR-007 sobre control de acceso offline
---

## Sprint 7 — Unidad V (Pasarela de Pagos y Comprobantes) — Semana del 2026-11-09
### 2026-11-13 · 6 h
**Actividad**
Integración del flujo de pagos en `js/reservas-comun.js` y la descarga de comprobantes en `mis-reservas.html`.
**Decisión**
Delegar el procesamiento de tarjetas a la pasarela simulada enviando solo los datos necesarios y guardando únicamente el token devuelto. Ver ADR-010.
**Problema o bloqueo**
El formulario permitía enviar datos vacíos a la pasarela. Se resolvió agregando validaciones de entrada en el cliente para el número de plástico, expiración y CVV.
**Commits**
`fd81941` agrega ADR-010 sobre tokenización de pagos
---

## Sprint 8 — Cierre del Proyecto — Semana del 2026-11-16
### 2026-11-20 · 5 h
**Actividad**
Pruebas integrales de navegación, verificación de la sesión en `sessionStorage` y consolidación de la documentación personal.
**Decisión**
Finalizar y congelar la bitácora individual.
**Problema o bloqueo**
Inconsistencias menores en el formato de moneda y fechas en el listado de reservas. Lo resolví unificando los formateadores en `js/ui.js`.
**Commits**
Pendiente de subir al repositorio
---