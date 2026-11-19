'use strict';

/**
 * Servicio de membresías (RF-02).
 *
 * Refactoring: la persistencia pasó a `membresiasRepo` (patrón Repository).
 * Las reglas quedaron exactamente iguales que en la versión de Franco: este
 * cambio es estructural, no funcional. Los olores que se detectaron acá y NO
 * se corrigieron están anotados en docs/entregables/historial-del-equipo.md (sección 6).
 */
const { AppError } = require('../common/app-error');

// RF-02 y RF-13 — Precio de cada plan para pagar la membresía en línea.
const PRECIO_PLAN = Object.freeze({ MENSUAL: 30000, TRIMESTRAL: 81000, ANUAL: 288000 });

function crearMembresiasService({ membresiasRepo, pasarela }) {

    // OLOR O-5 (documentado, no corregido): este switch está repetido en
    // renovarMembresia y en el frontend (registro.js).
    function calcularVencimiento(fechaBase, plan) {
        const vencimiento = new Date(fechaBase);
        switch (plan) {
            case 'MENSUAL':
                vencimiento.setMonth(vencimiento.getMonth() + 1);
                break;
            case 'TRIMESTRAL':
                vencimiento.setMonth(vencimiento.getMonth() + 3);
                break;
            case 'ANUAL':
                vencimiento.setMonth(vencimiento.getMonth() + 12);
                break;
            default:
                throw new Error('Plan elegido no es valido.');
        }
        return vencimiento;
    }

    // RF-02: asignar un plan a un socio
    async function asignarMembresia(usuario_id, plan) {
        const fechaInicio = new Date();
        const fechaVencimiento = calcularVencimiento(fechaInicio, plan);

        // Si el socio ya tiene membresía, el repositorio lanza MembresiaDuplicadaError (409).
        return membresiasRepo.registrar({
            usuario_id,
            plan,
            estado: 'ACTIVO',
            fecha_inicio: fechaInicio,
            fecha_vencimiento: fechaVencimiento
        });
    }

    // LEER: Obtener membresía y actualizar estado al vuelo (Lazy Evaluation)
    async function obtenerMembresia(usuario_id) {
        const membresia = await membresiasRepo.deUsuario(usuario_id);
        if (!membresia) throw new Error('Membresia no encontrada para este usuario');

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const fechaVencimiento = new Date(membresia.fecha_vencimiento);
        fechaVencimiento.setHours(0, 0, 0, 0);

        // Si ya pasó la fecha y sigue figurando como ACTIVO, lo corregimos en la BD
        if (fechaVencimiento < hoy && membresia.estado === 'ACTIVO') {
            membresia.estado = 'VENCIDO';
            return membresiasRepo.guardar(membresia);
        }

        return membresia;
    }

    // ACTUALIZAR: Renovar plan
    async function renovarMembresia(usuario_id, nuevoPlan) {
        const membresia = await obtenerMembresia(usuario_id);
        const hoy = new Date();

        // Si está ACTIVO, sumamos meses a su vencimiento actual. Si está VENCIDO, arrancamos desde hoy.
        const fechaBase = membresia.estado === 'ACTIVO' ? new Date(membresia.fecha_vencimiento) : new Date();

        membresia.plan = nuevoPlan;
        membresia.fecha_vencimiento = calcularVencimiento(fechaBase, nuevoPlan);
        membresia.estado = 'ACTIVO';

        // OLOR O-6 (documentado, se corrige en un commit funcional aparte):
        // esta rama nunca se ejecuta porque el estado ya se pisó a ACTIVO en
        // la línea anterior, así que fecha_inicio no se actualiza al renovar
        // una membresía vencida. Se conserva para no mezclar refactoring con
        // cambio de comportamiento.
        if (membresia.estado !== 'ACTIVO') {
            membresia.fecha_inicio = hoy;
        }

        return membresiasRepo.guardar(membresia);
    }

    // ELIMINAR: Baja lógica
    async function cancelarMembresia(usuario_id) {
        const membresia = await obtenerMembresia(usuario_id);
        membresia.estado = 'SUSPENDIDO';
        return membresiasRepo.guardar(membresia);
    }

    // RF-02 + RF-13: renovar pagando por la pasarela. Si el pago se rechaza,
    // la membresía no cambia. De la tarjeta solo queda el token y los últimos 4 (ADR-010).
    async function pagarYRenovar(usuario_id, plan, tarjeta) {
        const monto = PRECIO_PLAN[plan];
        if (!monto) throw new AppError('Plan inválido: tiene que ser MENSUAL, TRIMESTRAL o ANUAL.', 400);
        if (!pasarela) throw new AppError('La pasarela de pago no está disponible.', 503);
        await obtenerMembresia(usuario_id); // 404 si no tiene membresía
        const cobro = await pasarela.cobrar({ monto, tarjeta });
        const pago = { aprobado: cobro.aprobado, monto, plan, token_pasarela: cobro.token, ultimos4: cobro.ultimos4 };
        if (!cobro.aprobado) {
            throw new AppError(`Pago rechazado: ${cobro.motivo || 'la tarjeta no fue aprobada'}. La membresía no cambió.`, 402);
        }
        const membresia = await renovarMembresia(usuario_id, plan);
        return { membresia, pago };
    }

    return {
        asignarMembresia,
        obtenerMembresia,
        renovarMembresia,
        cancelarMembresia,
        pagarYRenovar,
        PRECIO_PLAN
    };
}

module.exports = { crearMembresiasService };
