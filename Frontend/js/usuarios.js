'use strict';

(function () {
  if (!sesion.requerirONavegar()) return;

  document.getElementById('link-salir').addEventListener('click', (ev) => {
    ev.preventDefault();
    sesion.cerrar();
    window.location.href = 'index.html';
  });

  const cuerpo = document.getElementById('cuerpo-tabla');
  const mensajeDiv = document.getElementById('mensaje');

  function pill(valor) {
    return `<span class="pill ${(valor || '').toLowerCase()}">${valor}</span>`;
  }

  async function cargar() {
    const usuarios = await api.listarUsuarios();

    if (usuarios.length === 0) {
      cuerpo.innerHTML = '<tr><td colspan="5" class="vacio">Todavía no hay usuarios registrados.</td></tr>';
      return;
    }

    cuerpo.innerHTML = usuarios
      .map((u) => {
        const membresia = u.membresia
          ? `${u.membresia.plan} · ${pill(u.membresia.estado)}`
          : '<span class="vacio">sin membresía</span>';
        return `
          <tr>
            <td>${u.nombre_completo}</td>
            <td>${u.dni}</td>
            <td>${u.email}</td>
            <td>${pill(u.tipo)}</td>
            <td>${membresia}</td>
          </tr>`;
      })
      .join('');
  }

  cargar().catch((error) => {
    mensajeDiv.innerHTML = `<div class="mensaje-error">No se pudo cargar la lista: ${error.message}</div>`;
    cuerpo.innerHTML = '';
  });
})();
