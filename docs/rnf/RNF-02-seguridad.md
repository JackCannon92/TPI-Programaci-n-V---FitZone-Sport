# RNF-02 · Datos de tarjeta

> Los datos de tarjeta de crédito no se almacenan localmente; solo se guarda el token de la pasarela.

## Cómo se cumple

La API recibe la tarjeta en `POST /api/v1/pagos` y se la pasa a la pasarela (simulada, `backend/src/pagos/pasarela-mock.js`). La pasarela devuelve un token y los últimos cuatro dígitos, y eso es lo único que se guarda (ADR-010). La tabla `pagos` no tiene columnas para el número, el titular, el vencimiento ni el código de seguridad:

```
 Column            | Type
-------------------+--------------------------
 id                | uuid
 usuario_id        | uuid
 reserva_cancha_id | uuid
 membresia_id      | uuid
 monto             | numeric(10,2)
 estado            | character varying(20)
 token_pasarela    | character varying(80)
 ultimos4          | character varying(4)
 motivo_rechazo    | character varying(120)
 created_at        | timestamp with time zone
 updated_at        | timestamp with time zone
```

## Medición (18/11/2026)

Se pagó una reserva con la tarjeta `4111 1111 1111 1234`, titular `LUCIA FERNANDEZ`, vencimiento `12/29` y código `123`.

Respuesta de la API:

```json
{ "estado": "APROBADO", "monto": "12750.00", "tokenPasarela": "tok_5e1e8373503dc91f30aed073", "ultimos4": "1234" }
```

Lo que quedó en la base:

```
  estado  |  monto   |        token_pasarela        | ultimos4
----------+----------+------------------------------+----------
 APROBADO | 12750.00 | tok_5e1e8373503dc91f30aed073 | 1234
```

Búsqueda del número completo y del titular en un volcado de **todos los datos** de la base (`pg_dump --data-only`): **0 apariciones**.

## Límite

Sin una prueba automática que lo verifique (hueco señalado en la matriz de trazabilidad). La pasarela es simulada y la tarjeta pasa por el backend en memoria antes de tokenizarse; con una pasarela real convendría tokenizar directamente en el navegador.
