'use strict';

/**
 * El backend todavía no tiene login con contraseña (los usuarios no tienen
 * ese campo). Esto es una "sesión" liviana: se guarda el id del usuario que
 * ingresó en sessionStorage y lo usan las demás pantallas. Cuando el backend
 * tenga autenticación de verdad, solo hay que cambiar este archivo.
 */
const SESION_KEY = 'fitzone_usuario_id';

const sesion = {
  guardar(usuarioId) {
    sessionStorage.setItem(SESION_KEY, usuarioId);
  },
  obtenerId() {
    return sessionStorage.getItem(SESION_KEY);
  },
  cerrar() {
    sessionStorage.removeItem(SESION_KEY);
  },
  requerirONavegar() {
    const id = sesion.obtenerId();
    if (!id) {
      window.location.href = 'index.html';
      return null;
    }
    return id;
  },
};
