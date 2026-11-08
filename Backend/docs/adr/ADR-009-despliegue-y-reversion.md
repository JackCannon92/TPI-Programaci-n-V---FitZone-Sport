# ADR-009 — Despliegue: contenedores Docker, pipeline en GitHub Actions y reversión por versión etiquetada

- **Estado:** Propuesto
- **Fecha:** 2026-11-07
- **Autor:** Sirizzotti, Martín Emiliano
- **Sprint:** 6

## Contexto

Hasta la semana 10 el sistema se levantaba a mano en cada computadora: instalar Node, correr `npm install`, copiar el `.env` y apuntar a la base de Supabase. Eso trajo problemas reales: dependencias que faltaban (`MODULE_NOT_FOUND`), `nodemon` sin instalar, y una base que dejaba de responder cuando Supabase pausaba el proyecto.

Los lineamientos de entrega exigen que el sistema se levante con un solo comando (`docker compose up --build`), con datos de ejemplo, que haya un pipeline de integración continua y que exista un procedimiento para volver a la versión anterior si un despliegue sale mal.

## Alternativas consideradas

| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| Seguir instalando a mano, con una guía | No hay nada nuevo que aprender. | Cada máquina queda distinta; los errores dependen de la versión de Node y de lo instalado; depende de Supabase para arrancar. | Es justamente el problema que había que resolver. |
| Máquina virtual (VirtualBox o Vagrant) | Entorno idéntico para todos. | Imágenes pesadas, arranque lento, mucho consumo de recursos. | Excesivo para una API y una base. |
| Kubernetes | Escala, se recupera solo y despliega sin cortes. | Curva de aprendizaje muy alta y un clúster que administrar. | Desproporcionado para el tamaño del sistema y del equipo. |
| Plataforma como servicio (Render, Railway) | Despliegue con un clic. | Dependencia de un proveedor y de su plan gratuito; no resuelve el entorno local. | No cumple "levantar con un comando" en cualquier máquina. |
| GitLab CI o Jenkins para el pipeline | Muy completos. | GitLab CI exige mover el repositorio; Jenkins exige un servidor propio. | El repositorio ya está en GitHub. |
| **Docker + Docker Compose, con pipeline en GitHub Actions** | Un solo comando levanta API y base iguales en cualquier máquina; las imágenes quedan versionadas; GitHub Actions está integrado al repositorio y es gratuito. | Hay que aprender Docker; las imágenes ocupan espacio. | **Elegida.** |

## Decisión

**Contenerización.** La API tiene su `Dockerfile` (Node 20). Un `docker-compose.yml` levanta dos servicios: `api` y `db` (PostgreSQL 16). Al crear la base por primera vez se ejecutan el esquema (`docs/esquema-base.sql`) y la semilla con las 25 sedes y un usuario por rol. La configuración va por variables de entorno; los secretos nunca se incluyen en la imagen ni en el repositorio.

**Pipeline (GitHub Actions)**, en cada Pull Request y en cada push a `main`:

1. instala las dependencias con `npm ci`;
2. corre las pruebas con cobertura; si alguna falla o la cobertura queda por debajo del umbral del ADR-008, el pipeline se detiene;
3. construye la imagen de Docker y la etiqueta con el hash del commit;
4. despliega en el entorno de pruebas: levanta el `docker compose` en el propio runner y verifica que `GET /api/health` responda.

**Reversión.** Cada versión entregada se marca con un tag anotado (por ejemplo `v1.0-entrega`) y su imagen queda guardada con esa etiqueta. Si un despliegue sale mal:

1. se vuelve a levantar la imagen de la versión anterior (`docker compose` apuntando a la etiqueta previa);
2. se deshace el cambio con `git revert` (nunca reescribiendo el historial), para que `main` vuelva a un estado sano y el pipeline lo verifique;
3. los cambios de base de datos se escriben solo **agregando** (columnas o tablas nuevas, nunca borrando ni renombrando en el mismo despliegue), así la versión anterior sigue funcionando con la base nueva. Antes de cada versión se guarda una copia con `pg_dump`.

El criterio determinante fue **que cualquiera pueda levantar exactamente lo mismo con un comando**, y volver atrás sin depender de quién hizo el cambio.

## Consecuencias

- **Positivas:** se termina el "en mi máquina anda"; el sistema se puede levantar y demostrar sin Supabase; ningún cambio llega a `main` sin pasar las pruebas; volver a la versión anterior es levantar una imagen que ya existe.
- **Negativas:** el equipo tiene que aprender Docker; el pipeline tarda unos minutos por cada cambio; las imágenes ocupan espacio en disco.
- **Deuda asumida:** el "entorno de pruebas" es el propio runner del pipeline; un despliegue real necesitaría un servidor o un servicio en la nube, un registro de imágenes y migraciones de base versionadas con una herramienta específica.

## Requisitos relacionados

Unidad V; RNF-01, RNF-04
