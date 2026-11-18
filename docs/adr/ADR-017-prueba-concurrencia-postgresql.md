# ADR-017 — Prueba de concurrencia de RN-02 contra PostgreSQL real

- **Estado:** Aceptado. Complementa ADR-008, no lo reemplaza.
- **Fecha:** 2026-11-18
- **Autor:** Sirizzotti, Martín Emiliano
- **Sprint:** 6

## Contexto

ADR-008 decidió que las pruebas unitarias y de integración corran sin base de datos, con repositorios en memoria. Para RN-02 eso prueba la lógica (el segundo pedido del mismo turno recibe 409), pero no lo que realmente impide la sobreventa: el índice único parcial `uq_reserva_cancha_turno_activo` de ADR-004. Si alguien borra o cambia ese índice, las 113 pruebas siguen en verde. Los lineamientos piden además una carpeta de pruebas de concurrencia (`test/` con unitarias, integración y concurrencia).

## Alternativas consideradas

| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| Dejarlo solo para la demo | No hay nada que mantener. | Nada lo verifica en cada cambio. | La regla más delicada del caso queda sin prueba automática. |
| Pasar todas las pruebas a una base real | Máximo realismo. | Lentas y dependientes de una base en cada máquina. | Contradice ADR-008 sin necesidad. |
| Base en memoria compatible (pg-mem) | No requiere servidor. | No reproduce bloqueos ni índices parciales de forma fiable. | Justo lo que hay que probar es el comportamiento real de PostgreSQL. |
| **Una prueba aparte contra PostgreSQL, en el pipeline con una base de servicio** | Prueba el índice real; no cambia el resto de la suite. | Hace falta una base para correrla. | **Elegida.** |

## Decisión

Se agrega `backend/test/concurrencia/reserva-cancha.concurrencia.test.js`, que levanta la API completa contra la base indicada en `DATABASE_URL` y manda seis pedidos simultáneos del mismo turno de la misma cancha. Tiene que haber exactamente una reserva (201) y cinco rechazos (409). Se corre con `npm run test:concurrencia`; `npm test` no la incluye y, sin `DATABASE_URL`, se saltea. El pipeline la corre en la etapa 1 con un PostgreSQL 16 de servicio, cargado con el esquema y el seed.

Se verificó que la prueba detecta el problema: con el índice borrado, los seis pedidos quedan confirmados y la prueba falla.

## Consecuencias

- **Positivas:** si se toca el índice de RN-02, el pipeline lo frena; la demo obligatoria de concurrencia tiene una prueba que la respalda.
- **Negativas:** la etapa 1 del pipeline tarda unos segundos más; para correrla en local hace falta una base.
- **Deuda asumida:** no hay pruebas de concurrencia para la reserva de clases (bloqueo de fila de RF-07).

## Requisitos relacionados

RN-02; ADR-004; ADR-008
