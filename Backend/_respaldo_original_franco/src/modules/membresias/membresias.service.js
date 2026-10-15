'use strict';

function crearMembresiasService({ MembresiaModel }) {

    // RF-02: asignar un plan a un socio
    async function asignarMembresia(usuario_id, plan) {
        const fechaInicio = new Date();
        const fechaVencimiento = new Date();

        switch (plan) {
            case 'MENSUAL':
                fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 1);
                break;
            case 'TRIMESTRAL':
                fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 3);
                break;
            case 'ANUAL':
                fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 12);
                break;
            default:
                throw new Error('Plan elegido no es valido.');
        }

        // Le manda al ORM que guarde la fila en PostgreSQL
        return MembresiaModel.create({
            usuario_id,
            plan,
            estado: 'ACTIVO',
            fecha_inicio: fechaInicio,
            fecha_vencimiento: fechaVencimiento
        });
    }

    // LEER: Obtener membresía y actualizar estado al vuelo (Lazy Evaluation)
    async function obtenerMembresia(usuario_id) {
        const membresia = await MembresiaModel.findOne({ where: { usuario_id } });
        if (!membresia) throw new Error('Membresia no encontrada para este usuario');

        const hoy = new Date();
        // Setear la hora a las 00:00:00 para comparar solo fechas correctamente
        hoy.setHours(0, 0, 0, 0); 
        const fechaVencimiento = new Date(membresia.fecha_vencimiento);
        fechaVencimiento.setHours(0, 0, 0, 0);

        // Si ya pasó la fecha y sigue figurando como ACTIVO, lo corregimos en la BD
        if (fechaVencimiento < hoy && membresia.estado === 'ACTIVO') {
            membresia.estado = 'VENCIDO';
            await membresia.save();
        }

        return membresia;
    }

    // ACTUALIZAR: Renovar plan
    async function renovarMembresia(usuario_id, nuevoPlan) {
        // Usamos el método anterior para que ya venga con el estado verificado
        const membresia = await obtenerMembresia(usuario_id);
        
        const hoy = new Date();
        let fechaBase = new Date();

        // Si está ACTIVO, sumamos meses a su vencimiento actual. Si está VENCIDO, arrancamos desde hoy.
        if (membresia.estado === 'ACTIVO') {
            fechaBase = new Date(membresia.fecha_vencimiento);
        }

        switch (nuevoPlan) {
            case 'MENSUAL':
                fechaBase.setMonth(fechaBase.getMonth() + 1);
                break;
            case 'TRIMESTRAL':
                fechaBase.setMonth(fechaBase.getMonth() + 3);
                break;
            case 'ANUAL':
                fechaBase.setMonth(fechaBase.getMonth() + 12);
                break;
            default:
                throw new Error('Plan elegido no es valido.');
        }

        // Actualizamos la fila
        membresia.plan = nuevoPlan;
        membresia.estado = 'ACTIVO';
        membresia.fecha_vencimiento = fechaBase;
        
        // Si arrancó desde hoy, actualizamos la fecha_inicio
        if (membresia.estado !== 'ACTIVO') {
             membresia.fecha_inicio = hoy;
        }

        await membresia.save();
        return membresia;
    }

    // ELIMINAR: Baja lógica
    async function cancelarMembresia(usuario_id) {
        const membresia = await obtenerMembresia(usuario_id);
        membresia.estado = 'SUSPENDIDO';
        await membresia.save();
        return membresia;
    }
    
    // Retornamos los métodos empaquetados para el Controlador
    return {
        asignarMembresia,
        obtenerMembresia,
        renovarMembresia,
        cancelarMembresia
    };
}

module.exports = { crearMembresiasService };