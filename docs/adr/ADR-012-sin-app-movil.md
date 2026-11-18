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
(`frontend/js/router.js` + `views/`). El QR dinámico del socio (RF-04) es una página web pensada
para el celular (`views/qr.js`), que se renueva sola cada minuto.

## Consecuencias

**Positivas** — Un frontend para mantener; menos superficie de trabajo; el flujo de reserva existe
una sola vez; el diagrama de contenedores queda más simple.

**Negativas / riesgos** — La experiencia en el celular depende de tener conexión: no hay un modo
verdaderamente offline salvo que más adelante se sume un Service Worker, fuera del alcance de este
TP. RNF-01 (control de acceso operativo aunque falle internet) queda del lado del torno/recepción y
se documenta como limitación.

## Cómo se verifica

`frontend/index.html` (una sola app), `frontend/js/views/qr.js`, diagrama de contenedores en `docs/TP_FitZone_Unidad_I_ADR.pdf`.

## Requisitos relacionados

Unidad VI; RF-04, RNF-01
