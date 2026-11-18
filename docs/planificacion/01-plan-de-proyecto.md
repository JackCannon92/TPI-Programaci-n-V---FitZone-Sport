# 1. Plan de proyecto — FitZone Sports

## 1.1 Objetivos

1. Construir una plataforma web para una cadena de 25 sedes que cubra los cinco módulos del caso: usuarios y membresías (M1), control de acceso (M2), clases grupales (M3), canchas (M4) y pagos (M5), con los requisitos RF-01 a RF-14, las reglas RN-01 a RN-03 y los no funcionales RNF-01 a RNF-04.
2. Aplicar los contenidos de cada unidad sobre el mismo sistema: arquitectura documentada (Unidad I), framework con inversión de control y ORM (II), patrones Strategy, Observer y Repository (III), aplicación web por componentes (IV) y pruebas con integración continua (V).
3. Entregar el 19/11/2026 un sistema que se levanta con un solo comando (`docker compose up`), con pruebas automáticas, documentación de arquitectura, manuales y esta planificación, y defenderlo entre el 23 y el 29/11.

## 1.2 Alcance

**Incluido**

- Backend: API REST en Node.js + Express 5, Sequelize y PostgreSQL, organizada como monolito modular (ADR-001), versionada en `/api/v1` (ADR-011).
- Aplicación web única para los cuatro roles (socio, recepcionista, administrador de sede y gerente), en JavaScript sin framework (ADR-006).
- Los cinco códigos QR: el dinámico del socio (RF-04), el de reserva de cancha, el de acceso sin conexión (RNF-01), el de asistencia a clase y el de verificación del comprobante (ADR-016).
- Validación del QR sin conexión en el terminal de sede y sincronización diferida (ADR-003 y ADR-007).
- Pasarela de pago simulada y comprobante PDF (RF-13, RF-14, ADR-010).
- Pruebas unitarias y de integración con umbral de cobertura (ADR-008), imagen Docker, `docker-compose` y pipeline de GitHub Actions (ADR-009).

**Excluido, y por qué**

| Qué queda afuera | Motivo |
|---|---|
| Aplicación móvil (Unidad VI) | La cátedra indicó el 29/08 que no es obligatoria; se reemplazó por la aplicación web responsive (ADR-012) |
| CQRS para los reportes del gerente | Se implementó y se quitó el 28/10 por indicación de la cátedra |
| Autenticación con contraseña | El modelo de datos no tiene contraseñas; el ingreso es por DNI con una sesión simulada, documentada como limitación |
| Pasarela de pago real | El caso pide un servicio simulado (RF-13) |
| Despliegue en producción con HTTPS | Fuera del alcance del cuatrimestre; se entrega el entorno de pruebas con Docker |

## 1.3 Supuestos

- Los tres integrantes dedican las horas comprometidas en la tabla 1.5 y asisten a los check-ins quincenales.
- Supabase (plan gratuito) está disponible durante el desarrollo como base compartida.
- La consigna y los lineamientos de entrega no cambian en lo sustancial durante el cuatrimestre.
- Las herramientas elegidas (Express, Sequelize, JavaScript sin framework) no requieren una curva de aprendizaje que consuma el tiempo de la materia.

Los supuestos 2 y 3 no se cumplieron: ver los riesgos R5 y R2 en [07-riesgos.md](07-riesgos.md).

## 1.4 Restricciones

- **Plazo:** cursada del 27/08 al 20/11 (13 semanas en lugar de las 16 del programa); entrega el 19/11 y defensa del 23 al 29/11.
- **Horas:** 76 horas prácticas en total, las que fija el programa para las seis unidades.
- **Equipo:** tres integrantes para cuatro roles (P1 a P4): el rol P4 lo absorbe P2 y la parte móvil de P4 quedó fuera de alcance.
- **Tecnología:** JavaScript en backend y frontend; base relacional; pipeline en GitHub Actions.

## 1.5 Equipo, roles y horas comprometidas

| Integrante | Rol | Horas comprometidas | Responsabilidad principal | Liderazgo de check-in (real) |
|---|---|---|---|---|
| Ayala, Franco | P1 · Arquitecto / Backend Lead | 20 | Unidades I y II: C4, ADR, esquema de base, Módulo 1 | 01/10 (pasó del 17/09) y 19/11 (entrega) |
| Sirizzotti, Martín Emiliano | P2 · Backend Developer y P4 · QA / DevOps | 24 | Unidades III y V: módulos 2 a 5 con patrones, pruebas, Docker y pipeline | 03/09 y 29/10 |
| Villagra, Santiago Agustín | P3 · Frontend Developer | 14 | Unidad IV: aplicación web | 15/10 |
| Todo el equipo | — | 18 | Debate arquitectónico, recuperación de atraso, integración final y defensa | — |
| **Total** | | **76** | | |

Las horas comprometidas son las del plan (hoja "Resumen por Integrante" de la planilla). El reparto real de la carga está en [04-asignacion-y-carga.md](04-asignacion-y-carga.md).
