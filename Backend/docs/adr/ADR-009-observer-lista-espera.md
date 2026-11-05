# ADR-009 — Observer para el aviso a la lista de espera

- **Estado:** Aceptado
- **Fecha:** 15/10/2026 (separado en un ADR por patrón el 28/10/2026, por indicación de la cátedra)
- **Deciden:** Franco Ayala, Martín Emiliano Sirizzotti, Santiago Agustín Villagra
- **Relacionado:** RF-07, RF-08, ADR-005 (patrones decididos en la Unidad I), olor O-9 de `docs/LOG.md`

## Contexto

RF-08 pide que, cuando se libera un cupo en una clase grupal (porque alguien canceló su reserva), se avise a los socios anotados en la lista de espera. Después pueden sumarse otros interesados en el mismo hecho: un tablero de ocupación, métricas, un mail o una notificación push.

En el código de la Unidad II, la lista de espera se cargaba (`POST /api/clases/lista-espera`), pero nadie avisaba cuando se liberaba un cupo. El archivo `clases/observer/waitlistNotifier.js` existía, pero vacío.

## Opciones consideradas

| Opción | A favor | En contra |
|---|---|---|
| **Llamar al aviso directamente desde `cancelarReserva()`** | Lo más simple; el flujo se lee de corrido. | Cada interesado nuevo obliga a editar la cancelación, y si falla el aviso se cae la cancelación. Para probar la cancelación hay que simular todos los avisos. |
| **Observer escrito a mano** (lista de oyentes propia) | Control total. | Reimplementa algo que Node ya trae (`EventEmitter`); la cátedra lo marca como error. |
| **Observer sobre el `EventEmitter` de Node, con aislamiento de fallas** | La cancelación publica un hecho y no sabe quién escucha. Sumar un interesado es sumar un oyente. | El flujo deja de verse en un solo archivo: hay que saber quién escucha cada evento. El evento vive en memoria: si el proceso se cae justo después de guardar, el aviso se pierde. |

## Decisión

**Se aplica Observer sobre el `EventEmitter` de Node.**

| Pieza | Archivo | Rol |
|---|---|---|
| Bus de eventos | `src/common/bus-eventos.js` | Sujeto. Envuelve al `EventEmitter` y define el catálogo de eventos. |
| Publicador | `src/modules/clases/clases.service.js` (`cancelarReserva`) | Publica `CupoLiberado` después de guardar la cancelación. |
| Oyente | `src/modules/clases/observer/waitlistNotifier.js` | Avisa al primero de la lista de espera que todavía no fue avisado y lo marca como notificado. |
| Suscripción | `src/core/compositionRoot.js` | Único lugar donde se decide quién escucha qué. |

| Evento | Lo publica | Oyentes | Qué hace el oyente |
|---|---|---|---|
| `CupoLiberado` | `clases.service.cancelarReserva` | `waitlistNotifier` | Marca como notificado al primero de la lista de espera y deja el aviso en el log. |

Reglas adoptadas:

- **Los eventos se nombran en pasado**, porque son hechos, y quedan listados en esta tabla.
- **Se publica después de guardar:** cuando el oyente se entera, el hecho ya es firme.
- **Un oyente que falla no arrastra a los demás** ni a la operación que publicó: el bus registra el error y sigue.
- **Los oyentes corren en una tarea aparte:** la respuesta HTTP no espera al aviso.
- **Avisar no es reservar.** El socio avisado tiene que entrar y reservar; si otro llega antes, gana el otro. Así el cupo nunca queda tomado por alguien que no confirmó.

## Consecuencias

**Positivas**
- RF-08 implementado sin acoplar la cancelación al aviso.
- Un interesado nuevo es un oyente nuevo más una línea de suscripción; `clases.service` no se toca.
- La cancelación se prueba verificando que publicó el evento, sin simular ningún aviso.

**Negativas / riesgos**
- El flujo completo no se ve en el servicio. Se mitiga con la tabla de eventos de este ADR y con todas las suscripciones en `compositionRoot.js`.
- El evento vive en memoria, así que si el proceso se cae entre el guardado y el aviso, el aviso se pierde. Si el aviso pasara a ser crítico, haría falta guardarlo como pendiente en la base (bandeja de salida); queda fuera del alcance del TI.
- Todavía no hay un canal real de notificación (push o mail): el aviso queda registrado en la base (`notificado`) y en el log.
- Para que la clase se llene y la lista de espera se use, la base necesita el trigger que descuenta los cupos (`docs/trigger-cupos-clases.sql`, olor O-9).

## Cómo se verifica

```bash
npm test -- lista-espera      # test/unit/lista-espera.test.js: oyente, bus y publicador
```

En la API: llenar una clase, anotar a otro socio en la lista de espera y cancelar la primera reserva. En la consola del servidor aparece `📣 [RF-08] Se liberó un cupo...`, y en `GET /api/clases/{id}/lista-espera` el socio figura con `notificado: true`.
