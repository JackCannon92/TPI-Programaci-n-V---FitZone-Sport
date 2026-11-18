# 2. Estructura de desglose del trabajo

Épica → historia de usuario → subtarea técnica. La estimación de cada subtarea es la del plan, en horas. Las subtareas marcadas **(agregada)** surgieron durante el cuatrimestre, casi siempre por una indicación de la cátedra, y no tenían estimación original: se registran igual porque consumieron trabajo, y su efecto está en [06-seguimiento.md](06-seguimiento.md).

Columna **Hecha por**: quién terminó la subtarea, según la planilla y las bitácoras. Cuando no coincide con el responsable del plan, la diferencia se analiza en [04-asignacion-y-carga.md](04-asignacion-y-carga.md).

---

## E0 · Arquitectura y fundaciones (Unidades I y II)

**H0.1 — Como equipo, queremos una arquitectura decidida y documentada para que los cinco módulos crezcan sin acoplarse.**
Criterios de aceptación: (1) hay diagramas C4 de contexto, contenedores y componentes; (2) cada decisión estructural tiene su ADR con alternativas descartadas; (3) el backend arranca con todos los módulos armados desde un único composition root.

| Subtarea | Est. (h) | Resp. (plan) | Hecha por | Estado |
|---|---|---|---|---|
| Debate arquitectónico (todo el equipo) | 3 | Ayala | Equipo, 27/08 | Hecha |
| C4 de contexto y contenedores | 3 | Ayala | Ayala, 29/08 | Hecha |
| ADR iniciales | 2 | Ayala | Ayala, 29/08 | Hecha |
| Scaffolding del backend en Express | 2 | Ayala | Ayala, 07/09 | Hecha |
| Inyección de dependencias (composition root) | 2 | Ayala | Ayala, 07/09 | Hecha |
| Esquema SQL versionado y datos de prueba de 25 sedes y 4 roles (agregada) | s/e | — | Ayala, 16/09 y 17/11 (`ace9ac7`) | Hecha |
| Diez ADR obligatorios según los lineamientos del 06/11 (agregada) | s/e | — | Los tres, 08 al 17/11 | Hecha |
| Catorce diagramas con fuente y PNG (agregada) | s/e | — | Los tres, 16 y 17/11 | Hecha |

## E1 · Módulo 1: usuarios y membresías (RF-01 a RF-03, RN-03)

**H1.1 — Como recepcionista, quiero registrar a una persona como socio o cliente externo para que pueda usar el sistema.** (RF-01)
Criterios: (1) el alta pide DNI, contacto y tipo; (2) el DNI y el email no se repiten; (3) un socio nace con una membresía.

**H1.2 — Como socio, quiero tener un plan mensual, trimestral o anual que pase a vencido cuando corresponde.** (RF-02)
Criterios: (1) el plan define la fecha de vencimiento; (2) una membresía con la fecha pasada figura VENCIDO; (3) renovar una activa suma desde su vencimiento y renovar una vencida cuenta desde hoy; (4) se puede suspender.

**H1.3 — Como socio con la cuota vencida, quiero poder alquilar una cancha pagando el precio de externo.** (RN-03)
Criterios: (1) no recibe el descuento de socio; (2) no puede reservar clases.

| Subtarea | Est. (h) | Resp. (plan) | Hecha por | Estado |
|---|---|---|---|---|
| Modelos Sequelize de usuarios y membresías | 4 | Ayala | Ayala, 16/09 | Hecha |
| API REST del Módulo 1 | 4 | Ayala | Ayala, 16/09 | Hecha |
| Repository de membresías (memoria y Sequelize) | (en E4) | Sirizzotti | Sirizzotti, 13/10 | Hecha |
| Rol de administrador de sede (agregada) | s/e | — | Sirizzotti, 16/11 (`5ff08ac`) | Hecha |

## E2 · Módulo 2: control de acceso (RF-04, RF-05, RN-01, RNF-01)

**H2.1 — Como socio, quiero entrar a cualquier sede mostrando un QR que cambia cada minuto, para que no se pueda usar una captura.** (RF-03, RF-04)
Criterios: (1) el QR vence al minuto; (2) se valida la membresía activa en la base central; (3) sirve en cualquier sede.

**H2.2 — Como recepcionista, quiero ver el aforo actual y máximo de mi sede, y que nadie figure adentro de dos sedes a la vez.** (RF-05, RN-01)
Criterios: (1) con el aforo completo no se registra el ingreso (409); (2) quien ya figura adentro no puede volver a entrar hasta registrar el egreso (409).

**H2.3 — Como recepcionista, quiero validar el QR sin conexión aunque se caiga el servidor, y que los ingresos se carguen solos al volver.** (RNF-01)
Criterios: (1) el terminal verifica la firma Ed25519 con la clave pública guardada, sin red; (2) los ingresos quedan en una cola local; (3) al volver la conexión el servidor los registra con la hora original, sin duplicar y resolviendo RN-01.

| Subtarea | Est. (h) | Resp. (plan) | Hecha por | Estado |
|---|---|---|---|---|
| Módulo Acceso: QR dinámico y aforo | 4 | Sirizzotti | Ayala, 26/09 al 01/10 | Hecha |
| Prueba manual por Swagger de Acceso y Canchas | 1 | Sirizzotti | Sirizzotti, 02/10 | Hecha |
| QR sin conexión firmado con Ed25519 (agregada) | s/e | — | Sirizzotti, 28/10 (`b7a6848`) | Hecha |
| Validación local, cola y `POST /acceso/sincronizar` (ADR-007) | (en "Refuerzo de RNF") | Equipo | Sirizzotti, 17/11 (`9b14f0b`, `69c1292`) | Hecha |

## E3 · Módulo 3: clases grupales (RF-06 a RF-08)

**H3.1 — Como administrador de sede, quiero crear clases con instructor, horario y cupo.** (RF-06)
Criterios: (1) la clase tiene cupo máximo; (2) se lista por sede y fecha.

**H3.2 — Como socio, quiero reservar una clase hasta 48 horas antes y cancelar sin penalidad hasta 2 horas antes.** (RF-07)
Criterios: (1) reservar descuenta el cupo; (2) fuera de esas ventanas el sistema lo rechaza.

**H3.3 — Como socio, quiero anotarme en la lista de espera y que me avisen cuando se libera un lugar.** (RF-08)
Criterios: (1) con la clase llena se puede entrar a la lista; (2) al cancelar alguien, se avisa al primero no avisado; (3) quien publica el evento no conoce a los oyentes (Observer).

| Subtarea | Est. (h) | Resp. (plan) | Hecha por | Estado |
|---|---|---|---|---|
| Módulo Clases con patrón Observer | 1,5 | Sirizzotti | Ayala (módulo, 28/09) y Sirizzotti (Observer, 13/10) | Hecha |
| QR de asistencia a clase (agregada) | s/e | — | Sirizzotti, 28/10 | Hecha |

## E4 · Módulo 4: canchas (RF-09 a RF-12, RN-02, RNF-03)

**H4.1 — Como gerente, quiero dar de alta canchas por sede con su tipo y precio por hora.** (RF-09)

**H4.2 — Como socio o cliente externo, quiero ver la grilla de turnos y reservar uno, y que nadie más pueda tomarlo.** (RF-10, RN-02)
Criterios: (1) el turno reservado aparece ocupado; (2) si dos reservan el mismo turno a la vez, solo uno lo logra (409); (3) al cancelar, el turno se libera.

**H4.3 — Como cliente, quiero ver el precio con su detalle: base, descuento de socio y recargo de hora pico.** (RF-11)
Criterios: (1) socio activo −15 %; (2) de 19 a 21 hs +20 % sobre el precio ya descontado; (3) agregar una regla no modifica el Tarifador (Strategy).

**H4.4 — Como administrador, quiero poner una cancha en mantenimiento sin afectar las reservas ya tomadas.** (RF-12)

| Subtarea | Est. (h) | Resp. (plan) | Hecha por | Estado |
|---|---|---|---|---|
| Módulo Canchas con Strategy e índice único de RN-02 | 3 | Sirizzotti | Ayala (módulo e índice, 16 y 28/09) y Sirizzotti (Strategy, 13/10) | Hecha |
| Repository en reservas de cancha | 1,5 (con Pagos) | Sirizzotti | Sirizzotti, 13/10 | Hecha |
| QR de reserva de cancha para el cliente externo (agregada) | s/e | — | Sirizzotti, 28/10 | Hecha |

## E5 · Módulo 5: pagos (RF-13, RF-14, RNF-02)

**H5.1 — Como cliente, quiero pagar mi reserva con tarjeta en una pasarela simulada, sin que el sistema guarde mis datos de tarjeta.** (RF-13, RNF-02)
Criterios: (1) se guarda solo el token de la pasarela y los últimos cuatro dígitos; (2) un rechazo de la pasarela no confirma la reserva.

**H5.2 — Como cliente, quiero un comprobante PDF con la cancha, el horario y el monto, que se pueda verificar.** (RF-14)

| Subtarea | Est. (h) | Resp. (plan) | Hecha por | Estado |
|---|---|---|---|---|
| Módulo Pagos con pasarela simulada | 1,5 (con Repository) | Sirizzotti | Ayala (28/09) | Hecha |
| Comprobante PDF con QR de verificación (agregada) | s/e | — | Sirizzotti, 28/10 | Hecha |
| Verificación manual de toda la API (27 chequeos) | 1 | Sirizzotti | Sirizzotti, 13/10 | Hecha |

## E6 · Aplicación web (Unidad IV)

**H6.1 — Como cualquier rol, quiero una sola aplicación web que me muestre las pantallas de mi perfil.**
Criterios: (1) ingreso por DNI; (2) panel, reservas, clases, acceso, recepción y gestión conectados a la API real; (3) se usa en el celular.

| Subtarea | Est. (h) | Resp. (plan) | Hecha por | Estado |
|---|---|---|---|---|
| Estructura base HTML, CSS y JS | 1 | Villagra | Sirizzotti, 02/10 | Hecha |
| Pantalla de ingreso | 1 | Villagra | Sirizzotti, 02/10 | Hecha |
| Panel principal | 1 | Villagra | Sirizzotti, 02/10 | Hecha |
| Listado de usuarios | 1 | Villagra | Sirizzotti, 02/10 | Hecha |
| Modularización de la interfaz (`components/ui.js`) | 2 | Villagra | Sirizzotti, 28/10 | Hecha con atraso |
| Pantalla de reserva de canchas | 2 | Villagra | Sirizzotti, 28/10 | Hecha con atraso |
| Pantalla de reserva de clases | 2 | Villagra | Sirizzotti, 28/10 | Hecha con atraso |
| Capa de servicio (`services/api.js`) | 2 | Villagra | Sirizzotti, 28/10 | Hecha con atraso |
| Integración con el backend | 2 | Villagra | Sirizzotti, 28/10 | Hecha con atraso |
| Pantallas de acceso, recepción y gestión (agregada) | s/e | — | Sirizzotti, 28/10 (`e8b8d74`) | Hecha |
| Panel «Terminal» de Recepción sin conexión (agregada) | s/e | — | Sirizzotti, 17/11 (`69c1292`) | Hecha |

## E7 · Calidad y despliegue (Unidad V)

**H7.1 — Como equipo, queremos pruebas automáticas que corran sin base de datos y frenen un cambio que rompe una regla.**
Criterios: (1) unitarias e integración con Jest y Supertest; (2) cobertura mínima de 70 % de líneas y 50 % de ramas (ADR-008).

**H7.2 — Como evaluador, quiero levantar todo el sistema con un comando y ver el pipeline verificando cada cambio.**
Criterios: (1) `docker compose up` levanta base, API y web; (2) el pipeline corre pruebas, construye la imagen y hace una prueba de humo.

| Subtarea | Est. (h) | Resp. (plan) | Hecha por | Estado |
|---|---|---|---|---|
| Pruebas unitarias con Jest | 3 | Sirizzotti | Sirizzotti, 28/10 (`674c08f`) | Hecha |
| Pruebas de integración con Supertest | 3 | Sirizzotti | Sirizzotti, 28/10 (`674c08f`) | Hecha |
| Pipeline de GitHub Actions | 3 | Sirizzotti | Sirizzotti, 16/11 (`63892b2`) | Hecha con atraso |
| Dockerfile y `docker-compose` | 3 | Sirizzotti | Sirizzotti, 16/11 (`63892b2`) | Hecha con atraso |
| Quitar CQRS y un ADR por patrón (agregada, 27/10) | s/e | — | Sirizzotti, 28/10 (`d6170be`, `21e1539`) | Hecha |

## E8 · Integración, documentación y cierre

**H8.1 — Como evaluador, quiero manuales, bitácoras y planificación que expliquen el sistema y cómo se construyó.**
Criterios: (1) manual de usuario, de instalación y técnico (anexos D, E y F); (2) una bitácora por integrante con al menos ocho entradas; (3) esta planificación con seguimiento.

| Subtarea | Est. (h) | Resp. (plan) | Hecha por | Estado |
|---|---|---|---|---|
| Recuperar el atraso del cronograma | 4 | Equipo | Los tres (ADR, diagramas y manuales), 08 al 17/11 | Hecha |
| Refuerzo de RNF (disponibilidad y rendimiento) | 3 | Equipo | Sirizzotti (sincronización offline, ADR-007), 17/11 | Hecha |
| Pulido de la aplicación web | 3 | Equipo | Sirizzotti, 16 y 17/11 | Hecha |
| Integración final de punta a punta | 3 | Equipo | Sirizzotti (prueba con navegador contra la pila completa), 17/11 | Hecha |
| Corrección de errores entre back y front | 3 | Equipo | Sirizzotti (`/api/v1`, base sin SSL, rol de admin. de sede), 16/11 | Hecha |
| Bitácoras personales (agregada, 30/10) | s/e | — | Cada integrante la suya | En curso |
| Manuales de usuario, instalación y técnico (agregada, 06/11) | s/e | — | Villagra, Sirizzotti y Ayala | Instalación y técnico subidos; usuario por subir |
| Planificación y planilla de registro (agregada, 06/11) | s/e | — | Equipo, 17/11 | Esta versión |
| Reorganizar el repositorio según el punto 4 de los lineamientos (agregada, 18/11) | s/e | — | Sirizzotti, 18/11 | Hecha |
| Evidencia de los RNF (`docs/rnf/`) y prueba de concurrencia de RN-02 contra PostgreSQL (agregada, 18/11) | s/e | — | Sirizzotti, 18/11 | Hecha |
| Ensayo de la defensa | 1 | Equipo | — | Pendiente (sprint 7) |
| Presentación final (Demo Day) | 1 | Equipo | — | Pendiente (sprint 8) |
