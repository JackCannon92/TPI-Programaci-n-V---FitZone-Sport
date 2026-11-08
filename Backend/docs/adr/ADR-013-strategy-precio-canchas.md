# ADR-013 — Strategy para el precio dinámico de canchas

- **Estado:** Aceptado
- **Fecha:** 2026-10-15
- **Autor:** Sirizzotti, Martín Emiliano
- **Sprint:** 4
- **Relacionado:** RF-11, RN-03, olores O-1 y O-2 de `docs/LOG.md`

## Contexto

RF-11 pide que el precio de un turno de cancha dependa de quién reserva y de cuándo:

- **Precio estándar:** el precio por hora cargado en la cancha.
- **Descuento de socio:** −15 % si el usuario es socio con la membresía activa (RN-03: un socio vencido paga como externo).
- **Recargo por horario pico:** +20 % para los turnos que empiezan entre las 19:00 y las 20:59.

Además, el negocio ya anticipa más reglas (promociones, precios por sede).

En el código de la Unidad II, `canchas.service.cotizar()` estaba simulado: devolvía siempre `precioHora` (`// MOCK DIRECTO (Sin Strategy)`). Los archivos `canchas/strategies/*.js` existían, pero vacíos. Por otro lado, el horario pico (`h >= 19 && h < 21`) estaba escrito a mano en la grilla de disponibilidad, y RF-11 lo necesitaba de nuevo.

## Alternativas consideradas

| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| **`if/else` dentro de `cotizar()`** | Lo más corto para tres reglas. | Cada regla nueva edita un método que calcula plata (viola abierto/cerrado). El orden de aplicación queda implícito en el orden de los `if`, y no se puede probar una regla sola. | Cada regla nueva obliga a modificar un método que ya funciona y que calcula dinero. |
| **Strategy: una regla por archivo y un contexto que las aplica en orden** | Cada regla se prueba sola. Una regla nueva es un archivo nuevo, sin tocar las existentes. El orden queda escrito en un solo lugar. | Más archivos que un `if`. El contrato de una regla es una convención (JavaScript no tiene interfaces); lo cubren los tests. | **Elegida.** |
| **Decorator: cada regla envuelve a la anterior** | Las reglas se acumulan sobre el mismo precio, que es justo la intención de un Decorator. | Para armar la combinación hay que anidar objetos (`new Recargo(new Descuento(new Base()))`), y depurar una pila de envoltorios es incómodo. | Anidar objetos complica armar y probar las combinaciones, sin ganar nada sobre Strategy. |

## Decisión

**Se aplica Strategy, en su variante acumulativa.** El `Tarifador` es el contexto del patrón: recibe un precio base y una lista ordenada de reglas, filtra las que aplican a la reserva y las aplica en orden.

Cada estrategia cumple el mismo contrato `{ nombre, aplica(ctx), aplicar(precio, ctx) }`:

| Archivo | Rol |
|---|---|
| `src/modules/canchas/strategies/tarifador.js` | Contexto: aplica las reglas y arma el detalle del precio |
| `src/modules/canchas/strategies/standarPricing.js` | Precio estándar (la semilla del cálculo) |
| `src/modules/canchas/strategies/memberDiscountPricing.js` | Descuento de socio (−15 %) |
| `src/modules/canchas/strategies/peakHourPricing.js` | Recargo por horario pico (+20 %). Exporta `esHorarioPico()`, que también usa la grilla de disponibilidad. |

Reglas adoptadas:

- **El orden lo fija `src/core/compositionRoot.js`:** primero el descuento y después el recargo, que se calcula sobre el precio ya descontado ($1000 → $850 → $1020). Es una decisión de negocio, y queda escrita en un solo lugar.
- **El servicio no conoce las reglas:** `canchas.service.cotizar()` solo arma el contexto (cancha, inicio, si es socio activo) y le pide el precio al `Tarifador`.
- **Agregar una regla** es escribir un archivo nuevo en `strategies/` y sumarlo a la lista del `compositionRoot`. El `Tarifador` no se toca.
- **El nombre:** como las reglas se acumulan, recorrer la lista con `reduce` es en rigor una cadena de decoradores armada desde afuera. Elegimos la forma de Strategy porque cada regla se agrega a una lista y se prueba sola, sin anidar objetos. La cátedra acepta cualquiera de los dos nombres con esta justificación.

## Consecuencias

**Positivas**
- RF-11 implementado, con el detalle de cada concepto en la respuesta (`detalle`) y guardado en la reserva (`detallePrecio`).
- Cada regla se prueba sola, sin base de datos.
- El horario pico se define una sola vez (`esHorarioPico`) y lo usan la grilla y el recargo.

**Negativas / riesgos**
- Para seguir el cálculo hay que recorrer cuatro archivos en vez de un método. Se mitiga con el armado de la lista en un único lugar, comentado.
- La hora del pico se toma del reloj del servidor, igual que el resto del módulo de canchas. Si el servidor corre en otra zona horaria, hay que configurarlo en la de Argentina.

## Cómo se verifica

```bash
npm test -- precios          # test/unit/precios.test.js: cada regla, la combinación y los bordes del pico
npm test -- canchas.api      # test/integracion/canchas.api.test.js: GET /api/canchas/{id}/precio por HTTP
```

En Swagger: `GET /api/canchas/{id}/precio` con un socio a las 20:00 devuelve `precioFinal: 1020`.

## Requisitos relacionados

RF-11, RN-03
