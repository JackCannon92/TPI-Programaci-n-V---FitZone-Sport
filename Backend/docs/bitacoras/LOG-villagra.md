# Bitácora — Santiago Agustín Villagra — Frontend Developer

**Unidad a cargo:** IV (Componentes, Aplicación Web) · **Liderazgo:** Sprint 3 (semanas 5 y 6) y Sprint 6 (semanas 11 y 12)

> **Nota sobre los commits:** El código inicial del proyecto se subió de manera unificada el 15/10 (commit `ef6fd8a`), por lo que el trabajo de maquetado e integración del frontend de octubre quedó agrupado bajo ese hash. A partir de noviembre, las entregas documentales se registran con su commit individual.

## Sprint 1 — Unidad I (Arquitectura y Patrones) — Semana del 2026-08-24
### 2026-08-29 · 4 h
**Actividad**
Revisamos en equipo el material teórico de la Unidad I usando Gemini como apoyo —verificando cada observación contra los archivos del proyecto antes de aplicarla— y definimos la estructura base del frontend.
**Decisión**
Optamos por armar la aplicación web en JavaScript Vanilla multipágina en lugar de React u otro framework, evitando que la configuración de empaquetadores consumiera tiempo de cursada y enfocando el esfuerzo en la arquitectura. Ver ADR-006.
**Problema o bloqueo**
Al no usar un framework, no había componentes reactivos ni manejo de estado integrado. Se acordó separar cada vista en su propio HTML y JS, dejando las funciones comunes en archivos compartidos.
**Commits**
`fd81941` formaliza ADR-006 sobre arquitectura frontend

---

## Sprint 3 — Unidad IV (Componentes - App Web) — Semana del 2026-09-28
### 2026-10-05 · 8 h
**Actividad**
Liderazgo del Sprint 3 (semanas 5 y 6). Armé la estructura base en HTML, CSS y JS del frontend: pantalla de ingreso por DNI (`js/sesion.js`), panel principal, listado de usuarios y formulario de registro de socios.
**Decisión**
Persistencia de la sesión del usuario activo en `sessionStorage` para mantenerla al navegar entre pantallas, y cálculo de fechas de vencimiento de membresía directamente en el navegador replicando la regla del backend (mensual +1 mes, trimestral +3, anual +12).
**Problema o bloqueo**
Surgieron tres limitaciones en el backend durante esta etapa: no había usuarios con contraseña para un login real, faltaba un endpoint de búsqueda por DNI y la ruta para calcular vencimientos no estaba conectada. Lo resolví implementando el ingreso por DNI (documentado como limitación en `js/sesion.js`), trayendo la lista de usuarios para filtrarla en el navegador —suficiente para el volumen del TPI, aunque queda anotado para pedir el endpoint— y calculando las fechas en el front, asumiendo el riesgo de duplicar esa regla si luego cambia en el servidor.
**Commits**
`ef6fd8a` estructura base HTML/CSS/JS, ingreso por DNI, panel y gestión de usuarios

---

## Sprint 4 — Unidad IV (Componentes) — Semana del 2026-10-05
### 2026-10-12 · 7 h
**Actividad**
Modularización de la interfaz compartida (`js/ui.js`) y armado de las pantallas de reserva de canchas y de clases.
**Decisión**
Extraje las piezas visuales repetidas (barra de navegación, avisos y formateo de fechas y precios) a un archivo común (`js/ui.js`), dejando cada pantalla con su propio HTML y JS.
**Problema o bloqueo**
Sin un framework de componentes, cada pantalla nueva obligaba a repetir el mismo código HTML para el encabezado y las notificaciones. Separar esos bloques en `js/ui.js` permitió ordenar manualmente lo que un framework ya trae resuelto.
**Commits**
`ef6fd8a` modularización de interfaz en js/ui.js y pantallas de reservas

---

## Sprint 5 — Unidad IV (Componentes y Servicios) — Semana del 2026-10-19
### 2026-10-27 · 6 h
**Actividad**
Implementación de la capa de servicio del frontend (`js/api.js`) para conectar las vistas con la API real, y participación en el check-in con la cátedra del 27/10 para transmitirle al equipo las indicaciones recibidas (enviar el plan en Google Sheets por mail, quitar CQRS, hacer un ADR por patrón y contemplar el uso de más de un QR).
**Decisión**
Centralicé todas las llamadas `fetch` y la URL base del servidor en un único archivo (`js/api.js`) para no tener direcciones sueltas por cada pantalla.
**Problema o bloqueo**
Como el frontend corre con Live Server en un puerto distinto al de la API en Node, el navegador bloqueaba las peticiones por política CORS. Se solucionó habilitando CORS en el backend y canalizando todas las consultas a través de `js/api.js`.
**Commits**
`ef6fd8a` capa de servicio js/api.js e integración con backend

---

## Sprint 6 — Documentación Arquitectónica — Semana del 2026-11-02
### 2026-11-08 · 6 h
**Actividad**
Inicio del liderazgo del Sprint 6 (semanas 11 y 12). Redacté y formalicé en Markdown los registros de decisión arquitectónica ADR-006 (frontend vanilla), ADR-007 (sincronización del terminal de sede) y ADR-010 (tokenización de pagos) siguiendo la plantilla del Anexo B.
**Decisión**
Documentación de las alternativas descartadas, los criterios de decisión y la deuda técnica asumida por el equipo en cada ADR, ajustando la numeración del ADR de pagos a ADR-010 según lo acordado. Ver ADR-006, ADR-007 y ADR-010.
**Problema o bloqueo**
Los borradores iniciales omitían campos obligatorios del Anexo B (autor, sprint, tabla comparativa completa y deuda asumida) y tenían fechas desfasadas respecto a cuándo se tomaron realmente las decisiones. Revisé el historial del equipo para corregir las fechas y reestructuré los tres documentos antes de subirlos.
**Commits**
`fd81941`, `848a154` agrega y actualiza ADR-006, ADR-007 y ADR-010 en docs/adr/