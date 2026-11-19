# ADR-003 — Estrategia offline del control de acceso: QR firmado con clave pública

- **Estado:** Aceptado
- **Fecha:** 2026-10-28
- **Autor:** Ayala, Franco
- **Sprint:** 5

## Contexto

El ingreso a las sedes es la operación más visible del sistema: si el molinete no responde, el socio no entra y la sede se llena de gente esperando. El requisito RNF-01 exige que el control de acceso siga funcionando aunque se caiga la conexión entre la sede y el servidor central.

El QR dinámico del socio (RF-04) se valida consultando al servidor: cambia cada minuto y el servidor revisa la firma y el estado de la membresía. Sin conexión, el terminal de la sede no puede hacer esa consulta. La cátedra indicó en el check-in del 15/10 que se puede usar más de un QR.

## Alternativas consideradas

| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| Dejar pasar a todos mientras no haya conexión | El servicio no se corta. | Entra cualquiera, incluidos socios vencidos o personas sin membresía; no queda registro confiable. | Anula el control de acceso. |
| No dejar pasar a nadie hasta que vuelva la conexión | Seguro. | Los socios al día no pueden entrar; incumple RNF-01. | Inaceptable para el negocio. |
| Ingreso manual por el recepcionista (planilla) | No requiere tecnología. | Lento, propenso a errores y sin validar membresías; depende de que haya personal. | Solo sirve como último recurso, no como estrategia. |
| QR firmado con HMAC validado en el terminal | Simple; una sola clave. | Para validar una firma HMAC el terminal necesita el **secreto**. Si alguien lo extrae del terminal, puede fabricar QR válidos para cualquier socio. | Pone el secreto del sistema en cada una de las 25 sedes. |
| **QR firmado con clave pública (Ed25519)** | El servidor firma con la clave privada; el terminal valida con la **clave pública**, que no permite firmar. Valida sin conexión y sin guardar secretos. | Dos mecanismos de firma en el sistema (HMAC para lo que valida el servidor, Ed25519 para lo que valida el terminal). Un QR emitido no se puede anular antes de que venza. | **Elegida.** |

## Decisión

El socio activo obtiene, además de su QR dinámico, un **QR sin conexión firmado con Ed25519**. El servidor lo firma con su clave privada (derivada de una semilla en las variables de entorno, para que no cambie al reiniciar) y el terminal de la sede lo valida solo con la clave pública, que obtiene de `GET /api/acceso/clave-publica`. El QR vale **24 horas, o hasta que vence la membresía si eso ocurre antes**. Solo lo pueden pedir los socios con membresía activa.

El criterio determinante fue que **el terminal pueda validar sin poder falsificar**: aunque alguien robe la clave pública del terminal, no puede fabricar QR.

Cómo se registran los ingresos ocurridos sin conexión y cómo se sincronizan al volver la red se decide en el ADR-007.

## Consecuencias

- **Positivas:** la sede sigue funcionando con la conexión caída (RNF-01); el terminal no guarda ningún secreto; la vigencia corta limita el daño de un QR filtrado.
- **Negativas:** si a un socio se le suspende la membresía, su QR sin conexión sigue sirviendo hasta que vence (como máximo 24 horas); el reloj del terminal tiene que estar en hora, porque la vigencia se compara con la hora local.
- **Deuda asumida:** no existe una forma de anular un QR antes de su vencimiento (por ejemplo, una lista de QR revocados que el terminal descargue al reconectar). La sincronización de los ingresos queda en el ADR-007.

## Requisitos relacionados

RNF-01, RF-04, RN-01
