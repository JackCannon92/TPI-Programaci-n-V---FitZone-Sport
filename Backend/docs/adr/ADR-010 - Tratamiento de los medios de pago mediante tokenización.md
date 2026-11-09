# ADR-010 - Tratamiento de los medios de pago mediante tokenización

- **Estado:** Aceptado
- **Fecha:** 2026-11-13
- **Autor:** Villagra Santiago, Ayala Franco, Sirizzotti Martín
- **Sprint:** 6

## Contexto
El sistema debía procesar cobros en línea para las reservas de canchas y membresías (RF-13). Existía la restricción estricta de asegurar la información bancaria de los usuarios. El equipo no contaba con la infraestructura certificada ni los plazos necesarios para cumplir con auditorías de seguridad que permitieran manipular o guardar datos sensibles de los plásticos directamente en la base de datos propia.

## Alternativas consideradas
| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| Almacenar PAN y CVV en la base de datos | Permite reintentar cobros y gestionar suscripciones sin intermediarios. | Prohibido por la normativa PCI-DSS. Expone al sistema a riesgos legales y filtraciones masivas de tarjetas. | Por el riesgo crítico de seguridad y el incumplimiento legal de las normativas de protección de datos. |
| Guardar solo el número enmascarado sin pasarela | Fácil de mostrar en la interfaz y en los comprobantes PDF. | No permite validar fondos ni procesar transacciones de cobro real. | Porque imposibilita cumplir con el requerimiento funcional de cobrar las reservas en el sistema. |
| Tokenización con pasarela externa y guardado de últimos 4 dígitos | Mantiene los datos bancarios fuera de nuestro servidor. Si la base es vulnerada, solo se exponen tokens inservibles. | Requiere desacoplar el procesamiento y desarrollar un simulador (`mock`) de la API para la etapa de desarrollo. | (Alternativa elegida) |

## Decisión
Se decidió no persistir datos de tarjetas de crédito (PAN y CVV) en el sistema y delegar el procesamiento a una pasarela externa (implementada provisoriamente mediante `pasarela-mock.js`), guardando en `PagoModel` únicamente el token generado y los últimos 4 dígitos del plástico. El criterio determinante fue garantizar el estricto cumplimiento de las normativas de seguridad (RNF-02) y mitigar cualquier responsabilidad legal sobre datos sensibles.

## Consecuencias
- **Positivas:** Cumplimiento total de los estándares de seguridad informática; el sistema de FitZone no asume riesgo ante filtraciones.
- **Negativas:** Añade latencia en el proceso de pago debido a la dependencia de comunicación de red con el servicio de la pasarela externa.
- **Deuda asumida:** Al momento del despliegue en producción, se deberá eliminar el módulo `pasarela-mock.js` y reemplazarlo por la integración real con el SDK de Mercado Pago o Stripe, respetando exactamente el mismo contrato.

## Requisitos relacionados
RF-13, RF-14, RNF-02