# Evidencia de los requisitos no funcionales

| RNF | Qué pide el enunciado | Cómo se cumple | Evidencia |
|---|---|---|---|
| RNF-01 · Disponibilidad | El control de acceso funciona aunque falle la conexión principal | El terminal de Recepción valida el QR sin conexión con la clave pública guardada y sincroniza al volver (ADR-003, ADR-007) | [RNF-01-disponibilidad.md](RNF-01-disponibilidad.md) |
| RNF-02 · Seguridad | No se guardan datos de tarjeta; solo el token de la pasarela | La tabla `pagos` solo tiene `token_pasarela` y `ultimos4` (ADR-010) | [RNF-02-seguridad.md](RNF-02-seguridad.md) |
| RNF-03 · Rendimiento | La consulta de disponibilidad responde en pocos milisegundos, con índices | Índice `(cancha_id, fecha_hora_inicio)` de las reservas activas (ADR-002, ADR-004) | [RNF-03-rendimiento.md](RNF-03-rendimiento.md) |
| RNF-04 · Escalabilidad | Se agrega una sede sin detener el sistema | Las sedes son datos: alta por API o desde Gestión, sin reiniciar (ADR-001) | [RNF-04-escalabilidad.md](RNF-04-escalabilidad.md) |

## Cómo se obtuvo

Las mediciones son del 18/11/2026, sobre el sistema corriendo en un entorno local (Node.js 22, PostgreSQL 16) con los datos de prueba del seed. Se reproducen con el sistema levantado con `docker compose up --build`:

```bash
bash docs/rnf/medir-rnf.sh        # RNF-02, RNF-03 y RNF-04 (necesita curl y jq)
```

RNF-01 se verifica con las pruebas automáticas y con la demo del manual de instalación (sección 8). El script borra todo lo que crea.
