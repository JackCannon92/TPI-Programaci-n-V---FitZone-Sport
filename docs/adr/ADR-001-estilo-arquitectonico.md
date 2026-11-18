# ADR-001 — Estilo arquitectónico: monolito modular

- **Estado:** Aceptado
- **Fecha:** 2026-08-27
- **Autor:** Ayala, Franco
- **Sprint:** 1

## Contexto

FitZone Sports tenía que unificar socios, control de acceso, clases grupales, alquiler de canchas y pagos para una cadena de más de 25 sedes. El caso planteaba una tensión de diseño: la reserva de canchas exige consistencia fuerte (RN-02: si dos personas reservan el mismo turno en el mismo instante, solo una puede tener éxito) y, al mismo tiempo, la cadena necesita crecer en sedes sin rehacer el sistema (RNF-04).

Las restricciones eran concretas: un equipo de tres personas, dieciséis semanas de cursado, ninguna experiencia previa operando sistemas distribuidos y un presupuesto de infraestructura igual a cero.

## Alternativas consideradas

| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| Microservicios | Cada dominio se escala y se despliega por separado. | Una reserva y su pago quedan en servicios y bases distintos: evitar la sobreventa exige transacciones distribuidas (SAGA o dos fases). Suma descubrimiento de servicios, red interna y monitoreo distribuido. | La complejidad operativa supera al equipo y al plazo, y complica justo lo que el caso pide garantizar (RN-02). |
| SOA (arquitectura orientada a servicios) | Pensada para integrar sistemas existentes mediante un bus de servicios. | Requiere un bus o intermediario y contratos entre servicios; su ventaja aparece cuando hay sistemas heredados que integrar. | FitZone se construye desde cero: no hay sistemas previos que justifiquen la infraestructura. |
| Serverless (funciones en la nube) | No hay servidores que administrar; se paga por uso. | Las transacciones y el estado (aforo, turnos) quedan repartidos entre funciones sin estado; arranques en frío; difícil de probar en local; dependencia de un proveedor. | Complica la consistencia de RN-02 y el trabajo en local del equipo, sin ninguna ganancia para el tamaño del caso. |
| Monolito tradicional (sin módulos) | Lo más rápido para empezar. | Todo el código queda mezclado: cualquier cambio toca cualquier parte, y no se puede separar nada en el futuro. | No ordena el código por dominio ni deja preparado un crecimiento. |
| **Monolito modular** | Una sola base de datos con transacciones ACID; un solo desplegable; módulos separados por dominio con fronteras claras. | Escala como un todo; exige disciplina para que un módulo no use las tripas de otro. | **Elegida.** |

## Decisión

Construimos un **monolito modular**: una sola aplicación Node.js con Express, organizada en un módulo por dominio (`usuarios`, `membresias`, `sedes`, `acceso`, `canchas`, `clases`, `pagos`), cada uno con su modelo, servicio, validadores, controlador y rutas. El criterio determinante fue que **una sola base de datos permite garantizar RN-02 con una restricción de la propia base**, sin transacciones distribuidas.

Reglas que seguimos:

1. Los módulos se comunican mediante funciones inyectadas en un único punto (`src/core/compositionRoot.js`), nunca por HTTP interno.
2. Lo que ocurre entre módulos sin necesidad de respuesta inmediata va por un bus de eventos interno (patrón Observer).
3. La consistencia crítica la garantiza la base de datos (ADR-002, ADR-004), no la lógica de aplicación.
4. Una sede nueva es un registro en la tabla `sedes`: se agrega por configuración, no por despliegue (RNF-04).

## Consecuencias

- **Positivas:** RN-02 se resuelve con un índice único en una sola base (ADR-004); los reportes entre sedes son una consulta; un solo comando levanta todo el sistema; el equipo invierte las horas en arquitectura, patrones y pruebas en lugar de infraestructura.
- **Negativas:** si un módulo necesitara escalar por su cuenta (por ejemplo, acceso en horario pico en todas las sedes), hay que escalar la aplicación entera; un error grave en un módulo puede afectar a todo el proceso.
- **Deuda asumida:** si el volumen de alguna parte lo justifica, habrá que extraer ese módulo como servicio independiente. Las fronteras ya están marcadas por carpeta y por inyección de dependencias, así que el trabajo sería reemplazar la función inyectada por un cliente HTTP.

## Requisitos relacionados

RN-02, RNF-04
