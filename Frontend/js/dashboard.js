'use strict';

(function () {
  const usuarioId = sesion.requerirONavegar();
  if (!usuarioId) return;

  const mensajeDiv = document.getElementById('mensaje');

  document.getElementById('link-salir').addEventListener('click', (ev) => {
    ev.preventDefault();
    sesion.cerrar();
    window.location.href = 'index.html';
  });

  function textoPill(valor) {
    const clase = (valor || '').toLowerCase();
    return `<span class="pill ${clase}">${valor}</span>`;
  }

  async function cargarUsuario() {
    const usuario = await api.obtenerUsuario(usuarioId);

    document.getElementById('saludo').textContent = `Hola, ${usuario.nombre_completo.split(' ')[0]}`;
    document.getElementById('d-dni').textContent = usuario.dni;
    document.getElementById('d-email').textContent = usuario.email;
    document.getElementById('d-telefono').textContent = usuario.telefono || '-';
    document.getElementById('d-tipo').innerHTML = textoPill(usuario.tipo);
    document.getElementById('d-rol').textContent = usuario.rol;

    if (usuario.tipo === 'SOCIO' && usuario.membresia) {
      const m = usuario.membresia;
      document.getElementById('tarjeta-membresia').style.display = 'block';
      document.getElementById('m-plan').textContent = m.plan;
      document.getElementById('m-estado').innerHTML = textoPill(m.estado);
      document.getElementById('m-inicio').textContent = m.fecha_inicio;
      document.getElementById('m-vencimiento').textContent = m.fecha_vencimiento;
    }
  }

  async function cargarSedes() {
    const select = document.getElementById('select-sede');
    const resultadoDiv = document.getElementById('aforo-resultado');
    const sedes = await api.listarSedes();

    if (sedes.length === 0) {
      select.innerHTML = '<option>No hay sedes cargadas todavía</option>';
      return;
    }

    select.innerHTML = sedes.map((s) => `<option value="${s.id}">${s.nombre}</option>`).join('');

    async function mostrarAforo() {
      resultadoDiv.textContent = 'Consultando...';
      resultadoDiv.className = 'cargando';
      try {
        const aforo = await api.aforoSede(select.value);
        resultadoDiv.className = '';
        resultadoDiv.innerHTML = `
          <strong>${aforo.sede}</strong>: ${aforo.actual} / ${aforo.maximo} personas adentro
          (${aforo.disponible} lugares libres)`;
      } catch (error) {
        resultadoDiv.className = 'mensaje-error';
        resultadoDiv.textContent = `No se pudo consultar el aforo: ${error.message}`;
      }
    }

    select.addEventListener('change', mostrarAforo);
    mostrarAforo();
  }

  Promise.all([cargarUsuario(), cargarSedes()]).catch((error) => {
    mensajeDiv.innerHTML = `<div class="mensaje-error">No se pudo cargar el panel: ${error.message}</div>`;
  });
})();
