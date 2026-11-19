# 8. Análisis de desvíos

Con los números de [06-seguimiento.md](06-seguimiento.md) y [04-asignacion-y-carga.md](04-asignacion-y-carga.md) a la vista.

## 1. ¿Dónde se estimó mal y por qué?

**El plan se estimó de arriba hacia abajo.** Se repartieron las 76 horas que fija el programa entre las unidades y las semanas, y después se escribieron tareas que cupieran en esas horas. No se partió del trabajo para llegar a las horas. Por eso aparecen estimaciones como una hora por pantalla del frontend (catorce horas para toda la aplicación web) o seis horas para todas las pruebas del sistema. Lo que no se vio al estimar fue el tamaño real de cada módulo: la aplicación web terminó con diez pantallas, lector de QR por cámara y un modo sin conexión, y las pruebas llegaron a 113.

**La documentación no estaba estimada.** El plan no tenía horas para ADR, diagramas, manuales ni planificación, porque se armó sobre la consigna original. Cuando llegaron los lineamientos del 06/11, todo eso entró como trabajo agregado en el sprint 6 y consumió el colchón de la semana 11.

**No se vieron las dependencias entre tareas.** El plan ponía el frontend (sprints 3 y 4) después del backend, pero sin margen: cuando Acceso y los patrones se atrasaron (01/10 y 13/10), el frontend no tenía contra qué integrar. El desvío acumulado llegó a −10 horas en el sprint 4 por esa cadena, no por una tarea aislada.

**Docker y el pipeline** estaban en el sprint 5 y se hicieron el 16/11. No fue un error de tamaño (llevaron lo previsto): quedaron detrás de las tareas agregadas el 27/10, que tenían fecha de check-in.

## 2. ¿Qué riesgo se materializó y cómo se absorbió?

Se materializaron ocho de los doce riesgos del registro, y uno más en parte. Los que más pesaron:

- **R2, cambios de la cátedra** (27/10, 30/10 y 06/11). Se absorbió con el colchón de 10 horas de la semana 11 y con trabajo concentrado del 08 al 17/11. El desvío acumulado pasó de −6 a 0 en el sprint 6, pero con trabajo que no estaba en el plan: 10 ADR, 14 diagramas, 3 manuales y esta planificación.
- **R3, indisponibilidad por exámenes.** El check-in del 17/09 se corrió al 01/10 y Acceso y canchas se atrasaron un sprint. Se absorbió porque Ayala armó los módulos 2 a 5 juntos entre el 26/09 y el 01/10.
- **R4 y R9, frontend atrasado y carga concentrada.** Se absorbieron reasignando: Sirizzotti terminó el frontend y Villagra tomó documentación de arquitectura (tres ADR, tres diagramas y el manual de usuario). Funcionó para llegar a la fecha, pero dejó la carga muy despareja (46 horas completadas contra 24 comprometidas).

## 3. ¿Qué se replanificaría si el proyecto empezara de nuevo el lunes?

1. **Estimar de abajo hacia arriba** desde este desglose del trabajo, con la documentación incluida, y recién después comparar contra las 76 horas para recortar alcance si no entra.
2. **Trabajar por módulo completo** (backend, pantalla y prueba juntos) en lugar de todo el backend primero y todo el frontend después: así un atraso del backend no deja al frontend sin trabajo, y cada integrante tiene un módulo de punta a punta.
3. **Registrar horas y riesgos desde el sprint 1.** La falta de horas registradas impidió comparar esfuerzo real contra estimado, y el registro de riesgos se armó al final. Una planilla con horas por sesión y una lista de riesgos revisada en cada check-in cuestan minutos por semana.
4. **Hacer commits desde el primer día** en el repositorio definitivo, para que el trabajo de cada uno sea verificable sin depender de las bitácoras.
5. **Fijar el calendario de check-ins contra el de exámenes** al armar el plan, y nombrar un suplente para cada líder.
6. **Escribir los ADR y los diagramas cuando se toma la decisión,** no cuando se pide el entregable: los ADR de septiembre se reescribieron en noviembre.
