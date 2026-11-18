# ADR-010 — Tratamiento de los medios de pago mediante tokenización

- **Estado:** Aceptado
- **Fecha:** 2026-11-13
- **Autor:** Villagra, Santiago Agustín; Ayala, Franco; Sirizzotti, Martín Emiliano
- **Sprint:** 6

## Contexto

El sistema debía procesar cobros en línea para las reservas de canchas y membresías (RF-13), bajo la restricción estricta de proteger la información bancaria de los usuarios (RNF-02). El equipo no contaba con la infraestructura certificada ni los plazos necesarios para cumplir con auditorías PCI-DSS que permitieran manipular o almacenar datos sensibles de tarjetas directamente en la base de datos propia.

## Alternativas consideradas

| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| Almacenar PAN y CVV en la base de datos | Permite reintentar cobros y gestionar suscripciones sin intermediarios. | Prohibido por normativa PCI-DSS; expone al sistema a riesgos legales y filtraciones masivas de tarjetas. | Por el riesgo crítico de seguridad y el incumplimiento normativo en la protección de datos. |
| Guardar solo el número enmascarado sin pasarela | Fácil de mostrar en la interfaz y en los comprobantes. | No permite validar fondos ni procesar transacciones de cobro real. | Porque imposibilita cumplir con el requerimiento funcional de cobrar las reservas en el sistema. |
| **Tokenización con pasarela externa y guardado de últimos 4 dígitos** | Mantiene los datos bancarios fuera del servidor propio; si la base es vulnerada, solo se exponen tokens sin valor fuera de la pasarela. | Requiere desacoplar el procesamiento y desarrollar un adaptador simulado (`mock`) durante la etapa de desarrollo. | **Elegida.** |

## Decisión

Se decidió no persistir datos completos de tarjetas de crédito o débito (PAN ni CVV) en el sistema y delegar el procesamiento a una pasarela externa (implementada provisoriamente mediante `pasarela-mock.js`), guardando en `PagoModel` únicamente el token de transacción generado y los últimos 4 dígitos del plástico para referencia del comprobante.

El criterio determinante fue garantizar el cumplimiento de seguridad (RNF-02) y eliminar cualquier responsabilidad de custodia sobre datos financieros sensibles.

## Consecuencias

- **Positivas:** Cumplimiento de buenas prácticas de seguridad informática; la base de datos de FitZone no almacena credenciales bancarias ante una eventual filtración.
- **Negativas:** Añade dependencia de red y latencia externa durante el flujo de confirmación del pago.
- **Deuda asumida:** Al momento del despliegue en producción, se deberá reemplazar el adaptador `pasarela-mock.js` por la integración real con el SDK de Mercado Pago o Stripe, respetando exactamente la misma interfaz de contrato.

## Requisitos relacionados

RF-13, RF-14, RNF-02