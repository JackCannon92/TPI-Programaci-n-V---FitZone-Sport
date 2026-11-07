# ADR-008 — Estrategia de pruebas: pirámide con Jest y Supertest, sin base de datos y con cobertura mínima

- **Estado:** Aceptado
- **Fecha:** 2026-10-28
- **Autor:** Sirizzotti, Martín Emiliano
- **Sprint:** 5

## Contexto

Al llegar a la Unidad V había 32 pruebas escritas con el runner nativo de Node, todas unitarias, y el plan del equipo pedía Jest. Había que decidir qué probar, con qué herramientas, contra qué base de datos y cuánto código tenía que quedar cubierto.

Las restricciones eran:

- la base es un PostgreSQL en el plan gratuito de Supabase, que se pausa si no se usa (el 28/10 el servidor no arrancaba por eso);
- la base es compartida por los tres integrantes, así que una prueba que escriba en ella altera los datos de los demás;
- las reglas más importantes (precio dinámico, RN-02, lista de espera, QR) tenían que poder verificarse en segundos, cada vez que alguien sube un cambio.

## Alternativas consideradas

| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| Seguir con el runner nativo de Node (`node:test`) | Sin dependencias. | No trae dobles de prueba (`jest.fn`) ni reporte de cobertura integrado; el plan pedía Jest. | Habría que sumar librerías para lo que Jest ya trae. |
| Probar contra la base real de Supabase | Es lo más parecido a producción. | Lentas; fallan si Supabase está pausado; ensucian la base compartida; los resultados dependen de los datos del momento. | Las pruebas tienen que poder correr siempre y dar siempre lo mismo. |
| Solo pruebas manuales en Swagger | No hay que escribir código de prueba. | No se repiten solas; nadie las corre antes de cada commit. | No sirve como red de seguridad. |
| **Pirámide con Jest y Supertest, con dobles de prueba en lugar de la base** | Rápidas, deterministas y sin dependencias externas; Jest trae dobles y cobertura; Supertest prueba la API por HTTP sin levantar el servidor. | El repositorio en memoria imita a PostgreSQL pero no es PostgreSQL. | **Elegida.** |

## Decisión

Adoptamos una **pirámide de pruebas**:

1. **Base: pruebas unitarias con Jest** (`test/unit/`, 72 pruebas). Cubren las reglas de negocio de cada servicio y de cada patrón: las estrategias de precio y el Tarifador, RN-02 con el repositorio en memoria, las membresías (incluidas pruebas de caracterización que fijan rarezas documentadas, como el olor O-6), el Observer de la lista de espera y los cinco tipos de QR.
2. **Medio: pruebas de integración con Supertest** (`test/integracion/`, 27 pruebas). Recorren la API por HTTP con el router, el servicio y el manejador de errores reales, cambiando solo el repositorio por uno en memoria.
3. **Punta: prueba de punta a punta manual**, siguiendo el guion de la demo con la base real (reserva, pago, comprobante, ingreso con QR).

Los **dobles de prueba** están centralizados en `test/dobles/fitzone.js`: repositorios en memoria (*fakes*), un servicio de usuarios con datos fijos (*stub*) y funciones espía de Jest (*mocks*). Funciona porque los servicios reciben sus dependencias por inyección (composition root): la prueba arma el mismo servicio con otras piezas.

**Umbral mínimo de cobertura: 70 % de líneas y 50 % de ramas**, verificado por Jest (`coverageThreshold` en `package.json`). Si un cambio baja la cobertura de ese piso, `npm test` falla y el pipeline también (ADR-009). Al momento de esta decisión la cobertura medida era de alrededor del 81 % de líneas y 59 % de ramas, así que el umbral deja margen sin ser decorativo.

El criterio determinante fue que **las pruebas tienen que poder correr en cualquier máquina, en segundos y sin Supabase**, para que se corran de verdad antes de cada commit.

## Consecuencias

- **Positivas:** las 99 pruebas corren en pocos segundos y dan siempre el mismo resultado; se pueden correr sin conexión; probar la API completa por HTTP detectó errores que no se veían leyendo el código (el 400 en lugar de 404 del olor O-11, y el 409 de RN-02 que no llegaba al cliente por el olor O-8).
- **Negativas:** el repositorio en memoria imita el índice único de PostgreSQL, pero no lo es; un error en esa imitación no lo detectaría ninguna prueba. Las pruebas de punta a punta son manuales.
- **Deuda asumida:** sumar una prueba de concurrencia contra un PostgreSQL real en un contenedor (dos reservas en paralelo para el mismo turno, RN-02) y automatizar las pruebas de punta a punta del portal con una herramienta como Playwright.

## Requisitos relacionados

Unidad V; RN-02, RF-08, RF-11, RF-04