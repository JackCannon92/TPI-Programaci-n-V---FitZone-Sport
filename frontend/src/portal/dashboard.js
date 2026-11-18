'use strict';

(async function () {
  const mensaje = document.getElementById('mensaje');
  let ctx;
  try {
    ctx = await ui.iniciarPagina('inicio');
  } catch (error) {
    ui.aviso(mensaje, error.message);
    return;
  }
  const { usuarioId, usuario } = ctx;
  const socio = usuario.tipo === 'SOCIO';

  // ---------- Saludo ----------
  document.getElementById('saludo').textContent = `Hola, ${usuario.nombre_completo.split(' ')[0]}`;
  const sub = document.getElementById('saludo-sub');
  if (socio && usuario.membresia) {
    const dias = ui.diasHasta(usuario.membresia.fecha_vencimiento);
    sub.textContent = dias >= 0
      ? `Tu membresía ${usuario.membresia.plan.toLowerCase()} vence en ${dias} ${dias === 1 ? 'día' : 'días'}.`
      : 'Tu membresía está vencida: renovala en recepción para volver a reservar clases.';
    document.getElementById('saludo-estado').innerHTML = ui.estado(usuario.membresia.estado);
  } else {
    sub.textContent = 'Como cliente externo alquilás canchas y entrás a la sede con el QR de tu reserva.';
    document.getElementById('saludo-estado').innerHTML = ui.estado('CLIENTE_EXTERNO');
  }

  // ---------- Atajos ----------
  const atajos = [
    { href: 'reservar.html', titulo: 'Reservar cancha', texto: socio ? 'Elegí turno; los socios tienen 15 % de descuento.' : 'Elegí sede, cancha y horario.' },
    socio
      ? { href: 'clases.html', titulo: 'Clases', texto: 'Anotate en yoga, funcional y más, hasta 48 hs antes.' }
      : { href: 'mis-reservas.html', titulo: 'Mis reservas', texto: 'Pagá, descargá el comprobante o cancelá.' },
    { href: 'acceso.html', titulo: 'Mi acceso', texto: socio ? 'Tu QR para entrar a cualquier sede.' : 'El QR de ingreso de tus reservas.' },
  ];
  document.getElementById('atajos').innerHTML = atajos
    .map((a) => `<a class="atajo" href="${a.href}"><strong>${a.titulo}</strong><span>${a.texto}</span></a>`)
    .join('');

  // ---------- Membresía ----------
  if (socio && usuario.membresia) {
    const m = usuario.membresia;
    document.getElementById('panel-membresia').classList.remove('oculto');
    document.getElementById('m-plan').textContent = m.plan.charAt(0) + m.plan.slice(1).toLowerCase();
    document.getElementById('m-estado').innerHTML = ui.estado(m.estado);
    document.getElementById('m-inicio').textContent = ui.fecha(`${m.fecha_inicio}T12:00:00`);
    document.getElementById('m-vencimiento').textContent = ui.fecha(`${m.fecha_vencimiento}T12:00:00`);
  }

  // ---------- Próximas reservas (canchas + clases) ----------
  async function cargarProximas() {
    const cont = document.getElementById('proximas');
    try {
      const [reservasCancha, reservasClase] = await Promise.all([
        api.reservasCanchaDeUsuario(usuarioId),
        socio ? api.reservasClaseDeUsuario(usuarioId) : Promise.resolve([]),
      ]);
      const ahora = Date.now();

      const canchasIds = [...new Set(reservasCancha.map((r) => r.canchaId))];
      const canchas = new Map((await Promise.all(canchasIds.map((id) => api.obtenerCancha(id).catch(() => null))))
        .filter(Boolean).map((c) => [c.id, c]));

      const clasesActivas = reservasClase.filter((r) => r.estado === 'CONFIRMADA');
      const clasesIds = [...new Set(clasesActivas.map((r) => r.claseId))];
      const clases = new Map((await Promise.all(clasesIds.map((id) => api.obtenerClase(id).catch(() => null))))
        .filter(Boolean).map((c) => [c.id, c]));

      const items = [
        ...reservasCancha
          .filter((r) => r.estado !== 'CANCELADA' && new Date(r.fechaHoraFin).getTime() > ahora)
          .map((r) => ({
            cuando: r.fechaHoraInicio,
            titulo: canchas.get(r.canchaId)?.nombre || 'Cancha',
            meta: `${ui.fechaHora(r.fechaHoraInicio)} · ${ui.dinero(r.precioFinal)}`,
            estado: r.estado,
          })),
        ...clasesActivas
          .map((r) => ({ r, c: clases.get(r.claseId) }))
          .filter(({ c }) => c && new Date(c.fechaHora).getTime() + 3600000 > ahora)
          .map(({ r, c }) => ({ cuando: c.fechaHora, titulo: `Clase de ${c.tipo}`, meta: `${ui.fechaHora(c.fechaHora)} con ${c.instructor}`, estado: r.estado })),
      ].sort((a, b) => new Date(a.cuando) - new Date(b.cuando)).slice(0, 5);

      if (!items.length) {
        cont.className = '';
        cont.innerHTML = `<p class="vacio">No tenés reservas próximas.</p><a class="boton" href="reservar.html">Reservar una cancha</a>`;
        return;
      }
      cont.className = '';
      cont.innerHTML = `<ul class="lista">${items.map((i) => `
        <li class="item">
          <div class="dia"><div class="mes">${ui.mes(i.cuando)}</div><div class="num">${ui.diaNum(i.cuando)}</div></div>
          <div class="cuerpo"><div class="titulo">${ui.esc(i.titulo)}</div><div class="meta">${ui.esc(i.meta)}</div></div>
          ${ui.estado(i.estado)}
        </li>`).join('')}</ul>
        <p style="margin:14px 0 0"><a href="mis-reservas.html">Ver todas mis reservas</a></p>`;
    } catch (error) {
      cont.className = '';
      ui.aviso(cont, `No se pudieron cargar tus reservas: ${error.message}`);
    }
  }

  // ---------- Aforo ----------
  async function cargarSedes() {
    const select = document.getElementById('select-sede');
    const cont = document.getElementById('aforo');
    const sedes = await api.listarSedes();
    if (!sedes.length) {
      select.innerHTML = '<option>No hay sedes cargadas</option>';
      cont.textContent = 'Cargá una sede desde Gestión.';
      return;
    }
    select.innerHTML = sedes.map((s) => `<option value="${s.id}">${ui.esc(s.nombre)}</option>`).join('');

    async function mostrar() {
      try {
        const a = await api.aforoSede(select.value);
        const pct = a.maximo ? Math.round((a.actual / a.maximo) * 100) : 0;
        const nivel = pct >= 90 ? 'lleno' : pct >= 60 ? 'medio' : '';
        cont.className = '';
        cont.innerHTML = `
          <div style="margin-top:8px"><span class="marcador grande">${a.actual}</span> <span class="texto-2">de ${a.maximo} personas adentro</span></div>
          <div class="medidor ${nivel}"><span style="width:${Math.min(pct, 100)}%"></span></div>
          <p class="texto-2 chico" style="margin:0">${a.disponible > 0 ? `Quedan ${a.disponible} lugares.` : 'La sede está completa.'}</p>`;
      } catch (error) {
        ui.aviso(cont, `No se pudo consultar el aforo: ${error.message}`);
      }
    }
    select.addEventListener('change', mostrar);
    mostrar();
  }

  cargarProximas();
  cargarSedes().catch((error) => ui.aviso(document.getElementById('aforo'), error.message));
})();
