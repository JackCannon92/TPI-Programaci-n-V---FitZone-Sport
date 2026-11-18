'use strict';

(function () {
  document.getElementById('marca-login').insertAdjacentHTML('afterbegin', ui.LOGO);

  // Si ya hay sesión, directo al inicio.
  if (sesion.obtenerId()) {
    window.location.href = 'dashboard.html';
    return;
  }

  const form = document.getElementById('form-login');
  const mensaje = document.getElementById('mensaje');

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    ui.aviso(mensaje, '');
    const dni = document.getElementById('dni').value.trim();
    if (!dni) {
      ui.aviso(mensaje, 'Escribí tu DNI para ingresar.');
      return;
    }

    const boton = form.querySelector('button');
    boton.disabled = true;
    try {
      // Todavía no existe un endpoint "buscar por DNI": se trae la lista y se
      // filtra acá. Para la cantidad de usuarios de un TPI alcanza.
      const usuarios = await api.listarUsuarios();
      const encontrado = usuarios.find((u) => u.dni === dni);
      if (!encontrado) {
        ui.aviso(mensaje, 'No hay ningún usuario con ese DNI. Revisalo o creá un usuario nuevo.');
        return;
      }
      sesion.guardar(encontrado.id);
      window.location.href = 'dashboard.html';
    } catch (error) {
      ui.aviso(mensaje, error.message);
    } finally {
      boton.disabled = false;
    }
  });
})();
