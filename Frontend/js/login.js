'use strict';

(function () {
  const form = document.getElementById('form-login');
  const mensajeDiv = document.getElementById('mensaje');

  // Si ya hay sesión, directo al dashboard.
  if (sesion.obtenerId()) {
    window.location.href = 'dashboard.html';
    return;
  }

  function mostrarError(texto) {
    mensajeDiv.innerHTML = `<div class="mensaje-error">${texto}</div>`;
  }

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    mensajeDiv.innerHTML = '';
    const dni = document.getElementById('dni').value.trim();
    if (!dni) return;

    try {
      // Todavía no existe un endpoint "buscar por DNI": traemos la lista
      // completa y filtramos acá. Para la cantidad de usuarios de un TPI
      // (decenas, no miles) esto es suficiente.
      const usuarios = await api.listarUsuarios();
      const encontrado = usuarios.find((u) => u.dni === dni);

      if (!encontrado) {
        mostrarError('No encontramos ningún usuario con ese DNI. ¿Ya te registraste?');
        return;
      }

      sesion.guardar(encontrado.id);
      window.location.href = 'dashboard.html';
    } catch (error) {
      mostrarError(`No se pudo conectar con el servidor: ${error.message}. ¿Está corriendo el backend (npm run dev)?`);
    }
  });
})();
