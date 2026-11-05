# ADR-010 — Uso de varios códigos QR en el sistema

- **Estado:** Aceptado
- **Fecha:** 28/10/2026
- **Deciden:** Franco Ayala, Martín Emiliano Sirizzotti, Santiago Agustín Villagra
- **Relacionado:** RF-04, RF-05, RF-07, RF-14, RN-01, RNF de disponibilidad (tornos sin conexión), ADR-007 (detalle del precio en el comprobante). Indicación de la cátedra del 27/10: "se puede usar más de un QR".

## Contexto

Hasta ahora el sistema tenía un único QR: el **QR dinámico del socio** (RF-04), que cambia cada minuto y, al escanearlo, consulta en la base si la membresía está activa. La consigna del caso deja tres situaciones que ese QR no resuelve:

1. **El cliente externo no tiene con qué entrar.** La consigna lo define como un usuario sin membresía que solo alquila canchas. El QR de socio se basa en la membresía, así que el externo podía reservar y pagar, pero no tenía cómo entrar a la sede.
2. **Los tornos tienen que funcionar sin internet.** La consigna lo marca como requisito crítico (disponibilidad del 99,5 % en el control de acceso). El QR de socio necesita consultar la base para validarse.
3. **La asistencia a clases no se registra.** El estado `ASISTIO` existe en la base, pero nadie lo usaba.

A eso se suma que el comprobante PDF (RF-14) no tiene forma de comprobarse: cualquiera podría editarlo.

La cátedra indicó que se puede usar más de un QR para resolver cosas del sistema.

## Opciones consideradas

| Opción | A favor | En contra |
|---|---|---|
| **Un solo QR para todo** (el del socio, con más datos adentro) | Un único flujo. | No sirve para el externo, que no tiene membresía, ni para validar sin red. Mezcla propósitos: un QR robado serviría para todo. |
| **Un QR por propósito, todos con firma HMAC** | Simple, sin claves que administrar. | Para validar una firma HMAC hace falta el secreto. Si el torno tuviera que validar sin red, habría que instalarle el secreto, y quien lo sacara del torno podría fabricar QRs para entrar. |
| **Un QR por propósito: firma HMAC para los que valida el servidor, y firma de clave pública (Ed25519) para el que valida el torno** | Cada QR sirve para una sola cosa y vence en su ventana. El torno valida sin red con una clave que no permite falsificar. | Dos mecanismos de firma en vez de uno. |

## Decisión

**Se usan cuatro QR además del de socio, cada uno con un propósito y una vigencia propios.** Tres los valida el servidor, con firma HMAC (`src/common/qr-firmado.js`). El de acceso sin conexión lo valida el torno, con firma Ed25519 (`src/modules/acceso/qr-offline.js`).

| QR | Para qué | Lo emite | Se usa en | Vigencia |
|---|---|---|---|---|
| **Socio (RF-04)**, ya existía | Entrada diaria del socio | `GET /api/acceso/qr/{usuarioId}` | `POST /api/acceso/ingreso` | 1 minuto (se renueva solo) |
| **1 · Reserva de cancha** | Que quien alquiló una cancha, sobre todo el cliente externo, entre a la sede | `GET /api/canchas/reservas/{id}/qr` (solo reservas pagas) y el comprobante PDF | `POST /api/acceso/ingreso-reserva` | Desde 30 min antes del turno hasta que termina, y solo en la sede de esa cancha |
| **2 · Acceso sin conexión** | Que el torno valide al socio sin internet | `GET /api/acceso/qr-offline/{usuarioId}` (solo socios activos) | El torno, con la clave pública de `GET /api/acceso/clave-publica`; se puede simular con `POST /api/acceso/validar-offline` | 24 horas, o hasta que vence la membresía si es antes |
| **3 · Asistencia a clase** | Registrar quién vino a la clase (estado `ASISTIO`) | `GET /api/clases/reservas/{id}/qr` | `POST /api/clases/asistencia` | Desde 30 min antes hasta 60 min después del inicio |
| **4 · Verificación del comprobante** | Comprobar que un ticket es auténtico y que no le cambiaron el monto | El comprobante PDF (link impreso como QR) | `GET /api/pagos/verificar/{token}` | Sin vencimiento |

Reglas adoptadas:

- **Cada QR tiene un tipo.** Al validarlo se exige el tipo esperado: el QR de una cancha no sirve para marcar asistencia, ni al revés.
- **Ningún QR se guarda en la base.** Lleva sus datos adentro y se valida recalculando la firma. Si alguien cambia un dato (el horario, el monto), la firma deja de coincidir.
- **El QR prueba quién es, pero el estado actual se consulta siempre.** El QR de reserva se rechaza si la reserva se canceló después de emitirlo, y el de asistencia si ya se usó una vez.
- **Las reglas del ingreso son las mismas, se entre con el QR que se entre.** El QR de reserva pasa por la misma función de ingreso que el de socio (RN-01: no estar en dos sedes a la vez, y aforo de RF-05). Lo único que no pide es membresía.
- **Sin conexión, el torno solo tiene la clave pública.** Con ella valida pero no puede firmar: aunque alguien la sacara del torno, no podría fabricar QRs. La clave privada se deriva de una semilla en las variables de entorno (`QR_OFFLINE_SEMILLA`, o `QR_SECRET` si no está), así que no cambia al reiniciar el servidor.
- **El comprobante PDF lleva dos QR:** el de ingreso (QR 1) y el de verificación (QR 4).

## Consecuencias

**Positivas**
- El cliente externo tiene cómo entrar a la sede el día de su turno, y solo ese día.
- El control de acceso puede seguir funcionando sin internet.
- La asistencia a clases queda registrada, y una clase a la que ya se asistió no se puede cancelar.
- Un comprobante editado a mano se detecta escaneando su QR.

**Negativas / riesgos**
- **Sin conexión hay un margen de riesgo.** Si a un socio se le suspende la membresía, su QR sin conexión sigue sirviendo hasta que vence (como mucho 24 horas). Es el precio de no depender de la red, y por eso la vigencia es corta. Los ingresos que el torno registre sin red se tendrían que sincronizar cuando vuelve la conexión; esa sincronización queda fuera del alcance del TI.
- **Si se filtra `QR_SECRET`,** se podrían fabricar QRs de reserva, de asistencia y de comprobante. Se mitiga con el secreto fuera del repositorio (`.env`, que está en el `.gitignore`).
- **Dos mecanismos de firma** (HMAC y Ed25519), cada uno usado donde corresponde.

## Cómo se verifica

```bash
npm test -- qr     # unitarios: qr-firmado, qr-reserva, qr-offline, qr-asistencia, qr-comprobante
                   # integración: test/integracion/qr.api.test.js
```

También se probó contra una base PostgreSQL real: los cuatro QR de punta a punta. Además se leyeron los dos QR impresos en el comprobante PDF con un lector de códigos: con el de ingreso entró el cliente externo, y el de verificación confirmó el pago y rechazó una versión con el monto cambiado.
