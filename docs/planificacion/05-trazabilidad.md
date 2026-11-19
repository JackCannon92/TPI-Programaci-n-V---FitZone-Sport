# 5. Matriz de trazabilidad

Cada requisito del enunciado, con la historia que lo implementa (ver [02-desglose-del-trabajo.md](02-desglose-del-trabajo.md)), el código principal y la prueba que lo verifica. Las rutas de prueba son relativas a `backend/test/`. "Manual" quiere decir que se verifica a mano o en la demo y no con una prueba automática: esos son los huecos de la matriz y están marcados.

Estado al 18/11: 113 pruebas (83 unitarias y 30 de integración) más una de concurrencia contra PostgreSQL; cobertura de 82,3 % de líneas y 61,5 % de ramas. La evidencia de los RNF está en `docs/rnf/`.

| Req. | Historia | Implementación | Prueba automática | Verificación manual o demo | Cobertura |
|---|---|---|---|---|---|
| RF-01 | H1.1 | `usuarios/` | — | Alta desde la aplicación web (manual de usuario, 3.1) | **Hueco** |
| RF-02 | H1.2 | `membresias/` (Repository) | `unit/membresias.test.js` (8 casos: plan, vencimiento, renovación, suspensión); `unit/membresias-pago.test.js` (renovar pagando por la pasarela, aprobado y rechazado); `integracion/membresias.api.test.js` | — | Completa |
| RF-03 | H2.1 | `acceso.service.js` (el ingreso no depende de la sede de alta) | — | Demo: el mismo socio entra en dos sedes en días distintos | **Hueco** |
| RF-04 | H2.1 | `acceso/qr-token.js` (HMAC, cambia cada minuto) | — | Demo: un QR de más de un minuto se rechaza en Recepción | **Hueco** |
| RF-05 | H2.2 | `acceso.service.js` → `aforo()`; pantalla de Recepción | `unit/sincronizacion-terminal.test.js` (cuenta del aforo excedido) | Demo: sede llena rechaza el ingreso | Parcial |
| RF-06 | H3.1 | `clases.service.js` → `crearClase()` | — | Gestión → Clases (manual de usuario, 4.2) | **Hueco** |
| RF-07 | H3.2 | `clases.service.js` → `reservar()`, `cancelarReserva()` | `unit/qr-asistencia.test.js` (reserva, cancelación y asistencia) | Demo: reservar con más de 48 h y cancelar con menos de 2 h | Parcial: las ventanas de 48 h y 2 h no tienen prueba |
| RF-08 | H3.3 | `clases/observer` (bus de eventos y oyente) | `unit/lista-espera.test.js` (7 casos) | — | Completa |
| RF-09 | H4.1 | `canchas.service.js` | — | Gestión → Canchas (manual de usuario, 4.3) | **Hueco** |
| RF-10 | H4.2 | `canchas.service.js`, `repositorio/reservas.*` | `unit/reservas-cancha.test.js`; `integracion/canchas.api.test.js` (disponibilidad y reservas) | — | Completa |
| RF-11 | H4.3 | `canchas/strategies` (Tarifador + reglas) | `unit/precios.test.js` (14 casos, incluido abierto/cerrado); `integracion/canchas.api.test.js` (precio) | — | Completa |
| RF-12 | H4.4 | `canchas.service.js` (estado MANTENIMIENTO) | `unit/reservas-cancha.test.js` ("una cancha en mantenimiento no se puede reservar") | — | Parcial: que no afecte las reservas ya tomadas no tiene prueba |
| RF-13 | H5.1 | `pagos/pasarela-mock.js`, `pagos.service.js` | `unit/qr-comprobante.test.js` y `integracion/qr.api.test.js` (pago aprobado) | Demo: tarjeta terminada en 0000 rechazada | Parcial: el rechazo no tiene prueba |
| RF-14 | H5.2 | `pagos/comprobante-pdf.js` | `unit/qr-comprobante.test.js` (PDF y verificación); `integracion/qr.api.test.js` (descarga) | — | Completa |
| RN-01 | H2.2, H2.3 | `acceso.service.js` → `ingresar()` y `sincronizarIngresos()` | `unit/qr-reserva.test.js` ("RN-01: si ya está adentro…"); `unit/sincronizacion-terminal.test.js` (2 casos de RN-01) | Demo obligatoria | Completa |
| RN-02 | H4.2 | Índice único parcial `uq_reserva_cancha_turno_activo` (`db/01-esquema.sql`) y `TurnoYaReservadoError` | `unit/reservas-cancha.test.js` y `integracion/canchas.api.test.js` (409 en el segundo intento); `concurrencia/reserva-cancha.concurrencia.test.js` (seis pedidos simultáneos contra PostgreSQL real, ADR-017) | Demo obligatoria de concurrencia | Completa |
| RN-03 | H1.3 | `strategies/memberDiscountPricing.js` + `usuarios.service.js` → `esSocioActivo()` | `unit/precios.test.js` ("un socio con la cuota vencida paga como externo") | Demo obligatoria (Diego, DNI 30222333) | Completa |
| RNF-01 | H2.3 | `acceso/qr-offline.js`, `frontend/src/services/terminal-offline.js`, `POST /acceso/sincronizar` (ADR-003, ADR-007) | `unit/qr-offline.test.js` (8); `unit/sincronizacion-terminal.test.js` (11); `integracion/qr.api.test.js` (6 casos de acceso sin conexión y sincronización) | Demo obligatoria con la API caída (manual de instalación, 8) | Completa |
| RNF-02 | H5.1 | `pagos.model.js` guarda solo `token_pasarela` y `ultimos4` (ADR-010) | — | Medición en `docs/rnf/RNF-02-seguridad.md`: el número y el titular no aparecen en ningún dato de la base | Parcial: sin prueba automática |
| RNF-03 | H4.2 | Índices en `db/01-esquema.sql` (turno de cancha, accesos por sede y fecha, reservas por usuario) | — | Medición en `docs/rnf/RNF-03-rendimiento.md`: con 349.377 reservas, 0,12 ms en la base y 3,4 ms promedio por la API | Parcial: sin prueba automática |
| RNF-04 | H4.1 | Sedes como datos (`sedes`), alta desde Gestión sin reiniciar; datos de prueba con 25 sedes | `integracion/app.test.js` (la aplicación arma todos los módulos) | Medición en `docs/rnf/RNF-04-escalabilidad.md`: alta de sede y cancha con la API corriendo, sin reiniciar | Parcial |

## Resumen

| Cobertura | Requisitos |
|---|---|
| Completa | RF-02, RF-08, RF-10, RF-11, RF-14, RN-01, RN-02, RN-03, RNF-01 (9) |
| Parcial | RF-05, RF-07, RF-12, RF-13, RNF-02, RNF-03, RNF-04 (7) |
| Hueco (solo verificación manual) | RF-01, RF-03, RF-04, RF-06, RF-09 (5) |

Todos los requisitos tienen una historia y una implementación. Los huecos son de prueba automática: las reglas de negocio obligatorias (RN-01 a RN-03) y el RNF de disponibilidad están cubiertos. Los huecos están en las altas simples (usuarios, clases, canchas) y en el QR dinámico: cuando se escribieron las pruebas, en el sprint 5, se priorizaron las reglas de negocio y no se volvió sobre el resto.
