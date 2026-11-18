'use strict';

(async function () {
  const mensaje = document.getElementById('mensaje');
  let ctx;
  try {
    ctx = await ui.iniciarPagina('clases');
  } catch (error) {
    ui.aviso(mensaje, error.message);
    return;
  }
  const { usuarioId, usuario } = ctx;
  const puedeReservar = ui.esSocioActivo(usuario);
  if (!puedeReservar) {
    ui.aviso(mensaje, usuario.tipo === 'SOCIO'
      ? 'Tu membresía no está activa: para reservar clases tenés que renovarla (RN-03).'
      : 'Las clases son para socios con la membresía activa. Como cliente externo podés reservar canchas.', 'info');
  }

  const select = document.getElementById('sede');
  const lista = document.getElementById('lista');
  const sedes = await api.listarSedes().catch(() => []);
  const nombreSede = new Map(sedes.map((s) => [s.id, s.nombre]));
  select.insertAdjacentHTML('beforeend', sedes.map((s) => `<option value="${s.id}">${ui.esc(s.nombre)}</option>`).join(''));
  select.addEventListener('change', cargar);

  async function cargar() {
    lista.className = 'cargando';
    lista.textContent = 'Cargando clases…';
    try {
      const [clases, misReservas] = await Promise.all([
        api.listarClases(select.value || undefined),
        usuario.tipo === 'SOCIO' ? api.reservasClaseDeUsuario(usuarioId) : Promise.resolve([]),
      ]);
      const miReserva = new Map(misReservas.filter((r) => r.estado !== 'CANCELADA').map((r) => [r.claseId, r]));
      // En las clases llenas, ver si ya estoy en la lista de espera.
      const enEspera = new Set();
      await Promise.all(clases.filter((c) => c.cuposDisponibles <= 0 && !miReserva.has(c.id)).map(async (c) => {
        const listaEspera = await api.listaEspera(c.id).catch(() => []);
        if (listaEspera.some((e) => e.usuarioId === usuarioId)) enEspera.add(c.id);
      }));
      lista.className = '';
      if (!clases.length) {
        lista.innerHTML = '<p class="vacio">No hay clases programadas. Se cargan desde Gestión.</p>';
        return;
      }
      const ahora = Date.now();
      lista.innerHTML = `<ul class="lista">${clases.map((c) => {
        const horas = (new Date(c.fechaHora) - ahora) / 36e5;
        const r = miReserva.get(c.id);
        const llena = c.cuposDisponibles <= 0;
        const ocupados = c.capacidadMaxima - c.cuposDisponibles;
        const pct = Math.round((ocupados / c.capacidadMaxima) * 100);
        let accion;
        if (r && r.estado === 'ASISTIO') accion = ui.estado('ASISTIO');
        else if (r) accion = `<button class="boton chico tinta" data-qr="${r.id}" data-clase="${c.id}">QR de asistencia</button>`;
        else if (!puedeReservar) accion = '';
        else if (horas > 48) {
          const abre = new Date(new Date(c.fechaHora).getTime() - 48 * 36e5);
          accion = `<span class="texto-2 chico">Se puede reservar desde el ${ui.fechaHora(abre)}</span>`;
        } else if (llena && enEspera.has(c.id)) accion = '<span class="estado alerta">En lista de espera</span>';
        else if (llena) accion = `<button class="boton chico sec" data-espera="${c.id}">Anotarme en lista de espera</button>`;
        else accion = `<button class="boton chico" data-reservar="${c.id}">Reservar lugar</button>`;
        return `
          <li class="item">
            <div class="dia"><div class="mes">${ui.mes(c.fechaHora)}</div><div class="num">${ui.diaNum(c.fechaHora)}</div></div>
            <div class="cuerpo">
              <div class="titulo">${ui.esc(c.tipo)} ${r ? ui.estado(r.estado === 'ASISTIO' ? 'ASISTIO' : 'CONFIRMADA') : ''}</div>
              <div class="meta">${ui.fecha(c.fechaHora)}, ${ui.hora(c.fechaHora)} hs con ${ui.esc(c.instructor)}${nombreSede.get(c.sedeId) ? ` · ${ui.esc(nombreSede.get(c.sedeId))}` : ''}</div>
              <div style="max-width:260px">
                <div class="medidor ${llena ? 'lleno' : pct >= 70 ? 'medio' : ''}" style="margin:8px 0 2px;height:6px"><span style="width:${pct}%"></span></div>
                <div class="texto-2 chico">${llena ? 'Clase llena' : `Quedan ${c.cuposDisponibles} de ${c.capacidadMaxima} lugares`}</div>
              </div>
            </div>
            <div class="acciones">${accion}</div>
          </li>`;
      }).join('')}</ul>`;

      lista.querySelectorAll('[data-reservar]').forEach((b) => b.addEventListener('click', async () => {
        b.disabled = true;
        try {
          await api.reservarClase(b.dataset.reservar, usuarioId);
          ui.toast('¡Listo! Tenés tu lugar en la clase.');
          cargar();
        } catch (error) {
          ui.toast(error.message, 'error');
          cargar();
        }
      }));
      lista.querySelectorAll('[data-espera]').forEach((b) => b.addEventListener('click', async () => {
        b.disabled = true;
        try {
          await api.anotarListaEspera(b.dataset.espera, usuarioId);
          ui.toast('Te anotamos en la lista de espera. Si se libera un lugar, te avisamos.');
          b.outerHTML = '<span class="estado alerta">En lista de espera</span>';
        } catch (error) {
          ui.toast(error.message, 'error');
          b.disabled = false;
        }
      }));
      lista.querySelectorAll('[data-qr]').forEach((b) => b.addEventListener('click', () => {
        const clase = clases.find((c) => c.id === b.dataset.clase);
        reservasComun.verQrAsistencia({ reserva: { id: b.dataset.qr }, clase });
      }));
    } catch (error) {
      lista.className = '';
      ui.aviso(lista, error.message);
    }
  }
  cargar();
})();
