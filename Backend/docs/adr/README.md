# Registro de decisiones de arquitectura (ADR)

Un archivo por decisión, en Markdown, con la plantilla del Anexo B de los lineamientos (`TEMPLATE.md`): título, estado, fecha, autor, sprint, contexto, alternativas consideradas, decisión, consecuencias y requisitos relacionados.

Un ADR no se corrige: se supera. Si una decisión se revierte, el ADR original pasa a estado «Reemplazado por ADR-0NN» y se escribe uno nuevo.

## Los diez obligatorios

| Nº | Decisión | Estado | Autor | Requisitos |
|---|---|---|---|---|
| [ADR-001](ADR-001-estilo-arquitectonico.md) | Estilo arquitectónico: monolito modular | Aceptado | Ayala | RN-02, RNF-04 |
| [ADR-002](ADR-002-base-de-datos.md) | Motor de base de datos: PostgreSQL en Supabase | Aceptado | Ayala | RNF-03 |
| [ADR-003](ADR-003-acceso-offline.md) | Acceso sin conexión: QR firmado con clave pública | Aceptado | Ayala | RNF-01 |
| [ADR-004](ADR-004-concurrencia-reservas.md) | Concurrencia en la reserva de canchas: índice único parcial | Aceptado | Ayala | RN-02 |
| [ADR-005](ADR-005-framework-ioc-orm.md) | Framework, inversión de control y ORM: Express, composition root y Sequelize | Aceptado | Sirizzotti | Unidad II |
| [ADR-006](ADR-006-frontend-estado-global.md) | Frontend, componentes y estado global | — | Villagra | Unidad IV |
| [ADR-007](ADR-007-sincronizacion-terminal-sede.md) | Sincronización del terminal de sede | — | Villagra | RNF-01, RN-01 |
| [ADR-008](ADR-008-Estrategia-de-pruebas.md) | Estrategia de pruebas y cobertura mínima | Aceptado | Sirizzotti | Unidad V |
| [ADR-009](ADR-009-despliegue-y-reversion.md) | Despliegue, contenedores y reversión | Propuesto | Sirizzotti | Unidad V |
| [ADR-010](ADR-010-medios-de-pago.md) | Medios de pago: tokenización | Aceptado | Ayala | RNF-02 |

## Decisiones propias del equipo

| Nº | Decisión | Estado | Autor | Requisitos |
|---|---|---|---|---|
| [ADR-011](ADR-011-versionado-api.md) | Versionado de la API por URL | Aceptado | Ayala | Unidad II |
| [ADR-012](ADR-012-sin-app-movil.md) | Sin app móvil nativa: una única aplicación web | Aceptado | Ayala | Unidad VI |
| [ADR-013](ADR-013-strategy-precio-canchas.md) | Strategy para el precio dinámico de canchas | Aceptado | Sirizzotti | RF-11, RN-03 |
| [ADR-014](ADR-014-repository-reservas-membresias.md) | Repository para reservas de cancha y membresías | Aceptado | Sirizzotti | RN-02, RF-02 |
| [ADR-015](ADR-015-observer-lista-espera.md) | Observer para el aviso a la lista de espera | Aceptado | Sirizzotti | RF-07, RF-08 |
| [ADR-016](ADR-016-codigos-qr.md) | Varios códigos QR, con firma HMAC y Ed25519 | Aceptado | Sirizzotti | RF-04, RF-14, RN-01 |

## Numeración

Los lineamientos de entrega fijan los números del ADR-001 al ADR-010. Las decisiones que el equipo había registrado antes con otros números se renumeraron el 07/11/2026: el framework pasó a ser ADR-005, el monolito modular ADR-001, la persistencia ADR-002, el versionado de la API ADR-011, la decisión de no hacer app móvil ADR-012, y los ADR de patrones y de códigos QR pasaron de ADR-007 a ADR-010 a ser ADR-013 a ADR-016. El ADR de patrones de la Unidad I quedó reemplazado por los tres ADR de patrones (ADR-013 a ADR-015), que lo detallan.
