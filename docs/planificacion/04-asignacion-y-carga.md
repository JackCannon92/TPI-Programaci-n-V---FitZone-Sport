# 4. Asignación y carga

Dos medidas por integrante y por sprint:

- **Plan:** horas del plan asignadas a sus tareas.
- **Completado:** horas del plan de las tareas que esa persona terminó, sean suyas o de otro. Así se ve quién absorbió el trabajo que se corrió.

Las horas efectivamente trabajadas, según las bitácoras, están en [06-seguimiento.md](06-seguimiento.md).

## 4.1 Plan contra completado (horas del plan)

| Sprint | Ayala plan | Ayala compl. | Sirizzotti plan | Sirizzotti compl. | Villagra plan | Villagra compl. | Equipo plan | Equipo compl. |
|---|---|---|---|---|---|---|---|---|
| 1 | 12 | 12 | — | — | — | — | — | — |
| 2 | 8 | 8 | 8 | — | — | — | — | — |
| 3 | — | 4 | 4 | 5 | 4 | — | — | — |
| 4 | — | — | — | 7 | 10 | — | — | — |
| 5 | — | — | 12 | 16 | — | — | — | — |
| 6 | — | — | — | 18 | — | — | 16 | 4 |
| 7 y 8 | — | — | — | — | — | — | 2 | — |
| **Total** | **20** | **24** | **24** | **46** | **14** | **0** | **18** | **4** |

Completado al 17/11: 74 de 76 horas; faltan el ensayo y la defensa (sprints 7 y 8). Las 4 horas del equipo en el sprint 6 son "Recuperar el atraso", hechas entre los tres con ADR, diagramas y manuales.

Esta tabla solo cuenta las tareas que estaban en el plan. El 0 de Villagra no quiere decir que no haya trabajado: su aporte desde el sprint 6 fueron tareas agregadas por la cátedra, que no tenían horas en el plan y se detallan en 4.2.

## 4.2 Qué hizo cada uno fuera de sus tareas del plan

Las tareas agregadas por la cátedra no tenían horas en el plan, así que no entran en la tabla anterior. Este es el reparto:

| Integrante | Tareas agregadas que hizo | Evidencia |
|---|---|---|
| Ayala | ADR-001 a 004, 011 y 012; C4 de contexto y contenedores, DER y despliegue; esquema SQL con datos de prueba de 25 sedes y 4 roles; manual técnico | `bd48c52`, `2a4bbd5`, `ace9ac7`, `05c0596` |
| Sirizzotti | Quitar CQRS y un ADR por patrón; los cuatro QR nuevos; ADR-005, 008, 009 y 013 a 016; C4 de componentes, clases, secuencias y pipeline; manual de instalación; sincronización del terminal (ADR-007) | `d6170be`, `21e1539`, `b7a6848`, `c96f322`, `bd16e21`, `9b14f0b` |
| Villagra | Revisión de las pantallas del frontend con Sirizzotti por Discord (12/10 y 27/10); ADR-006, 007 y 010; tres diagramas (actividad de la lista de espera, estados de la membresía y estados de la reserva); manual de usuario; transmitir al equipo las indicaciones del check-in del 27/10 | `fd81941`, `848a154`, `6973c4b` |

## 4.3 Desbalances

Se muestran tal como ocurrieron, como piden los lineamientos.

1. **El frontend se corrió de Villagra a Sirizzotti.** Las 14 horas de la Unidad IV eran de Villagra. Las pantallas de los sprints 3 y 4 no estaban listas a tiempo, y Sirizzotti las terminó el 02/10 (base) y el 28/10 (reservas, servicio e integración), dos semanas después de lo previsto; Villagra las revisó con él por Discord el 12/10 y el 27/10, corrigiéndolas contra lo que había que entregar. Desde el sprint 6, Villagra tomó documentación de arquitectura: tres ADR, tres diagramas y el manual de usuario.
2. **Sirizzotti completó casi el doble de lo comprometido** (46 contra 24 horas del plan): el frontend corrido, el refuerzo de RNF y la integración del sprint 6, además de casi todas las tareas agregadas. Es el desbalance más grande del proyecto (riesgo R9).
3. **Ayala hizo el Módulo Acceso**, que era de Sirizzotti en el sprint 2, y armó la base de clases, canchas y pagos sobre la que después se aplicaron los patrones.
4. **El tramo de integración** (16 horas del equipo) lo hizo en su mayor parte Sirizzotti: correcciones del 16/11, sincronización offline y pruebas de punta a punta del 17/11. La parte compartida fue la documentación.

Qué se replanificaría para evitarlo: ver [08-analisis-de-desvios.md](08-analisis-de-desvios.md).
