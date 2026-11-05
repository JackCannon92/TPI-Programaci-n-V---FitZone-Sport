'use strict';

(async function () {
  const mensaje = document.getElementById('mensaje');
  let ctx;
  try {
    ctx = await ui.iniciarPagina('mis-reservas');
  } catch (error) {
    ui.aviso(mensaje, error.message);
    return;
  }
  const { usuarioId, usuario } = ctx;
  const socio = usuario.tipo === 'SOCIO';

  // ---------- Pestañas ----------
  const tabs = document.querySelectorAll('[role=tab]');
  function mostrarTab(nombre) {
    tabs.forEach((t) => t.setAttribute('aria-selected', t.dataset.tab === nombre));
    document.querySelectorAll('[data-panel]').forEach((p) => p.classList.toggle('oculto', p.dataset.panel !== nombre));
  }
  tabs.forEach((t) => t.addEventListener('click', () => mostrarTab(t.dataset.tab)));
  if (!socio) document.getElementById('tab-clases').classList.add('oculto');
  if (location.hash === '#clases' && socio) mostrarTab('clases');
  if (location.hash === '#pagos') mostrarTab('pagos');

  const sedes = new Map((await api.listarSedes().catch(() => [])).map((s) => [s.id, s]));
  const cacheCanchas = new Map();
  async function cancha(id) {
    if (!cacheCanchas.has(id)) cacheCanchas.set(id, api.obtenerCancha(id).catch(() => null));
    return cacheCanchas.get(id);
  }

  // ---------- Canchas ----------
  async function cargarCanchas() {
    const cont = document.getElementById('lista-canchas');
    try {
      const [reservas, pagos] = await Promise.all([api.reservasCanchaDeUsuario(usuarioId), api.pagosDeUsuario(usuarioId)]);
      const pagoDe = new Map(pagos.filter((p) => p.estado === 'APROBADO').map((p) => [p.reservaCanchaId, p]));
      cont.className = '';
      if (!reservas.length) {
        cont.innerHTML = '<p class="vacio">Todavía no reservaste canchas.</p><a class="boton" href="reservar.html">Reservar una cancha</a>';
        return;
      }
      const canchas = await Promise.all(reservas.map((r) => cancha(r.canchaId)));
      const ahora = Date.now();
      cont.innerHTML = `<ul class="lista">${reservas.map((r, i) => {
        const c = canchas[i];
        const terminada = new Date(r.fechaHoraFin).getTime() < ahora;
        const pago = pagoDe.get(r.id);
        const acciones = [];
        if (r.estado === 'PENDIENTE_PAGO' && !terminada) acciones.push(`<button class="boton chico" data-accion="pagar" data-id="${r.id}">Pagar ${ui.dinero(r.precioFinal)}</button>`);
        if (r.estado === 'CONFIRMADA' && !terminada) acciones.push(`<button class="boton chico tinta" data-accion="qr" data-id="${r.id}">QR de ingreso</button>`);
        if (pago) acciones.push(`<a class="boton chico sec" href="${api.urlComprobante(pago.id)}" target="_blank" rel="noopener">Comprobante</a>`);
        if (r.estado !== 'CANCELADA' && !terminada) acciones.push(`<button class="boton chico peligro" data-accion="cancelar" data-id="${r.id}">Cancelar</button>`);
        return `
          <li class="item">
            <div class="dia"><div class="mes">${ui.mes(r.fechaHoraInicio)}</div><div class="num">${ui.diaNum(r.fechaHoraInicio)}</div></div>
            <div class="cuerpo">
              <div class="titulo">${ui.esc(c ? c.nombre : 'Cancha')}${c && sedes.get(c.sedeId) ? ` <span class="texto-2" style="font-weight:400">en ${ui.esc(sedes.get(c.sedeId).nombre)}</span>` : ''}</div>
              <div class="meta">${ui.hora(r.fechaHoraInicio)} a ${ui.hora(r.fechaHoraFin)} hs · ${ui.dinero(r.precioFinal)}${terminada ? ' · ya pasó' : ''}</div>
            </div>
            ${ui.estado(r.estado)}
            <div class="acciones">${acciones.join('')}</div>
          </li>`;
      }).join('')}</ul>`;

      cont.querySelectorAll('[data-accion]').forEach((b) => b.addEventListener('click', async () => {
        const r = reservas.find((x) => x.id === b.dataset.id);
        const c = await cancha(r.canchaId);
        if (b.dataset.accion === 'pagar') {
          const pago = await reservasComun.abrirPago({ reserva: r, usuarioId, titulo: `${c ? c.nombre : 'Cancha'} · ${ui.fechaHora(r.fechaHoraInicio)}` });
          if (pago) {
            ui.toast('Pago aprobado. ¡Reserva confirmada!');
            await recargar();
            reservasComun.verQrReserva({ reserva: r, cancha: c, pago, usuario });
          }
        } else if (b.dataset.accion === 'qr') {
          reservasComun.verQrReserva({ reserva: r, cancha: c, pago: pagoDe.get(r.id), usuario });
        } else if (b.dataset.accion === 'cancelar') {
          if (!window.confirm('¿Cancelar esta reserva? El turno queda libre para otra persona.')) return;
          try {
            await api.cancelarReservaCancha(r.id);
            ui.toast('Reserva cancelada');
            recargar();
          } catch (error) { ui.toast(error.message, 'error'); }
        }
      }));
    } catch (error) {
      cont.className = '';
      ui.aviso(cont, error.message);
    }
  }

  // ---------- Clases ----------
  async function cargarClases() {
    const cont = document.getElementById('lista-clases');
    if (!socio) return;
    try {
      const reservas = await api.reservasClaseDeUsuario(usuarioId);
      cont.className = '';
      if (!reservas.length) {
        cont.innerHTML = '<p class="vacio">Todavía no te anotaste en ninguna clase.</p><a class="boton" href="clases.html">Ver clases</a>';
        return;
      }
      const clases = await Promise.all(reservas.map((r) => api.obtenerClase(r.claseId).catch(() => null)));
      const filas = reservas.map((r, i) => ({ r, c: clases[i] })).filter((x) => x.c)
        .sort((a, b) => new Date(b.c.fechaHora) - new Date(a.c.fechaHora));
      const ahora = Date.now();
      cont.innerHTML = `<ul class="lista">${filas.map(({ r, c }) => {
        const pasada = new Date(c.fechaHora).getTime() + 3600000 < ahora;
        const acciones = [];
        if (r.estado === 'CONFIRMADA' && !pasada) {
          acciones.push(`<button class="boton chico tinta" data-accion="qr" data-id="${r.id}">QR de asistencia</button>`);
          acciones.push(`<button class="boton chico peligro" data-accion="cancelar" data-id="${r.id}">Cancelar</button>`);
        }
        return `
          <li class="item">
            <div class="dia"><div class="mes">${ui.mes(c.fechaHora)}</div><div class="num">${ui.diaNum(c.fechaHora)}</div></div>
            <div class="cuerpo">
              <div class="titulo">${ui.esc(c.tipo)}</div>
              <div class="meta">${ui.hora(c.fechaHora)} hs con ${ui.esc(c.instructor)}${sedes.get(c.sedeId) ? ` · ${ui.esc(sedes.get(c.sedeId).nombre)}` : ''}</div>
            </div>
            ${ui.estado(r.estado)}
            <div class="acciones">${acciones.join('')}</div>
          </li>`;
      }).join('')}</ul>`;
      cont.querySelectorAll('[data-accion]').forEach((b) => b.addEventListener('click', async () => {
        const fila = filas.find((x) => x.r.id === b.dataset.id);
        if (b.dataset.accion === 'qr') {
          reservasComun.verQrAsistencia({ reserva: fila.r, clase: fila.c });
        } else {
          const horas = (new Date(fila.c.fechaHora) - Date.now()) / 36e5;
          const aviso = horas < 2 ? ' Faltan menos de 2 horas: la cancelación queda con penalidad.' : '';
          if (!window.confirm(`¿Cancelar tu lugar en ${fila.c.tipo}?${aviso}`)) return;
          try {
            await api.cancelarReservaClase(fila.r.id);
            ui.toast('Cancelaste tu lugar. Si había lista de espera, se le avisa al primero.');
            recargar();
          } catch (error) { ui.toast(error.message, 'error'); }
        }
      }));
    } catch (error) {
      cont.className = '';
      ui.aviso(cont, error.message);
    }
  }

  // ---------- Pagos ----------
  async function cargarPagos() {
    const cont = document.getElementById('lista-pagos');
    try {
      const pagos = await api.pagosDeUsuario(usuarioId);
      cont.className = '';
      if (!pagos.length) {
        cont.innerHTML = '<p class="vacio">Todavía no hiciste pagos.</p>';
        return;
      }
      cont.innerHTML = `
        <div class="tabla-envoltura"><table>
          <thead><tr><th>Fecha</th><th>Monto</th><th>Tarjeta</th><th>Estado</th><th></th></tr></thead>
          <tbody>${pagos.map((p) => `
            <tr>
              <td>${ui.fechaHora(p.created_at || p.createdAt)}</td>
              <td><strong>${ui.dinero(p.monto)}</strong></td>
              <td>•••• ${ui.esc(p.ultimos4 || '----')}</td>
              <td>${ui.estado(p.estado)}${p.motivoRechazo ? `<div class="texto-2 chico">${ui.esc(p.motivoRechazo)}</div>` : ''}</td>
              <td>${p.estado === 'APROBADO' ? `<a class="boton chico sec" href="${api.urlComprobante(p.id)}" target="_blank" rel="noopener">Comprobante</a>` : ''}</td>
            </tr>`).join('')}</tbody>
        </table></div>`;
    } catch (error) {
      cont.className = '';
      ui.aviso(cont, error.message);
    }
  }

  function recargar() {
    return Promise.all([cargarCanchas(), cargarClases(), cargarPagos()]);
  }
  recargar();
})();
