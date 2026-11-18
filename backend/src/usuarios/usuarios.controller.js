'use strict';

function crearUsuariosController(usuariosService) {
  
  async function crear(req, res, next) {
    try {
      const { usuario, membresia } = req.body;
      const resultado = await usuariosService.registrarUsuario(usuario, membresia);
      res.status(201).json(resultado);
    } catch (error) {
      next(error);
    }
  }

  async function listar(req, res, next) {
    try {
      const usuarios = await usuariosService.listarUsuarios();
      res.json(usuarios);
    } catch (error) {
      next(error);
    }
  }

  async function obtener(req, res, next) {
    try {
      const { id } = req.params;
      const usuario = await usuariosService.obtenerUsuario(id);
      res.status(200).json(usuario);
    } catch (error) {
      next(error);
    }
  }

  async function actualizar(req, res, next) {
    try {
      const usuario = await usuariosService.actualizarUsuario(req.params.id, req.body);
      res.json(usuario);
    } catch (error) {
      next(error);
    }
  }
    return { crear, listar, obtener, actualizar};
}

module.exports = { crearUsuariosController };