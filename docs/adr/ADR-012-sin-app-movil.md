# ADR-012 — Sin aplicación móvil nativa: una única Aplicación Web

- **Estado:** Aceptado
- **Fecha:** 2026-08-29
- **Autor:** Ayala, Franco
- **Sprint:** 1
- **Relacionado:** RF-04, RF-10, RNF-01, ADR-005. Figura como *ADR-004* en `TP_FitZone_Unidad_I_ADR.pdf`.

## Contexto

La cátedra indicó que la Unidad VI (ecosistema móvil) **no es obligatoria**. Mantenerla hubiera
implicado un frontend adicional (app nativa o híbrida) para un equipo de 3 personas con el
cronograma comprimido a 13 semanas, sin aportar valor evaluable. Los actores Socio y Cliente Externo
necesitan igualmente ver su QR dinámico (RF-04) y reservar canchas y clases desde el celular.

## Alternativas consideradas

| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| **Una sola Aplicación Web responsive** (HTML/CSS/JS vanilla) | Un solo frontend; sin duplicar la lógica de reservas; coherente con ADR-005; el QR se ve desde el navegador del celular. | Sin modo offline real; depende del navegador abierto. | **Elegida.** |
| App híbrida (Capacitor/Cordova) envolviendo la web | Icono en el celular, acceso a cámara. | Otra toolchain (Android Studio / Xcode) y otra unidad de trabajo que la cátedra no exige. | Otra cadena de herramientas y publicación en tiendas, sin aportar a lo que evalúa la materia. |
| App nativa (Kotlin/Swift) | Mejor UX móvil, offline. | Fuera de alcance y de las competencias del equipo en este cuatrimestre. | Fuera de alcance y de las competencias del equipo en este cuatrimestre. |

## Decisión

Se elimina el contenedor "App Móvil" del diseño C4. **Todos los roles** (Socio, Cliente Externo,
Recepcionista, Gerente Central) usan la **misma Aplicación Web**, con vistas según el rol
(`frontend/src/portal/` para socios y clientes, `frontend/src/admin/` para el personal; la barra de
navegación muestra lo que corresponde a cada rol). El QR dinámico del socio (RF-04) es una página
web pensada para el celular (`frontend/src/portal/acceso.html`), que se renueva sola cada minuto.

## Consecuencias

**Positivas** — Un frontend para mantener; menos superficie de trabajo; el flujo de reserva existe
una sola vez; el diagrama de contenedores queda más simple.

**Negativas / riesgos** — La experiencia en el celular depende de tener conexión: no hay un modo
verdaderamente offline salvo que más adelante se sume un Service Worker, fuera del alcance de este
TP. RNF-01 (control de acceso operativo aunque falle internet) se resuelve del lado de la recepción:
QR sin conexión firmado con Ed25519 (ADR-003) y cola local de ingresos que se sincroniza al volver la
red (ADR-007).

## Cómo se verifica

`frontend/src/index.html` (una sola app), `frontend/src/portal/acceso.html` y `acceso.js`, diagrama de contenedores en `docs/diagramas/c4-2-contenedores.png`.

## Requisitos relacionados

Unidad VI; RF-04, RNF-01
