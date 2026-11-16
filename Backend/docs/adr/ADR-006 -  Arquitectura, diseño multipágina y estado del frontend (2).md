# ADR-006 - Arquitectura, diseño multipágina y estado del frontend

- **Estado:** Aceptado
- **Fecha:** 2026-08-29
- **Autor:** Villagra Santiago, Ayala Franco, Sirizzotti Martín
- **Sprint:** 6

## Contexto
El sistema requería una interfaz web interactiva para que socios, clientes externos, recepcionistas y administradores pudieran gestionar reservas y accesos. Las restricciones de la cátedra evaluaban la justificación tecnológica, la estrategia de reutilización de UI (Atomic Design) y la persistencia de sesión. Al estar el backend todavía en desarrollo sin credenciales formales, el cliente web debía manejar una identificación provisoria basada en el DNI. No se disponía de tiempo para configurar herramientas complejas de compilación.

## Alternativas consideradas
| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| Framework SPA (React/Vue) + Redux/Zustand | Ecosistema rico, reactividad automática, manejo de componentes y estado global nativos. | Agrega una capa inmensa de complejidad (requiere Node, Vite/Webpack, compilación) y mayor curva de aprendizaje. | Porque la sobrecarga de configuración y compilación excedía los plazos y restricciones del proyecto. |
| Web Components nativos | Encapsulamiento real en el navegador sin depender de librerías externas. | La inyección de HTML y el manejo de eventos dentro del *Shadow DOM* complican la interacción con los estilos CSS globales. | Porque aislar completamente los estilos con Shadow DOM dificultaba el diseño unificado requerido. |
| JavaScript Vanilla (Multi-página) + DOM manual + sessionStorage | Cero dependencias, cero tiempo de compilación. Corre directo con Live Server, HTML aislado y depuración sencilla. | Hay que escribir la inyección de UI manualmente. El estado no es reactivo automáticamente entre múltiples pestañas. | (Alternativa elegida) |

## Decisión
Se decidió utilizar JavaScript Vanilla (sin frameworks), estructurado como aplicación multi-página (MPA), usando `sessionStorage` para mantener la sesión del usuario logueado en la pestaña activa, y manipulación directa del DOM (`js/ui.js`) para modularizar la UI aplicando *Atomic Design*. El criterio determinante fue mantener el desarrollo ágil, priorizando una carga inicial rápida sin dependencias ni herramientas de *build*.

## Consecuencias
- **Positivas:** Desarrollo y depuración muy rápidos. Separación limpia de responsabilidades en la carpeta `js/` (servicios API, sesión, UI global, controladores de página).
- **Negativas:** La creación de elementos complejos mediante inyección de *strings* HTML es propensa a errores tipográficos. La sesión del `sessionStorage` obliga al usuario a volver a loguearse si abre un link en una pestaña nueva.
- **Deuda asumida:** Si el proyecto crece, habrá que implementar o integrar un motor de plantillas ligero en lugar de usar `innerHTML` para evitar posibles inyecciones XSS y mejorar la mantenibilidad de las vistas.

## Requisitos relacionados
RF-01, RF-02, RF-06, RF-10, RNF-04