'use strict';

(async function () {
  const mensaje = document.getElementById('mensaje');
  try {
    await ui.iniciarPagina('gestion');
  } catch (error) {
    ui.aviso(mensaje, error.message);
    return;
  }

  const NOMBRES_TIPO = { PADEL: 'Pádel', FUTBOL: 'Fútbol', TENIS: 'Tenis', BASQUET: 'Básquet' };
  let sedes = [];

  // ---------- Pestañas ----------
  const tabs = document.querySelectorAll('[role=tab]');
  tabs.forEach((t) => t.addEventListener('click', () => {
    tabs.forEach((x) => x.setAttribute('aria-selected', x === t));
    document.querySelectorAll('[data-panel]').forEach((p) => p.classList.toggle('oculto', p.dataset.panel !== t.dataset.tab));
  }));

  function opcionesSedes() {
    return sedes.map((s) => `<option value="${s.id}">${ui.esc(s.nombre)}</option>`).join('');
  }

  // ---------- Sedes ----------
  async function cargarSedes() {
    sedes = await api.listarSedes();
    const html = sedes.length ? opcionesSedes() : '<option value="">Primero creá una sede</option>';
    ['c-sede-filtro', 'c-sede', 'cl-sede'].forEach((id) => {
      const sel = document.getElementById(id);
      const previo = sel.value;
      sel.innerHTML = html;
      if (previo && sedes.some((s) => s.id === previo)) sel.value = previo;
    });
    const cont = document.getElementById('lista-sedes');
    cont.className = '';
    cont.innerHTML = sedes.length
      ? `<div class="tabla-envoltura"><table><thead><tr><th>Sede</th><th>Dirección</th><th>Aforo máximo</th></tr></thead><tbody>
          ${sedes.map((s) => `<tr><td><strong>${ui.esc(s.nombre)}</strong></td><td>${ui.esc(s.direccion || '-')}</td><td>${s.aforoMaximo}</td></tr>`).join('')}
        </tbody></table></div>`
      : '<p class="vacio">Todavía no hay sedes.</p>';
  }

  document.getElementById('form-sede').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const msg = document.getElementById('s-msg');
    const datos = {
      nombre: document.getElementById('s-nombre').value.trim(),
      aforoMaximo: Number(document.getElementById('s-aforo').value),
    };
    const direccion = document.getElementById('s-direccion').value.trim();
    if (direccion) datos.direccion = direccion;
    if (datos.nombre.length < 2) { ui.aviso(msg, 'Poné un nombre de al menos 2 letras.'); return; }
    try {
      await api.crearSede(datos);
      ui.aviso(msg, '');
      ev.target.reset();
      ui.toast(`Sede "${datos.nombre}" creada`);
      await cargarSedes();
      cargarCanchas();
    } catch (error) { ui.aviso(msg, error.message); }
  });

  // ---------- Canchas (RF-12: estado) ----------
  async function cargarCanchas() {
    const cont = document.getElementById('lista-canchas');
    const sedeId = document.getElementById('c-sede-filtro').value;
    if (!sedeId) { cont.className = ''; cont.innerHTML = '<p class="vacio">Creá una sede para cargar canchas.</p>'; return; }
    try {
      const canchas = await api.canchasDeSede(sedeId);
      cont.className = '';
      cont.innerHTML = canchas.length
        ? `<div class="tabla-envoltura"><table><thead><tr><th>Cancha</th><th>Deporte</th><th>Precio por hora</th><th>Estado</th></tr></thead><tbody>
            ${canchas.map((c) => `<tr>
              <td><strong>${ui.esc(c.nombre)}</strong></td>
              <td>${NOMBRES_TIPO[c.tipo] || c.tipo}</td>
              <td>${ui.dinero(c.precioHora)}</td>
              <td><select data-cancha="${c.id}" aria-label="Estado de ${ui.esc(c.nombre)}" style="margin:0;min-width:170px">
                ${['DISPONIBLE', 'MANTENIMIENTO', 'INACTIVA'].map((e) => `<option value="${e}" ${e === c.estado ? 'selected' : ''}>${{ DISPONIBLE: 'Disponible', MANTENIMIENTO: 'En mantenimiento', INACTIVA: 'Inactiva' }[e]}</option>`).join('')}
              </select></td></tr>`).join('')}
          </tbody></table></div>`
        : '<p class="vacio">Esta sede todavía no tiene canchas.</p>';
      cont.querySelectorAll('[data-cancha]').forEach((sel) => sel.addEventListener('change', async () => {
        try {
          await api.cambiarEstadoCancha(sel.dataset.cancha, sel.value);
          ui.toast('Estado de la cancha actualizado');
        } catch (error) { ui.toast(error.message, 'error'); cargarCanchas(); }
      }));
    } catch (error) { ui.aviso(cont, error.message); }
  }
  document.getElementById('c-sede-filtro').addEventListener('change', cargarCanchas);

  document.getElementById('form-cancha').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const msg = document.getElementById('c-msg');
    const datos = {
      sedeId: document.getElementById('c-sede').value,
      nombre: document.getElementById('c-nombre').value.trim(),
      tipo: document.getElementById('c-tipo').value,
      precioHora: Number(document.getElementById('c-precio').value),
    };
    if (!datos.sedeId) { ui.aviso(msg, 'Primero creá una sede.'); return; }
    if (datos.nombre.length < 2) { ui.aviso(msg, 'Poné un nombre para la cancha.'); return; }
    try {
      await api.crearCancha(datos);
      ui.aviso(msg, '');
      document.getElementById('c-nombre').value = '';
      ui.toast(`Cancha "${datos.nombre}" creada`);
      document.getElementById('c-sede-filtro').value = datos.sedeId;
      cargarCanchas();
    } catch (error) { ui.aviso(msg, error.message); }
  });

  // ---------- Clases ----------
  async function cargarClases() {
    const cont = document.getElementById('lista-clases');
    try {
      const clases = await api.listarClases();
      const nombreSede = new Map(sedes.map((s) => [s.id, s.nombre]));
      cont.className = '';
      cont.innerHTML = clases.length
        ? `<ul class="lista">${clases.map((c) => `
            <li class="item">
              <div class="dia"><div class="mes">${ui.mes(c.fechaHora)}</div><div class="num">${ui.diaNum(c.fechaHora)}</div></div>
              <div class="cuerpo"><div class="titulo">${ui.esc(c.tipo)}</div>
                <div class="meta">${ui.hora(c.fechaHora)} hs · ${ui.esc(c.instructor)} · ${ui.esc(nombreSede.get(c.sedeId) || '')}</div></div>
              <span class="texto-2 chico">${c.capacidadMaxima - c.cuposDisponibles} / ${c.capacidadMaxima} anotados</span>
            </li>`).join('')}</ul>`
        : '<p class="vacio">No hay clases programadas.</p>';
    } catch (error) { ui.aviso(cont, error.message); }
  }

  // Valor por defecto: hoy, dentro de una hora en punto.
  const enUnaHora = new Date(Date.now() + 3600000);
  enUnaHora.setMinutes(0, 0, 0);
  document.getElementById('cl-fecha').value = `${ui.isoDia(enUnaHora)}T${ui.hora(enUnaHora)}`;

  document.getElementById('form-clase').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const msg = document.getElementById('cl-msg');
    const fechaLocal = document.getElementById('cl-fecha').value;
    const datos = {
      sedeId: document.getElementById('cl-sede').value,
      tipo: document.getElementById('cl-tipo').value.trim(),
      instructor: document.getElementById('cl-instructor').value.trim(),
      fechaHora: fechaLocal ? new Date(fechaLocal).toISOString() : '',
      capacidadMaxima: Number(document.getElementById('cl-cupo').value),
    };
    if (!datos.sedeId) { ui.aviso(msg, 'Primero creá una sede.'); return; }
    if (datos.tipo.length < 2 || datos.instructor.length < 2) { ui.aviso(msg, 'Completá la actividad y el instructor.'); return; }
    if (!datos.fechaHora) { ui.aviso(msg, 'Elegí día y hora.'); return; }
    try {
      await api.crearClase(datos);
      ui.aviso(msg, '');
      ui.toast(`Clase de ${datos.tipo} programada`);
      cargarClases();
    } catch (error) { ui.aviso(msg, error.message); }
  });

  try {
    await cargarSedes();
    cargarCanchas();
    cargarClases();
  } catch (error) {
    ui.aviso(mensaje, error.message);
  }
})();
