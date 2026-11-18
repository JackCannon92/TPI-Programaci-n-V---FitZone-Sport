# ADR-002 — Motor de base de datos: PostgreSQL alojado en Supabase

- **Estado:** Aceptado
- **Fecha:** 2026-08-27
- **Autor:** Ayala, Franco
- **Sprint:** 1

## Contexto

El sistema maneja dinero (pagos de reservas y membresías) y recursos que no se pueden vender dos veces (turnos de cancha y cupos de clase). Una operación a medias, por ejemplo un pago aprobado con la reserva sin confirmar, o dos reservas para el mismo turno, son errores graves para el negocio. Además, la consulta de disponibilidad tiene que responder rápido (RNF-03).

El equipo no tenía servidores propios ni presupuesto, y necesitaba una base compartida por los tres integrantes desde la primera semana, sin tener que administrarla.

## Alternativas consideradas

| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| MySQL / MariaDB | Muy conocida y con mucha documentación; transacciones ACID. | No tiene índices únicos parciales: no se puede declarar "único solo para las reservas activas" (RN-02), habría que resolverlo con lógica o tablas auxiliares. Restricciones CHECK con soporte más reciente y limitado. | Pierde la herramienta exacta que necesitábamos para RN-02. |
| MongoDB | Esquema flexible, fácil de empezar. | No hay claves foráneas ni restricciones relacionales; las transacciones entre documentos son más costosas; la integridad queda en manos del código. | El caso es relacional (usuario, membresía, reserva, pago) y pide integridad fuerte. |
| SQLite | Cero instalación, un archivo. | Un solo escritor a la vez; no está pensada para muchas sedes concurrentes ni para ser compartida por red. | No sirve como base central de 25 sedes. |
| PostgreSQL en servidor propio | Control total. | Hay que instalarlo, administrarlo, hacer copias de seguridad y exponerlo con seguridad. | Sin servidor ni tiempo para administrarlo. |
| **PostgreSQL alojado en Supabase** | Transacciones ACID, claves foráneas, CHECK, índices parciales y triggers; Supabase lo administra, es gratis y da conexión con SSL. | El plan gratuito pausa el proyecto tras una semana sin uso; dependemos de un tercero. | **Elegida.** |

## Decisión

Usamos **PostgreSQL alojado en Supabase** como única base de datos del sistema. El criterio determinante fue la **integridad transaccional con restricciones declaradas en la propia base**, que funcionan como última barrera aunque el código tenga un error:

- claves foráneas entre todas las entidades;
- restricciones `CHECK` sobre los valores permitidos (tipos de cancha, estados, planes);
- el índice único parcial `uq_reserva_cancha_turno_activo`, que impide la sobreventa de canchas (ADR-004);
- el trigger que descuenta los cupos de las clases;
- índices sobre las columnas que usan las consultas frecuentes (por ejemplo `idx_clases_sede_fecha`).

El esquema completo está versionado en `db/01-esquema.sql`, y los datos de prueba en `db/02-seed.sql`; el `docker-compose.yml` los ejecuta al crear la base. El acceso desde la aplicación es con Sequelize (ADR-005).

## Consecuencias

- **Positivas:** las reglas de integridad viven en la base y no dependen de que todo el código las respete; el esquema está versionado y cualquiera puede recrear la base; nadie del equipo tuvo que instalar un motor de base de datos.
- **Negativas:** el plan gratuito pausa el proyecto si no se usa durante una semana (nos pasó el 28/10: el servidor no arrancaba hasta reactivarlo); el índice parcial ata el diseño a PostgreSQL; los cambios de esquema se coordinan entre los tres porque la base es compartida.
- **Deuda asumida:** para producción habría que pasar a un plan pago o a un servidor propio, con copias de seguridad programadas y migraciones versionadas en lugar de un único script.

## Requisitos relacionados

RNF-03, RN-02, RF-13, RF-14
