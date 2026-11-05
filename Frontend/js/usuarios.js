'use strict';

(async function () {
  const mensaje = document.getElementById('mensaje');
  try {
    await ui.iniciarPagina('usuarios');
  } catch (error) {
    ui.aviso(mensaje, error.message);
    return;
  }

  const cuerpo = document.getElementById('cuerpo-tabla');
  const buscar = document.getElementById('buscar');
  const filtro = document.getElementById('filtro');
  let usuarios = [];

  function pintar() {
    const q = buscar.value.trim().toLowerCase();
    const lista = usuarios.filter((u) => (!filtro.value || u.tipo === filtro.value)
      && (!q || `${u.nombre_completo} ${u.dni} ${u.email}`.toLowerCase().includes(q)));
    if (!lista.length) {
      cuerpo.innerHTML = `<tr><td colspan="5" class="vacio">${usuarios.length ? 'Nadie coincide con la búsqueda.' : 'Todavía no hay usuarios registrados.'}</td></tr>`;
      return;
    }
    cuerpo.innerHTML = lista.map((u) => `
      <tr>
        <td><strong>${ui.esc(u.nombre_completo)}</strong></td>
        <td>${ui.esc(u.dni)}</td>
        <td>${ui.esc(u.email)}</td>
        <td>${ui.estado(u.tipo)}</td>
        <td>${u.membresia ? `${ui.esc(u.membresia.plan.charAt(0) + u.membresia.plan.slice(1).toLowerCase())} ${ui.estado(u.membresia.estado)} <span class="texto-2 chico">vence ${ui.fecha(`${u.membresia.fecha_vencimiento}T12:00:00`)}</span>` : '<span class="texto-2">Sin membresía</span>'}</td>
      </tr>`).join('');
  }

  buscar.addEventListener('input', pintar);
  filtro.addEventListener('change', pintar);

  try {
    usuarios = await api.listarUsuarios();
    pintar();
  } catch (error) {
    ui.aviso(mensaje, `No se pudo cargar la lista: ${error.message}`);
    cuerpo.innerHTML = '';
  }
})();
