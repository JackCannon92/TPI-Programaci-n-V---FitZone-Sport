'use strict';

(function () {
  document.getElementById('marca-login').insertAdjacentHTML('afterbegin', ui.LOGO);

  const form = document.getElementById('form-registro');
  const mensaje = document.getElementById('mensaje');
  const tipoSelect = document.getElementById('tipo');
  const bloqueMembresia = document.getElementById('bloque-membresia');

  function actualizarBloqueMembresia() {
    bloqueMembresia.classList.toggle('oculto', tipoSelect.value !== 'SOCIO');
  }
  tipoSelect.addEventListener('change', actualizarBloqueMembresia);
  actualizarBloqueMembresia();

  // El alta de usuario pide fecha_inicio y fecha_vencimiento: se calculan con
  // la misma regla del backend (mensual +1 mes, trimestral +3, anual +12).
  function calcularVencimiento(plan) {
    const inicio = new Date();
    const vencimiento = new Date(inicio);
    vencimiento.setMonth(vencimiento.getMonth() + ({ MENSUAL: 1, TRIMESTRAL: 3, ANUAL: 12 }[plan] || 1));
    return { fecha_inicio: ui.isoDia(inicio), fecha_vencimiento: ui.isoDia(vencimiento) };
  }

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    ui.aviso(mensaje, '');

    const tipo = tipoSelect.value;
    const usuario = {
      dni: document.getElementById('dni').value.trim(),
      nombre_completo: document.getElementById('nombre').value.trim(),
      email: document.getElementById('email').value.trim(),
      telefono: document.getElementById('telefono').value.trim() || undefined,
      tipo,
    };
    if (!usuario.dni || !usuario.nombre_completo || !usuario.email) {
      ui.aviso(mensaje, 'Completá DNI, nombre y email.');
      return;
    }

    let membresia = null;
    if (tipo === 'SOCIO') {
      const plan = document.getElementById('plan').value;
      membresia = { plan, ...calcularVencimiento(plan) };
    }

    const boton = form.querySelector('button');
    boton.disabled = true;
    try {
      const resultado = await api.registrarUsuario(usuario, membresia);
      sesion.guardar(resultado.usuario.id);
      window.location.href = 'dashboard.html';
    } catch (error) {
      ui.aviso(mensaje, error.message);
    } finally {
      boton.disabled = false;
    }
  });
})();
