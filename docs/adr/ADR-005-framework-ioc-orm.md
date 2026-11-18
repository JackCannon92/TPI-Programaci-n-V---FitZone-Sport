# ADR-005 — Framework backend, inversión de control y ORM: Express, composition root manual y Sequelize

- **Estado:** Aceptado
- **Fecha:** 2026-08-27
- **Autor:** Sirizzotti, Martín Emiliano
- **Sprint:** 1

## Contexto

Con el estilo arquitectónico definido (monolito modular, ADR-001) y la base elegida (PostgreSQL, ADR-002), había que decidir con qué construir la API REST: qué framework web, cómo se conectan las piezas entre sí (inversión de control) y cómo se accede a la base (ORM).

Las restricciones eran:

- un equipo de tres personas sin experiencia en TypeScript ni en frameworks con estructura impuesta;
- la materia evalúa que se vean la inyección de dependencias y los patrones de diseño (Strategy, Observer, Repository), así que el framework no podía esconderlos detrás de mecanismos automáticos;
- los servicios tenían que poder probarse sin base de datos (ADR-008).

## Alternativas consideradas

**Framework web**

| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| NestJS | Estructura completa: módulos, inyección de dependencias con decoradores, Swagger integrado. | Exige TypeScript en la práctica; la inyección la resuelve un contenedor automático que oculta justo lo que la materia evalúa; curva de aprendizaje alta. | Demasiado para el plazo, y esconde la inversión de control. |
| Fastify | Más rápido que Express; validación con JSON Schema incluida. | Menos material y ejemplos; el rendimiento no es el cuello de botella del caso. | Sin una ventaja que justifique aprender otra herramienta. |
| Spring Boot (Java) | Inversión de control madura y un ecosistema enorme. | Otro lenguaje para todo el equipo; más configuración y tiempos de compilación. | Costo de cambio de lenguaje. |
| **Express 5** | Mínimo y sin opiniones: la arquitectura la escribimos nosotros y queda a la vista. Ecosistema amplio (express-validator, swagger-jsdoc, Supertest). El equipo ya lo conocía. | No trae estructura ni inyección de dependencias: exige disciplina. Sin tipado estático. | **Elegida.** |

**Inversión de control**

| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| Cada servicio hace `require` de lo que usa | Lo más directo. | Los servicios quedan atados a Sequelize y a las implementaciones concretas: no se pueden probar sin base ni cambiar una pieza sin editarlos. | Impide probar y reemplazar. |
| Contenedor de inyección (Awilix, InversifyJS) | Arma las dependencias de forma automática y escala bien. | Una librería más que aprender; la resolución automática oculta cómo se conectan las piezas. | Agrega complejidad sin necesidad para siete módulos. |
| **Composition root manual con funciones fábrica** | Cada servicio es una función `crearXService({ dependencias })` que recibe todo por parámetro; un único archivo arma el sistema y es el único que conoce las implementaciones concretas. Se ve y se explica. | El archivo crece con cada módulo y hay que ordenar a mano quién depende de quién. | **Elegida.** |

**ORM**

| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| SQL a mano con `pg` | Control total de cada consulta. | Mucho código repetido para lo básico (altas, bajas, relaciones, transacciones). | Demasiado trabajo para el plazo. |
| Prisma | Moderno, con un esquema claro. | Genera código y tiene su propio lenguaje de esquema; orientado a TypeScript. | Otra herramienta que aprender. |
| TypeORM | Completo. | Pensado para decoradores y TypeScript. | No encaja con JavaScript sin tipos. |
| **Sequelize** | JavaScript puro; transacciones, relaciones (`include`), bloqueos (`lock`) e índices declarados en el modelo. | Devuelve los decimales como texto; su sincronización automática de esquema falló con los ENUM de PostgreSQL. | **Elegida.** |

## Decisión

Construimos la API con **Express 5 sobre Node.js 20, en JavaScript (CommonJS)**, con **inversión de control manual** y **Sequelize** como ORM.

- Cada servicio es una **función fábrica** que recibe sus dependencias por parámetro (por ejemplo, `crearCanchasService({ CanchaModel, reservasRepo, usuariosService, tarifador })`) y nunca las crea.
- El sistema se arma en un único lugar, **`src/core/compositionRoot.js`**, en niveles según las dependencias: primero sedes y usuarios, después membresías, canchas, clases y acceso, y por último pagos, que usa a los demás y a la pasarela.
- Ahí también se eligen las implementaciones concretas: el Tarifador con su lista de reglas de precio, el repositorio de Sequelize para producción y el bus de eventos con sus oyentes. Las pruebas arman los mismos servicios con repositorios en memoria.
- Sequelize se usa a través de los repositorios donde hay reglas que probar sin base (reservas de cancha y membresías, patrón Repository). El esquema **no** lo crea Sequelize: se crea con el script SQL versionado (ADR-002).

El criterio determinante fue que **la inversión de control quede explícita en el código**, para poder probar cada servicio con dobles y explicar la arquitectura sin depender de un mecanismo automático.

## Consecuencias

- **Positivas:** los servicios se prueban sin base de datos; agregar una regla de precio o un oyente es tocar solo el composition root; la arquitectura se lee en un único archivo; el equipo dedicó el tiempo a los patrones y no a aprender un framework.
- **Negativas:** el composition root crece con cada módulo y el orden de armado se mantiene a mano; sin tipado, los errores de forma de los datos aparecen en ejecución (se mitiga con express-validator en cada ruta); hay que convertir con `Number()` los decimales que devuelve Sequelize.
- **Deuda asumida:** varios servicios todavía usan los modelos de Sequelize directamente (sedes, usuarios, clases, pagos); si hiciera falta probarlos sin base, habría que pasarlos a repositorios. Si el número de módulos creciera mucho, convendría un contenedor de inyección.

## Requisitos relacionados

Unidad II; RNF-04
