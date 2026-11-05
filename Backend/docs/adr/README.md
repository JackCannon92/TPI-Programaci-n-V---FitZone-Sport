# Registro de decisiones de arquitectura (ADR)

Un archivo por decisión, en Markdown, siguiendo `TEMPLATE.md` (formato basado en Michael Nygard /
MADR). Los ADR no se editan una vez aceptados: si una decisión cambia, se escribe uno nuevo que
reemplaza al anterior y se actualiza el estado de ambos.

| Nº | Decisión | Estado | Fecha | Introducido en |
|---|---|---|---|---|
| [ADR-001](ADR-001-seleccion-framework.md) | Selección del framework: Express + JavaScript vanilla | Aceptado | 27/08/2026 | rama `refactor-di` (Lab 1) |
| [ADR-002](ADR-002-versionado-api.md) | Versionado de la API por URL (`/api/v1`) | Aceptado | 07/09/2026 | rama `contrato-api` (Lab 2) |
| [ADR-003](ADR-003-monolito-modular.md) | Estilo arquitectónico: monolito modular | Aceptado | 27/08/2026 | `main` (Unidad I) |
| [ADR-004](ADR-004-persistencia-postgresql-supabase.md) | Persistencia: PostgreSQL (Supabase) + Sequelize | Aceptado | 27/08/2026 | `main` (Unidad I) |
| [ADR-005](ADR-005-patrones-gof.md) | Patrones GoF: Strategy, Observer, Repository | Aceptado (detallado en ADR-007, ADR-008 y ADR-009) | 27/08/2026 | `main` (Unidad I) |
| [ADR-006](ADR-006-sin-app-movil.md) | Sin app móvil nativa: una única Aplicación Web | Aceptado | 29/08/2026 | `main` (Unidad I) |
| [ADR-007](ADR-007-strategy-precio-canchas.md) | Strategy para el precio dinámico de canchas (RF-11) | Aceptado | 15/10/2026 | Unidad III |
| [ADR-008](ADR-008-repository-reservas-membresias.md) | Repository para Reserva de cancha y Membresía (RN-02) | Aceptado | 15/10/2026 | Unidad III |
| [ADR-009](ADR-009-observer-lista-espera.md) | Observer para el aviso a la lista de espera (RF-08) | Aceptado | 15/10/2026 | Unidad III |
| [ADR-010](ADR-010-codigos-qr.md) | Códigos QR: reserva de cancha, acceso sin conexión, asistencia a clase y verificación del comprobante | Aceptado | 28/10/2026 | Indicación de la cátedra (27/10) |

## Numeración

La cátedra fija el nombre de los ADR de laboratorio (`ADR-001-seleccion-framework`,
`ADR-002-versionado-api`), así que esa numeración manda en este registro. Las decisiones de la
Unidad I, que en el documento `docs/TP_FitZone_Unidad_I_ADR.pdf` figuran como ADR-001 a ADR-004,
pasan a ser **ADR-003 a ADR-006** acá (cada archivo indica su número original en "Relacionado").
El ADR-001 de aquel documento ("Monolito modular con Node.js, Express y JavaScript") se dividió en
dos decisiones distintas: el framework (ADR-001) y el estilo arquitectónico (ADR-003).

## Cómo agregar un ADR

1. Copiar `TEMPLATE.md` a `ADR-NNN-titulo-corto.md` con el siguiente número libre.
2. Completar contexto, opciones, decisión y consecuencias. Citar RF/RN/RNF del caso.
3. Agregar la fila a la tabla de arriba y referenciarlo desde el `LOG.md` con el commit.
