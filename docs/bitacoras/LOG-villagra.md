# Bitácora — Santiago Agustín Villagra — Frontend Developer

**Unidad a cargo:** IV (Componentes, Aplicación Web) · **Liderazgo:** check-in del 15/10 (sprint 4). El sprint 6 me correspondía según el plan, pero no tuvo check-in.

> **Nota sobre los commits:** El código inicial del proyecto se subió de manera unificada el 15/10 (`ef6fd8a`) y las pantallas de la segunda iteración el 05/11 (`e8b8d74`). El trabajo de revisión conjunta del frontend realizado en octubre queda referenciado bajo esos commits, mientras que las entregas documentales de noviembre cuentan con su hash individual.

## Sprint 1 — Unidad I (Arquitectura y Patrones) — Semana del 2026-08-27
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

## Sprint 2 — Unidades I y II (Esquema y Módulo 1) — Semana del 2026-09-10
### 2026-09-17 · 0 h
**Actividad**
Sin horas de desarrollo frontend en este sprint. El equipo priorizó el esquema SQL y el Módulo 1 en el backend para tener la base de datos operativa antes de construir las pantallas. El check-in previsto para el 17/09 se suspendió por indisponibilidad del líder de turno y la semana siguiente (22 al 28/09) correspondió a mesa de exámenes.
**Decisión**
Postergar el arranque de la interfaz web hasta contar con el esquema de datos y los endpoints base del backend definidos.
**Problema o bloqueo**
La superposición con la mesa de exámenes y el corrimiento del check-in al 01/10 retrasaron el inicio previsto de los módulos siguientes y del frontend.
**Commits**
—

---

## Sprint 3 — Unidades II y III (Backend Base y Arranque Web) — Semana del 2026-09-24
### 2026-10-01 · 1 h
**Actividad**
Participación en el check-in reprogramado del 01/10 (liderado por Franco) y revisión del alcance de las vistas iniciales del frontend (ingreso por DNI, panel principal y listado de usuarios) cuya estructura base fue implementada por Martín el 02/10.
**Decisión**
Acordamos resolver el acceso inicial mediante ingreso por DNI guardado en `sessionStorage` (`frontend/src/store/sesion.js`), dado que el modelo de datos del caso no contempla contraseñas. Ver ADR-006.
**Problema o bloqueo**
El atraso acumulado en los módulos del backend impidió avanzar con las pantallas de reservas durante esta semana, quedando la integración de vistas complejas para el sprint siguiente.
**Commits**
`ef6fd8a` subida unificada del 15/10 con la estructura base HTML/CSS/JS armada en este sprint

---

## Sprint 4 — Unidad IV (Componentes - Pantallas de Reserva) — Semana del 2026-10-08
### 2026-10-12 · 7 h
**Actividad**
Revisión conjunta por Discord, junto con Martín, de la modularización de la interfaz compartida (`frontend/src/components/ui.js`) y de las pantallas de reserva de canchas y de clases. Martín me iba compartiendo los avances de cada vista y las fuimos corrigiendo contra los criterios de aceptación de la entrega (grilla de turnos, cálculo de tarifas y cupos de clases).
**Decisión**
Mantener centralizadas en `frontend/src/components/ui.js` las piezas visuales repetidas (barra de navegación, alertas y formateo de fechas y precios) y validar en el navegador la regla de cálculo de vencimientos de membresía (mensual +1 mes, trimestral +3, anual +12) junto con la persistencia de sesión en `frontend/src/store/sesion.js`.
**Problema o bloqueo**
Al contrastar las pantallas contra los requisitos funcionales, detectamos inconsistencias en la visualización del desglose de precios (descuento del 15% para socios activos y recargo del 20% en hora pico) y en los mensajes de error cuando un turno o clase no tenía cupo; lo ajustamos sobre el código compartido durante la sesión antes de consolidar la entrega.
**Commits**
`ef6fd8a` subida unificada del 15/10 que contiene estas pantallas y correcciones

### 2026-10-15 · 1 h
**Actividad**
Liderazgo del check-in del 15/10 con la cátedra (correspondiente a mi turno en la rotación corrida del equipo), presentando el estado de la aplicación web y la aplicación de los patrones de diseño en el backend. La cátedra nos indicó llevar el plan en una hoja de Google y mandarlo por mail, quitar CQRS, escribir un ADR por cada patrón y que se puede usar más de un código QR.
**Decisión**
Priorizar la conexión completa de todas las vistas contra la API real antes de sumar mejoras visuales secundarias.
**Problema o bloqueo**
Faltaban completar las pantallas de recepción, control de acceso y gestión por rol, que pasaron al Sprint 5.
**Commits**
`ef6fd8a` estado del repositorio presentado en el check-in del 15/10

---

## Sprint 5 — Unidad IV (Servicios e Integración Web) — Semana del 2026-10-22
### 2026-10-27 · 6 h
**Actividad**
Revisión conjunta por Discord con Martín de la capa de servicio del frontend (`frontend/src/services/api.js`) y de las nuevas pantallas de control de acceso, recepción y gestión por rol, verificando que todas las operaciones consumieran correctamente los endpoints del backend. Además, a pedido de Martín, le pasé al equipo las indicaciones que la cátedra me había dado en el check-in del 15/10 (enviar el plan en Google Sheets por mail, quitar CQRS, redactar un ADR por patrón y contemplar los códigos QR adicionales), para preparar el check-in siguiente.
**Decisión**
Verificar que todas las llamadas `fetch` quedaran centralizadas en `frontend/src/services/api.js` evitando URLs sueltas en cada vista, y ajustar las pantallas para contemplar los nuevos flujos de códigos QR solicitados por la cátedra.
**Problema o bloqueo**
Al revisar las vistas nuevas contra los endpoints del backend, detectamos diferencias en los parámetros enviados y en el manejo de errores HTTP al validar accesos y reservas; ajustamos las funciones en `frontend/src/services/api.js` para unificar las respuestas y mensajes mostrados al usuario.
**Commits**
`e8b8d74` pantallas de acceso, recepción, gestión e integración revisadas (subidas el 05/11)

---

## Sprint 6 — Documentación Arquitectónica y Cierre — Semana del 2026-11-05
### 2026-11-08 · 6 h
**Actividad**
Redacté y formalicé en Markdown los registros de decisión arquitectónica ADR-006 (frontend vanilla), ADR-007 (sincronización del terminal de sede) y ADR-010 (tokenización de pagos) siguiendo la plantilla del Anexo B.
**Decisión**
Documentación de las alternativas descartadas, los criterios de decisión y la deuda técnica asumida por el equipo en cada ADR, ajustando la numeración del ADR de pagos a ADR-010 según lo acordado. Ver ADR-006, ADR-007 y ADR-010.
**Problema o bloqueo**
Los borradores iniciales omitían campos obligatorios del Anexo B (autor, sprint, tabla comparativa completa y deuda asumida) y tenían fechas desfasadas respecto a cuándo se tomaron realmente las decisiones. Revisé el historial del equipo para corregir las fechas y reestructuré los tres documentos antes de subirlos.
**Commits**
`fd81941` formaliza ADR-006, ADR-007 y ADR-010 · `6c0384d` registro inicial de bitácora personal

### 2026-11-17 · 5 h
**Actividad**
Elaboré los tres diagramas UML asignados en fuente editable y PNG (diagrama de actividad de lista de espera, diagrama de estados de membresía y diagrama de estados de reserva), alineé los textos de ADR-006, ADR-007 y ADR-010 a la guía de revisión del equipo y redacté el Manual de Usuario (Anexo D).
**Decisión**
Mantener coherencia exacta entre los estados y transiciones representados en los diagramas UML, los casos de prueba del repositorio y los flujos explicados paso a paso por rol en el Manual de Usuario.
**Problema o bloqueo**
Había diferencias de nomenclatura entre los estados reales de la base de datos (por ejemplo, membresía suspendida/vencida y reserva cancelada) y los borradores iniciales; verifiqué los modelos del backend antes de exportar los diagramas definitivos.
**Commits**
`6973c4b` diagramas de actividad y de estados · `0e5082e` manual de usuario (Anexo D) · `848a154` ADR-006, ADR-007 y ADR-010 alineados a la guía · `da062c2`, `d6c72a5` actualización de bitácora