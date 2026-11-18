# RNF-04 · Agregar una sede sin detener el sistema

> La arquitectura permite agregar una nueva sede sin detener el sistema (configuración por base de datos).

## Cómo se cumple

Las sedes son filas de la tabla `sedes`, no configuración del código: ningún módulo tiene sedes fijas. Una sede nueva se da de alta con `POST /api/v1/sedes` o desde **Gestión → Sedes** en la aplicación web, y queda disponible en el momento para canchas, clases, acceso y aforo (ADR-001, monolito modular con datos centralizados). El seed carga 25 sedes.

## Medición (18/11/2026), con la API corriendo

| Paso | Resultado |
|---|---|
| Proceso de la API | PID 725 |
| `GET /sedes` | 25 sedes |
| `POST /sedes` («FitZone Prueba RNF-04», aforo 80) | 201, sede creada |
| `GET /sedes` | 26 sedes |
| `POST /canchas` en la sede nueva («Pádel 1») | 201, cancha `DISPONIBLE` |
| `GET /acceso/aforo/{sede nueva}` | `{"actual":0,"maximo":80}` |
| Proceso de la API | PID 725: el mismo, no se reinició |

## Límite

Una sola instancia de la API. ADR-001 deja como deuda extraer un módulo como servicio si su volumen lo justifica; no se hizo.
