# ADR-006 — Arquitectura, diseño multipágina y estado del frontend

- **Estado:** Aceptado
- **Fecha:** 2026-08-29
- **Autor:** Villagra, Santiago Agustín; Ayala, Franco; Sirizzotti, Martín Emiliano
- **Sprint:** 6

## Contexto

El sistema requería una interfaz web interactiva para que socios, clientes externos, recepcionistas y administradores pudieran gestionar reservas, membresías y accesos. Las restricciones de la cátedra evaluaban la justificación tecnológica, la estrategia de reutilización de interfaz y la persistencia de sesión. Al estar el backend todavía en desarrollo sin credenciales formales al inicio del proyecto, el cliente web debía manejar una identificación provisoria basada en el DNI, sin disponer de tiempo de cursada para configurar herramientas complejas de compilación.

## Alternativas consideradas

| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| Framework SPA (React / Vue) + Redux / Zustand | Ecosistema rico, reactividad automática, manejo de componentes y estado global nativos. | Agrega una capa alta de complejidad (requiere Node, Vite/Webpack, compilación) y mayor curva de aprendizaje. | Porque la sobrecarga de configuración y compilación excedía los plazos y restricciones del proyecto. |
| Web Components nativos | Encapsulamiento real en el navegador sin depender de librerías externas. | La inyección de HTML y el manejo de eventos dentro del *Shadow DOM* complican la interacción con los estilos CSS globales. | Porque aislar completamente los estilos con *Shadow DOM* dificultaba mantener una hoja de estilos unificada. |
| **JavaScript Vanilla (multipágina) + DOM manual + `sessionStorage`** | Cero dependencias y cero tiempo de compilación; corre directo con Live Server, con HTML aislado y depuración sencilla. | Requiere escribir la inyección de UI manualmente y el estado no es reactivo automáticamente entre múltiples pestañas. | **Elegida.** |

## Decisión

Se decidió utilizar **JavaScript Vanilla** (sin frameworks), estructurado como aplicación multipágina (MPA), utilizando `sessionStorage` para mantener la sesión del usuario activo en la pestaña actual y manipulación directa del DOM mediante un módulo común (`js/ui.js`) para reutilizar componentes visuales. 

El criterio determinante fue mantener el desarrollo ágil y desacoplado en carpetas claras (`js/api.js`, `js/sesion.js`, `js/ui.js`), priorizando una carga inicial rápida sin dependencias ni herramientas de *build*.

## Consecuencias

- **Positivas:** Desarrollo y depuración rápidos; separación limpia de responsabilidades entre capa de red, sesión, componentes visuales y controladores de cada pantalla.
- **Negativas:** La construcción de bloques HTML dinámicos mediante concatenación o *template strings* requiere cuidado ante errores tipográficos, y el uso de `sessionStorage` obliga a volver a ingresar si se abre el sistema en una pestaña nueva.
- **Deuda asumida:** Si el proyecto crece en cantidad de vistas, será necesario incorporar un motor de plantillas ligero o sanitización estricta en lugar de usar `innerHTML` para evitar riesgos de inyección XSS y mejorar la mantenibilidad.

## Requisitos relacionados

RF-01, RF-02, RF-06, RF-10, RNF-04