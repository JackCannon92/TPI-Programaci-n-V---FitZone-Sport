'use strict';

function crearUsuariosService({ UsuarioModel, MembresiaModel, sequelize }) {
    
    async function registrarUsuario(datosUsuario, datosMembresia = null) {
        // 1. Abrimos la transacción usando la instancia inyectada
        const t = await sequelize.transaction();

        try {
            if (datosUsuario.tipo === 'SOCIO' && !datosMembresia) {
                throw new Error('Incongruencia: Un SOCIO debe registrarse obligatoriamente con los datos de un plan de membresía.');
            }
            if (datosUsuario.tipo === 'CLIENTE_EXTERNO' && datosMembresia) {
                throw new Error('Incongruencia: Un CLIENTE EXTERNO no puede contratar una membresía. Solo paga alquiler de canchas.');
            }

            const nuevoUsuario = await UsuarioModel.create(datosUsuario, { transaction: t });
            let nuevaMembresia = null;

            if (datosUsuario.tipo === 'SOCIO') {
                nuevaMembresia = await MembresiaModel.create({
                    ...datosMembresia,
                    usuario_id: nuevoUsuario.id
                }, { transaction: t });
            }

            await t.commit();
            return { mensaje: 'Usuario registrado con éxito', usuario: nuevoUsuario, membresia: nuevaMembresia };

        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    async function listarUsuarios() {
        return UsuarioModel.findAll({
            include: [{ model: MembresiaModel, as: 'membresia' }]
        });
    }

    // Ajustado para buscar por ID, ya que Accesos y Canchas le pasan un UUID
    async function obtenerUsuario(id) {
        const usuario = await UsuarioModel.findByPk(id, {
            include: ['membresia']
        });
        
        if (!usuario) throw new Error(`Usuario ${id} no encontrado`);
        return usuario;
    }

    async function actualizarUsuario(id, datos) {
        const usuario = await obtenerUsuario(id);
        await usuario.update(datos);
        return usuario;
    }
    //se usa en acceso.service
    async function obtenerVarios(ids) {
    return UsuarioModel.findAll({
        where: { id: ids }
    });
}

    // Método vital requerido por los módulos de Canchas, Clases y Accesos (RN-03)
    function esSocioActivo(usuario) {
        return usuario.tipo === 'SOCIO' && usuario.membresia && usuario.membresia.estado === 'ACTIVO';
    }

    return { 
        registrarUsuario, 
        listarUsuarios, 
        obtenerUsuario, 
        actualizarUsuario,  
        esSocioActivo,
        obtenerVarios
    };
}

module.exports = { crearUsuariosService };