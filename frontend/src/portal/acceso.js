'use strict';

(async function () {
  const mensaje = document.getElementById('mensaje');
  let ctx;
  try {
    ctx = await ui.iniciarPagina('acceso');
  } catch (error) {
    ui.aviso(mensaje, error.message);
    return;
  }
  const { usuarioId, usuario } = ctx;
  const contenido = document.getElementById('contenido');
  const bajada = document.getElementById('bajada');

  if (usuario.tipo === 'CLIENTE_EXTERNO') return vistaExterno();
  if (!ui.esSocioActivo(usuario)) {
    bajada.textContent = 'Tu membresía no está activa.';
    contenido.innerHTML = `<div class="panel"><p>Para entrar con tu QR de socio necesitás la membresía activa. Renovala en recepción. Si tenés una cancha reservada y paga, podés entrar con el QR de esa reserva desde <a href="mis-reservas.html">Mis reservas</a>.</p></div>`;
    return;
  }
  vistaSocio();

  // ---------- Socio: QR dinámico (RF-04) y QR sin conexión (ADR-016) ----------
  function vistaSocio() {
    bajada.textContent = 'Mostrá este QR en el molinete de cualquier sede. Cambia cada minuto, así una captura de pantalla vieja no sirve.';
    contenido.innerHTML = `
      <div class="columnas columnas-acceso">
        <div>
          <div class="pestanas" role="tablist" style="justify-content:center">
            <button role="tab" aria-selected="true" data-modo="dinamico">Con conexión</button>
            <button role="tab" aria-selected="false" data-modo="offline">Sin conexión</button>
          </div>
          <div id="pase" aria-live="polite"><p class="cargando">Generando tu QR…</p></div>
        </div>
        <section class="panel" id="explicacion"></section>
      </div>`;

    const EXPLICACION = {
      dinamico: `
        <h2>Cómo entrar</h2>
        <ol style="padding-left:20px;margin:0 0 16px">
          <li>Abrí esta pantalla al llegar a la sede.</li>
          <li>Acercá el QR al lector del molinete.</li>
          <li>Si el molinete marca verde, pasá. Al salir, se registra tu egreso.</li>
        </ol>
        <p class="texto-2">El código se renueva solo cuando el anillo llega a cero. Solo se puede estar adentro de una sede a la vez.</p>`,
      offline: `
        <h2>Si la sede se queda sin internet</h2>
        <p>Este QR lo valida el molinete por su cuenta, sin consultar el sistema. Está firmado digitalmente, así que no se puede falsificar.</p>
        <p class="texto-2">Dura 24 horas o hasta que vence tu membresía, lo que pase primero. Generalo antes de salir de casa si sabés que la sede tiene problemas de conexión.</p>`,
    };

    let timer = null;
    let modo = 'dinamico';
    const paseCont = document.getElementById('pase');
    const explicacion = document.getElementById('explicacion');
    const nombre = usuario.nombre_completo;
    const vence = `Socio · vence ${ui.fecha(`${usuario.membresia.fecha_vencimiento}T12:00:00`)}`;

    async function dinamico() {
      clearInterval(timer);
      try {
        const qr = await api.qrSocio(usuarioId);
        let seg = qr.expiraEnSegundos;
        paseCont.innerHTML = ui.pase({
          svg: qr.svg, titulo: 'Acceso de socio', nombre, detalle: ui.esc(vence),
          extraPie: `<div class="anillo" style="--p:${(seg / 60) * 100}" aria-label="Se renueva en ${seg} segundos"><b>${seg}</b></div>`,
        });
        const anillo = paseCont.querySelector('.anillo');
        timer = setInterval(() => {
          seg -= 1;
          if (seg <= 0) { dinamico(); return; }
          anillo.style.setProperty('--p', (seg / 60) * 100);
          anillo.querySelector('b').textContent = seg;
          anillo.setAttribute('aria-label', `Se renueva en ${seg} segundos`);
        }, 1000);
      } catch (error) {
        ui.aviso(paseCont, error.message);
      }
    }

    async function offline() {
      clearInterval(timer);
      try {
        const qr = await api.qrOffline(usuarioId);
        paseCont.innerHTML = ui.pase({
          svg: qr.svg, titulo: 'Acceso sin conexión', nombre, variante: 'coral',
          detalle: `Vale hasta el ${ui.esc(ui.fechaHora(qr.validoHasta))}`,
        });
      } catch (error) {
        ui.aviso(paseCont, error.message);
      }
    }

    function cambiar(nuevo) {
      modo = nuevo;
      contenido.querySelectorAll('[data-modo]').forEach((t) => t.setAttribute('aria-selected', t.dataset.modo === modo));
      explicacion.innerHTML = EXPLICACION[modo];
      paseCont.innerHTML = '<p class="cargando">Generando tu QR…</p>';
      (modo === 'dinamico' ? dinamico : offline)();
    }
    contenido.querySelectorAll('[data-modo]').forEach((t) => t.addEventListener('click', () => cambiar(t.dataset.modo)));
    // Al volver a la pestaña del navegador, pedir un QR fresco.
    document.addEventListener('visibilitychange', () => { if (!document.hidden && modo === 'dinamico') dinamico(); });
    cambiar('dinamico');
  }

  // ---------- Cliente externo: entra con el QR de su reserva (QR 1) ----------
  async function vistaExterno() {
    bajada.textContent = 'Como cliente externo entrás con el QR de cada reserva paga. Sirve desde 30 minutos antes del turno y solo en la sede de esa cancha.';
    try {
      const [reservas, pagos] = await Promise.all([api.reservasCanchaDeUsuario(usuarioId), api.pagosDeUsuario(usuarioId)]);
      const pagoDe = new Map(pagos.filter((p) => p.estado === 'APROBADO').map((p) => [p.reservaCanchaId, p]));
      const proximas = reservas
        .filter((r) => r.estado === 'CONFIRMADA' && new Date(r.fechaHoraFin).getTime() > Date.now())
        .sort((a, b) => new Date(a.fechaHoraInicio) - new Date(b.fechaHoraInicio));
      if (!proximas.length) {
        contenido.innerHTML = `<div class="panel"><p class="vacio">No tenés reservas pagas próximas.</p><a class="boton" href="reservar.html">Reservar una cancha</a></div>`;
        return;
      }
      const canchas = await Promise.all(proximas.map((r) => api.obtenerCancha(r.canchaId).catch(() => null)));
      contenido.innerHTML = `<section class="panel"><h2>Tus próximos ingresos</h2><ul class="lista">${proximas.map((r, i) => `
        <li class="item">
          <div class="dia"><div class="mes">${ui.mes(r.fechaHoraInicio)}</div><div class="num">${ui.diaNum(r.fechaHoraInicio)}</div></div>
          <div class="cuerpo"><div class="titulo">${ui.esc(canchas[i] ? canchas[i].nombre : 'Cancha')}</div>
            <div class="meta">${ui.hora(r.fechaHoraInicio)} a ${ui.hora(r.fechaHoraFin)} hs</div></div>
          <button class="boton chico tinta" data-i="${i}">Ver QR de ingreso</button>
        </li>`).join('')}</ul></section>`;
      contenido.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => {
        const i = Number(b.dataset.i);
        reservasComun.verQrReserva({ reserva: proximas[i], cancha: canchas[i], pago: pagoDe.get(proximas[i].id), usuario });
      }));
    } catch (error) {
      ui.aviso(contenido, error.message);
    }
  }
})();
