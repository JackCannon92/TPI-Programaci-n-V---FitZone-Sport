'use strict';

(async function () {
  const mensaje = document.getElementById('mensaje');
  let ctx;
  try {
    ctx = await ui.iniciarPagina('reservar');
  } catch (error) {
    ui.aviso(mensaje, error.message);
    return;
  }
  const { usuarioId, usuario } = ctx;

  const estado = { sede: null, cancha: null, dia: ui.isoDia(), turno: null, cotizacion: null };
  const canchasCont = document.getElementById('canchas');
  const turnosCont = document.getElementById('turnos');
  const resumen = document.getElementById('resumen');
  const NOMBRES_TIPO = { PADEL: 'Pádel', FUTBOL: 'Fútbol', TENIS: 'Tenis', BASQUET: 'Básquet' };

  // ---------- Días: hoy y los 6 siguientes ----------
  function pintarDias() {
    const cont = document.getElementById('dias');
    const dias = [];
    for (let i = 0; i < 7; i += 1) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dias.push(d);
    }
    cont.innerHTML = dias.map((d) => {
      const iso = ui.isoDia(d);
      const nombre = d.toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', '');
      return `<button type="button" data-dia="${iso}" aria-pressed="${iso === estado.dia}">${nombre}<b>${d.getDate()}</b></button>`;
    }).join('');
    cont.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      estado.dia = b.dataset.dia;
      estado.turno = null;
      cont.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b));
      cargarTurnos();
      pintarResumen();
    }));
  }

  // ---------- Sedes y canchas ----------
  async function cargarSedes() {
    const select = document.getElementById('sede');
    const sedes = await api.listarSedes();
    if (!sedes.length) {
      select.innerHTML = '<option>No hay sedes cargadas</option>';
      canchasCont.innerHTML = '<p class="vacio">Todavía no hay sedes. Cargalas desde Gestión.</p>';
      return;
    }
    select.innerHTML = sedes.map((s) => `<option value="${s.id}">${ui.esc(s.nombre)}</option>`).join('');
    select.addEventListener('change', () => elegirSede(sedes.find((s) => s.id === select.value)));
    elegirSede(sedes[0]);
  }

  async function elegirSede(sede) {
    estado.sede = sede;
    estado.cancha = null;
    estado.turno = null;
    pintarResumen();
    turnosCont.innerHTML = '<p class="cargando">Elegí una cancha para ver los horarios.</p>';
    canchasCont.innerHTML = '<p class="cargando">Cargando canchas…</p>';
    try {
      const canchas = await api.canchasDeSede(sede.id);
      if (!canchas.length) {
        canchasCont.innerHTML = '<p class="vacio">Esta sede todavía no tiene canchas.</p>';
        return;
      }
      canchasCont.innerHTML = canchas.map((c) => `
        <button type="button" class="opcion-cancha" data-id="${c.id}" aria-pressed="false" ${c.estado !== 'DISPONIBLE' ? 'disabled' : ''}>
          <strong>${ui.esc(c.nombre)}</strong>
          <span>${NOMBRES_TIPO[c.tipo] || c.tipo} · ${c.estado === 'DISPONIBLE' ? `${ui.dinero(c.precioHora)} la hora` : 'En mantenimiento'}</span>
        </button>`).join('');
      canchasCont.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
        canchasCont.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b));
        estado.cancha = canchas.find((c) => c.id === b.dataset.id);
        estado.turno = null;
        cargarTurnos();
        pintarResumen();
      }));
      const primera = canchasCont.querySelector('button:not(:disabled)');
      if (primera) primera.click();
    } catch (error) {
      ui.aviso(canchasCont, error.message);
    }
  }

  // ---------- Turnos (disponibilidad, RF-10) ----------
  async function cargarTurnos() {
    if (!estado.cancha) return;
    turnosCont.innerHTML = '<p class="cargando">Buscando horarios…</p>';
    try {
      const disp = await api.disponibilidad(estado.cancha.id, estado.dia);
      const libres = disp.slots.filter((s) => s.disponible).length;
      turnosCont.innerHTML = disp.slots.map((s) => `
        <button type="button" class="turno ${s.pico ? 'pico' : ''}" data-inicio="${s.inicio}" aria-pressed="false"
          ${s.disponible ? '' : 'disabled'} aria-label="${s.hora}${s.disponible ? (s.pico ? ', libre, horario pico' : ', libre') : ', no disponible'}">
          ${s.hora}<small>${s.disponible ? (s.pico ? 'pico' : 'libre') : (new Date(s.inicio).getTime() <= Date.now() ? 'ya pasó' : 'ocupado')}</small>
        </button>`).join('') + (libres ? '' : '<p class="vacio" style="grid-column:1/-1">No quedan turnos libres este día. Probá con otro.</p>');
      // Si hoy ya no quedan turnos (por ejemplo, de noche), pasar solo al día siguiente.
      if (!libres && !estado.avanzado && estado.dia === ui.isoDia()) {
        estado.avanzado = true;
        const siguiente = document.querySelector('#dias button:nth-child(2)');
        if (siguiente) { siguiente.click(); return; }
      }
      turnosCont.querySelectorAll('.turno:not(:disabled)').forEach((b) => b.addEventListener('click', () => {
        turnosCont.querySelectorAll('.turno').forEach((x) => x.setAttribute('aria-pressed', x === b));
        estado.turno = b.dataset.inicio;
        cotizar();
      }));
    } catch (error) {
      ui.aviso(turnosCont, error.message);
    }
  }

  // ---------- Precio (Strategy, RF-11) ----------
  async function cotizar() {
    estado.cotizacion = null;
    pintarResumen(true);
    try {
      estado.cotizacion = await api.cotizar(estado.cancha.id, usuarioId, estado.turno);
    } catch (error) {
      ui.toast(error.message, 'error');
    }
    pintarResumen();
  }

  function pintarResumen(cargando = false) {
    if (!estado.cancha || !estado.turno) {
      resumen.innerHTML = `<p class="texto-2">${estado.cancha ? 'Elegí un horario.' : 'Elegí cancha, día y horario.'}</p>`;
      return;
    }
    const fin = new Date(new Date(estado.turno).getTime() + 3600000);
    const c = estado.cotizacion;
    resumen.innerHTML = `
      <dl class="datos" style="grid-template-columns:1fr;gap:10px;margin-bottom:16px">
        <div><dt>Cancha</dt><dd>${ui.esc(estado.cancha.nombre)} · ${ui.esc(estado.sede.nombre)}</dd></div>
        <div><dt>Turno</dt><dd>${ui.fecha(estado.turno)}, ${ui.hora(estado.turno)} a ${ui.hora(fin)} hs</dd></div>
      </dl>
      ${cargando || !c ? '<p class="cargando">Calculando precio…</p>' : `
        ${reservasComun.lineasPrecio(c.detalle)}
        <div class="total"><span>Total</span><span class="marcador">${ui.dinero(c.precioFinal)}</span></div>
        ${usuario.tipo === 'CLIENTE_EXTERNO' ? '<p class="texto-2 chico">Los socios pagan 15 % menos.</p>' : ''}
        <button type="button" class="boton ancho" id="btn-reservar" style="margin-top:16px">Reservar y pagar</button>`}`;
    const btn = document.getElementById('btn-reservar');
    if (btn) btn.addEventListener('click', reservar);
  }

  // ---------- Reservar, pagar y mostrar el QR ----------
  async function reservar() {
    const btn = document.getElementById('btn-reservar');
    btn.disabled = true;
    btn.textContent = 'Reservando…';
    let reserva;
    try {
      reserva = await api.reservarCancha(estado.cancha.id, usuarioId, estado.turno);
    } catch (error) {
      ui.toast(error.status === 409 ? 'Ese turno se acaba de ocupar. Elegí otro horario.' : error.message, 'error');
      await cargarTurnos();
      estado.turno = null;
      pintarResumen();
      return;
    }

    const titulo = `${estado.cancha.nombre} · ${ui.fechaHora(reserva.fechaHoraInicio)}`;
    const pago = await reservasComun.abrirPago({ reserva, usuarioId, titulo });
    await cargarTurnos();
    estado.turno = null;
    pintarResumen();

    if (pago) {
      ui.toast('Pago aprobado. ¡Reserva confirmada!');
      reservasComun.verQrReserva({ reserva, cancha: estado.cancha, pago, usuario });
    } else {
      ui.toast('La reserva quedó guardada sin pagar. Podés pagarla desde Mis reservas.');
    }
  }

  pintarDias();
  cargarSedes().catch((error) => ui.aviso(mensaje, error.message));
})();
