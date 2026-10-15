'use strict';

(function () {
  const form = document.getElementById('form-registro');
  const mensajeDiv = document.getElementById('mensaje');
  const tipoSelect = document.getElementById('tipo');
  const bloqueMembresia = document.getElementById('bloque-membresia');

  function actualizarBloqueMembresia() {
    bloqueMembresia.style.display = tipoSelect.value === 'SOCIO' ? 'block' : 'none';
  }
  tipoSelect.addEventListener('change', actualizarBloqueMembresia);
  actualizarBloqueMembresia();

  function mostrarError(texto) {
    mensajeDiv.innerHTML = `<div class="mensaje-error">${texto}</div>`;
  }

  // El backend (MembresiaModel) pide fecha_inicio y fecha_vencimiento a mano
  // (el endpoint que las calcula solo -membresiasService.asignarMembresia-
  // no está conectado a ninguna ruta todavía), así que las calculamos acá
  // con la misma regla: mensual +1 mes, trimestral +3, anual +12.
  function calcularVencimiento(plan) {
    const inicio = new Date();
    const vencimiento = new Date(inicio);
    const meses = { MENSUAL: 1, TRIMESTRAL: 3, ANUAL: 12 }[plan] || 1;
    vencimiento.setMonth(vencimiento.getMonth() + meses);
    const aISO = (d) => d.toISOString().slice(0, 10);
    return { fecha_inicio: aISO(inicio), fecha_vencimiento: aISO(vencimiento) };
  }

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    mensajeDiv.innerHTML = '';

    const tipo = tipoSelect.value;
    const usuario = {
      dni: document.getElementById('dni').value.trim(),
      nombre_completo: document.getElementById('nombre').value.trim(),
      email: document.getElementById('email').value.trim(),
      telefono: document.getElementById('telefono').value.trim() || undefined,
      tipo,
    };

    let membresia = null;
    if (tipo === 'SOCIO') {
      const plan = document.getElementById('plan').value;
      membresia = { plan, ...calcularVencimiento(plan) };
    }

    try {
      const resultado = await api.registrarUsuario(usuario, membresia);
      sesion.guardar(resultado.usuario.id);
      window.location.href = 'dashboard.html';
    } catch (error) {
      mostrarError(error.message);
    }
  });
})();
