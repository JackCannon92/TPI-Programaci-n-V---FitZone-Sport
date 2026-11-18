'use strict';

const { Router } = require('express');

/**
 * Recibe el controlador inyectado desde el composition root
 * y mapea los endpoints HTTP a sus respectivos métodos.
 */
function crearUsuariosRouter(usuariosController) {
    const router = Router();

    /**
     * @swagger
     * /api/usuarios:
     *   post:
     *     summary: Registra un nuevo usuario en el sistema (RF-01)
     *     tags: [Usuarios]
     *
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - usuario
     *             properties:
     *               usuario:
     *                 type: object
     *                 required:
     *                   - dni
     *                   - nombre_completo
     *                   - email
     *                   - tipo
     *                 properties:
     *                   dni:
     *                     type: string
     *                     example: "35123456"
     *                   nombre_completo:
     *                     type: string
     *                     example: "Juan Pérez"
     *                   email:
     *                     type: string
     *                     format: email
     *                     example: "juan@email.com"
     *                   telefono:
     *                     type: string
     *                     example: "3454123456"
     *                   foto_url:
     *                     type: string
     *                     example: "https://ejemplo.com/foto.jpg"
     *                   tipo:
     *                     type: string
     *                     enum:
     *                       - SOCIO
     *                       - CLIENTE_EXTERNO
     *                     example: "SOCIO"
     *                   rol:
     *                     type: string
     *                     enum:
     *                       - CLIENTE
     *                       - RECEPCIONISTA
     *                       - GERENTE
     *                     example: "CLIENTE"
     *
     *               membresia:
     *                 type: object
     *                 properties:
     *                   plan:
     *                     type: string
     *                     example: "MENSUAL"
     *                   fecha_inicio:
     *                     type: string
     *                     format: date
     *                     example: "2026-09-27"
     *                   fecha_vencimiento:
     *                     type: string
     *                     format: date
     *                     example: "2026-10-27"
     *
     *     responses:
     *       201:
     *         description: Usuario creado exitosamente
     *       400:
     *         description: Datos inválidos o incongruencia entre usuario y membresía
     *       409:
     *         description: Conflicto - El DNI o Email ya existe
     *       500:
     *         description: Error interno del servidor
     */
    router.post('/', usuariosController.crear);

    /**
     * @swagger
     * /api/usuarios:
     *   get:
     *     summary: Obtiene la lista de todos los usuarios
     *     tags: [Usuarios]
     *     responses:
     *       200:
     *         description: Lista de usuarios obtenida exitosamente
     */
    router.get('/', usuariosController.listar);

    /**
     * @swagger
     * /api/usuarios/{id}:
     *   get:
     *     summary: Obtiene el perfil de un usuario específico y su membresía (RF-03)
     *     tags: [Usuarios]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: UUID del usuario
     *     responses:
     *       200:
     *         description: Perfil del usuario obtenido con éxito
     *       404:
     *         description: Usuario no encontrado
     */
    router.get('/:id', usuariosController.obtener);

    /**
     * @swagger
     * /api/usuarios/{id}:
     *   put:
     *     summary: Actualiza los datos de un usuario
     *     tags: [Usuarios]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: UUID del usuario a actualizar
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               telefono:
     *                 type: string
     *                 example: "1155556677"
     *     responses:
     *       200:
     *         description: Usuario actualizado
     *       404:
     *         description: Usuario no encontrado
     */
    router.put('/:id', usuariosController.actualizar);

    return router;
}

module.exports = { crearUsuariosRouter };