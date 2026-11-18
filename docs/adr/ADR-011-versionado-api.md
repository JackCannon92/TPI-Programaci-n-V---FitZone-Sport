# ADR-011 — Versionado de la API

- **Estado:** Aceptado
- **Fecha:** 2026-09-07
- **Autor:** Ayala, Franco
- **Sprint:** 1
- **Rama:** `contrato-api` (Laboratorio 2 — Unidad II)
- **Relacionado:** ADR-005 (Express + JavaScript vanilla), `backend/openapi.yaml`

## Contexto

La API de FitZone Sports tiene hoy un único consumidor propio (la Aplicación Web en JavaScript
vanilla), pero el caso plantea 25+ sucursales y la posibilidad de otros clientes (por ejemplo un
lector de QR en los tornos, o una app externa de reservas). Cuando eso ocurra, no vamos a poder
cambiar el contrato "de un día para el otro": un cliente viejo tiene que seguir funcionando
mientras uno nuevo usa la versión nueva.

Además, en este laboratorio formalizamos el contrato en `openapi.yaml` (*contract-first*): el
contrato es la fuente de verdad, de él se genera el cliente tipado del frontend y contra él se
verifica el proveedor. Un contrato versionado necesita una convención de versionado explícita.

## Alternativas consideradas

| Alternativa | Ejemplo | A favor | En contra | Por qué se descartó |
|---|---|---|---|---|
| **Prefijo en la URL** | `/api/v1/usuarios` | Visible y explícito; trivial de rutear en Express (`app.use('/api/v1', ...)`); fácil de probar con curl, Swagger y el navegador; cacheable; un `openapi.yaml` por versión. | "Ensucia" la URL; en teoría REST el recurso es el mismo aunque cambie la representación. | **Elegida.** |
| Header `Accept` con media type | `Accept: application/vnd.fitzone.v1+json` | La URL del recurso no cambia; "más REST". | Invisible en el navegador y en Swagger UI; difícil de probar a mano; el equipo y los clientes ocasionales lo olvidan; Express necesita middleware propio para despachar por header. | Invisible en el navegador y en Swagger: difícil de probar a mano. |
| Header custom | `X-API-Version: 1` | Simple de implementar. | Mismos problemas de visibilidad; no es estándar. | Los mismos problemas de visibilidad, y no es estándar. |
| Query string | `/api/usuarios?version=1` | Fácil. | Mezcla versión con filtros; cacheo y documentación confusos. | Mezcla la versión con los filtros y confunde la documentación. |
| Sin versionar (solo cambios compatibles) | `/api/usuarios` | Nada que mantener. | Irreal: RN/RF nuevos del caso (tenis, promos) van a romper contratos eventualmente. | Un cambio incompatible rompería a los clientes existentes. |

## Decisión

**Versionado por prefijo de URL, con versión mayor únicamente: `/api/v1/...`.**

Reglas que adoptamos:

1. **Todo lo que no rompe se hace dentro de la misma versión**: agregar endpoints, agregar campos
   opcionales a respuestas, agregar valores a un enum del lado de entrada. Los clientes deben
   tolerar campos desconocidos (el cliente generado ignora propiedades extra).
2. **Rompe el contrato → nueva versión mayor** (`/api/v2`): quitar o renombrar un campo, cambiar un
   tipo, cambiar semántica de un código de estado, quitar un endpoint, agregar un campo
   obligatorio a un request.
3. **Un `openapi.yaml` por versión mayor** (`backend/openapi.yaml` es v1; una v2 sería
   `backend/openapi.v2.yaml`) y ambos se sirven en Swagger. La versión semántica completa del
   contrato va en `info.version` (hoy `1.0.0`): *minor* para agregados compatibles, *patch* para
   correcciones de documentación.
4. **Convivencia y baja**: cuando exista v2, v1 sigue montada al menos un cuatrimestre con un
   header `Deprecation: true` y `Sunset: <fecha>` en sus respuestas; después se retira.
5. **Sin versionar**: `/health`, `/docs`, `/docs.json` y la Aplicación Web estática.

## Consecuencias

**Positivas**
- La versión se ve en cada URL, log, test y captura de Swagger: cero ambigüedad para el equipo y para el docente.
- Implementación de una línea por router en `app.js`; el cliente generado toma el prefijo de `servers[0].url` del contrato.
- El test de contrato (`tests/contrato-api.test.js`) comprueba que todo lo montado bajo `/api/v1` esté declarado en `openapi.yaml` y viceversa: no puede aparecer un endpoint "fuera de versión".

**Negativas / riesgos**
- Mantener dos versiones en paralelo duplica rutas y tests durante la convivencia. Mitigación: los
  services no se duplican, solo los routers/controllers que cambien (los routers de v2 reusan los
  services de v1 salvo donde cambie la lógica).
- En la rama principal, `/api` queda por ahora como alias de `/api/v1`, para que la aplicación web
  y la documentación migren sin cortarse. Es deuda asumida: el alias se retira al publicar una v2.

## Cómo se aplicó

- En la rama `contrato-api` (Laboratorio 2) se montaron todos los routers bajo `/api/v1`, con el contrato `openapi.yaml` y pruebas de contrato.
- En `main` (08/11/2026), `src/app.js` monta los routers en `/api/v1` y deja `/api` como alias; `test/integracion/app.test.js` verifica que la API responde en `/api/v1`.

## Requisitos relacionados

Unidad II
