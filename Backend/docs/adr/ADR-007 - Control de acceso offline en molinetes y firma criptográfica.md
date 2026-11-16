# ADR-007 - Control de acceso offline en molinetes y firma criptográfica

- **Estado:** Aceptado
- **Fecha:** 2026-10-28
- **Autor:** Villagra Santiago, Ayala Franco, Sirizzotti Martín
- **Sprint:** 6

## Contexto
El sistema de FitZone Sports exige que los socios puedan ingresar a las sedes apoyando su celular en los tornos (molinetes). Existe una restricción estricta de alta disponibilidad operativa: los molinetes deben permitir el acceso de los socios incluso si la sede pierde temporalmente su conexión a internet. Validar el QR dinámico estándar (RF-04) requiere consultar la base de datos central en tiempo real, lo cual es imposible durante un corte de red.

## Alternativas consideradas
| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| Sincronizar la base de datos de socios completa hacia los molinetes | El molinete tendría toda la información exacta y actualizada para decidir localmente. | Inviable por el tamaño de los datos y el hardware limitado del molinete. Los socios nuevos no podrían entrar si la red cae. | Porque requiere hardware costoso en el borde y no resuelve el desfasaje de datos durante el corte. |
| Confiar ciegamente y permitir el paso a cualquier QR | Asegura 100 % de disponibilidad operativa y flujo de personas ininterrumpido. | Riesgo crítico de fraude. Socios con membresía suspendida o QRs falsos entrarían sin control. | Por el riesgo inaceptable para el modelo de negocio y la seguridad del establecimiento. |
| Validación asimétrica en molinete (Ed25519) mediante QR Offline | No requiere consultar la BD. Inmune a falsificaciones gracias a la criptografía asimétrica. | El socio debe descargar el QR mientras tiene conexión. Crea una ventana de riesgo menor de hasta 24 horas. | (Alternativa elegida) |

## Decisión
Se decidió adoptar la validación criptográfica asimétrica (algoritmo Ed25519) en los tornos de acceso físico mediante un "QR de Acceso Offline" (QR 2), donde el servidor inyecta y firma la fecha de vencimiento, y el molinete la verifica localmente usando la clave pública. El criterio determinante fue cumplir con el requerimiento de alta disponibilidad operativa manteniendo la seguridad criptográfica (impidiendo la falsificación de códigos).

## Consecuencias
- **Positivas:** Tolerancia a fallos inmediata. Si se cae el proveedor de internet, la sede sigue funcionando. Si un atacante extrae la clave del molinete, solo obtiene la clave pública, por lo que no puede falsificar accesos.
- **Negativas:** Existe una ventana de riesgo operativa; si una membresía se revoca, el socio todavía podría entrar *offline* durante las horas de vigencia restantes inyectadas en el QR.
- **Deuda asumida:** Falta desarrollar el mecanismo backend (cola de sincronización) para que el molinete envíe los registros de ingresos guardados localmente una vez que se restablezca internet, ajustando así el aforo retroactivamente.

## Requisitos relacionados
RF-04, RN-01, RNF-01