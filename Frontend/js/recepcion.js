'use strict';

(async function () {
  const mensaje = document.getElementById('mensaje');
  try {
    await ui.iniciarPagina('recepcion');
  } catch (error) {
    ui.aviso(mensaje, error.message);
    return;
  }

  const select = document.getElementById('sede');
  const resultado = document.getElementById('resultado');
  const sedes = await api.listarSedes().catch((e) => { ui.aviso(mensaje, e.message); return []; });
  if (!sedes.length) {
    select.innerHTML = '<option>No hay sedes</option>';
    return;
  }
  select.innerHTML = sedes.map((s) => `<option value="${s.id}">${ui.esc(s.nombre)}</option>`).join('');
  try { const guardada = localStorage.getItem('fitzone_sede_recepcion'); if (guardada && sedes.some((s) => s.id === guardada)) select.value = guardada; } catch (_) { /* sin almacenamiento */ }
  select.addEventListener('change', () => {
    try { localStorage.setItem('fitzone_sede_recepcion', select.value); } catch (_) { /* sin almacenamiento */ }
    refrescar();
  });

  // ---------- Aforo y presentes (RF-05) ----------
  async function refrescar() {
    const sedeId = select.value;
    const aforoCont = document.getElementById('aforo');
    const presCont = document.getElementById('presentes');
    try {
      const [a, presentes] = await Promise.all([api.aforoSede(sedeId), api.presentes(sedeId)]);
      const pct = a.maximo ? Math.round((a.actual / a.maximo) * 100) : 0;
      aforoCont.className = '';
      aforoCont.innerHTML = `
        <span class="marcador grande">${a.actual}</span><span class="texto-2"> / ${a.maximo}</span>
        <div class="medidor ${pct >= 90 ? 'lleno' : pct >= 60 ? 'medio' : ''}"><span style="width:${Math.min(pct, 100)}%"></span></div>
        <p class="texto-2 chico" style="margin:0">${a.disponible > 0 ? `${a.disponible} lugares libres` : 'Sede completa: no pueden entrar más personas'}</p>`;
      presCont.className = '';
      presCont.innerHTML = presentes.length
        ? `<ul class="lista">${presentes.map((p) => `
            <li class="item">
              <div class="cuerpo"><div class="titulo">${ui.esc(p.nombreCompleto)}</div>
                <div class="meta">Entró ${ui.hora(p.fechaIngreso)} hs · ${p.tipo === 'SOCIO' ? 'Socio' : 'Cliente externo'}</div></div>
              <button class="boton chico sec" data-salida="${p.usuarioId}">Registrar salida</button>
            </li>`).join('')}</ul>`
        : '<p class="vacio">No hay nadie adentro.</p>';
      presCont.querySelectorAll('[data-salida]').forEach((b) => b.addEventListener('click', async () => {
        b.disabled = true;
        try {
          await api.egreso(b.dataset.salida, sedeId);
          ui.toast('Salida registrada');
          refrescar();
        } catch (error) { ui.toast(error.message, 'error'); b.disabled = false; }
      }));
    } catch (error) {
      ui.aviso(aforoCont, error.message);
    }
  }
  refrescar();
  setInterval(() => { if (!document.hidden) refrescar(); }, 15000);

  // ---------- Reconocer el tipo de QR ----------
  function leerPayload(base64url) {
    try {
      const b64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(escape(atob(b64)));
      return JSON.parse(json);
    } catch (_) {
      return null;
    }
  }
  function tipoDeCodigo(codigo) {
    if (/^https?:\/\//.test(codigo) && codigo.includes('/pagos/verificar/')) return { tipo: 'COMPROBANTE', url: codigo };
    const partes = codigo.split('.');
    if (partes.length === 3) return { tipo: 'SOCIO' };
    if (partes.length === 2) {
      const payload = leerPayload(partes[0]);
      if (payload && payload.t === 'COMPROBANTE') return { tipo: 'COMPROBANTE', url: `${API_BASE_URL}/pagos/verificar/${codigo}` };
      if (payload && payload.t) return { tipo: payload.t, payload };
    }
    return { tipo: 'DESCONOCIDO' };
  }

  function mostrar(clase, grande, detalle) {
    resultado.className = `resultado-escaneo ${clase}`;
    resultado.innerHTML = `<div class="grande">${ui.esc(grande)}</div><p style="margin:6px 0 0">${detalle}</p>`;
  }

  async function validar(codigoCrudo) {
    const codigo = codigoCrudo.trim();
    if (!codigo) return;
    const sedeId = select.value;
    const sedeNombre = select.options[select.selectedIndex].text;
    const { tipo, url } = tipoDeCodigo(codigo);
    mostrar('info', 'Validando…', '');
    try {
      if (tipo === 'SOCIO') {
        const r = await api.ingreso(codigo, sedeId);
        mostrar('ok', 'Puede pasar', `${ui.esc(r.usuario.nombreCompleto)} · Socio · ingreso registrado en ${ui.esc(sedeNombre)}.`);
        refrescar();
      } else if (tipo === 'RESERVA_CANCHA') {
        const r = await api.ingresoConReserva(codigo, sedeId);
        mostrar('ok', 'Puede pasar', `${ui.esc(r.usuario.nombreCompleto)} · ${r.usuario.tipo === 'SOCIO' ? 'Socio' : 'Cliente externo'} · entra por su reserva de cancha.`);
        refrescar();
      } else if (tipo === 'ASISTENCIA_CLASE') {
        await api.registrarAsistencia(codigo);
        mostrar('ok', 'Asistencia registrada', 'La reserva de la clase quedó como asistida.');
      } else if (tipo === 'ACCESO_OFFLINE') {
        const r = await api.validarOffline(codigo);
        if (r.valido) mostrar('ok', 'Válido sin conexión', `${ui.esc(r.nombre)} · el molinete lo aceptaría sin internet (firma verificada con la clave pública). Vale hasta el ${ui.esc(ui.fechaHora(r.validoHasta))}.`);
        else mostrar('mal', 'No puede pasar', r.motivo === 'VENCIDO' ? 'El QR sin conexión venció: que genere uno nuevo.' : 'La firma no es válida: el QR fue alterado o no es de FitZone.');
      } else if (tipo === 'COMPROBANTE') {
        const r = await api.verificarUrl(url);
        if (r.valido) {
          const c = r.comprobante;
          mostrar('ok', 'Comprobante auténtico', `${ui.dinero(c.monto)} · ${ui.esc(c.cancha)} · turno del ${ui.esc(ui.fechaHora(c.turno.inicio))}. Pago ${c.estado.toLowerCase()}.`);
        } else {
          mostrar('mal', 'Comprobante no válido', ui.esc(r.motivo));
        }
      } else {
        mostrar('mal', 'QR no reconocido', 'Este código no es un QR de FitZone.');
      }
    } catch (error) {
      const titulo = error.status === 409 && /aforo/i.test(error.message) ? 'Sede completa' : 'No puede pasar';
      mostrar('mal', titulo, ui.esc(error.message));
    }
  }

  document.getElementById('form-codigo').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const txt = document.getElementById('codigo');
    validar(txt.value);
    txt.value = '';
  });

  // ---------- Cámara (lector jsQR, se carga solo si se usa) ----------
  const btnCamara = document.getElementById('btn-camara');
  const estadoCamara = document.getElementById('estado-camara');
  const camara = document.getElementById('camara');
  const video = document.getElementById('video');
  let stream = null;
  let ultimo = '';
  let ultimoEn = 0;

  function cargarLector() {
    if (window.jsQR) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
      s.onload = resolve;
      s.onerror = () => reject(new Error('No se pudo cargar el lector de QR (hace falta internet). Pegá el código a mano.'));
      document.head.appendChild(s);
    });
  }

  function apagar() {
    if (stream) stream.getTracks().forEach((t) => t.stop());
    stream = null;
    camara.classList.add('oculto');
    btnCamara.textContent = 'Usar la cámara';
    estadoCamara.textContent = '';
  }

  btnCamara.addEventListener('click', async () => {
    if (stream) { apagar(); return; }
    try {
      estadoCamara.textContent = 'Abriendo la cámara…';
      await cargarLector();
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      video.srcObject = stream;
      await video.play();
      camara.classList.remove('oculto');
      btnCamara.textContent = 'Apagar la cámara';
      estadoCamara.textContent = 'Apuntá al QR';
      const canvas = document.createElement('canvas');
      const ctx2d = canvas.getContext('2d', { willReadFrequently: true });
      const leer = () => {
        if (!stream) return;
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx2d.drawImage(video, 0, 0);
          const img = ctx2d.getImageData(0, 0, canvas.width, canvas.height);
          const qr = window.jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
          // No validar el mismo código dos veces seguidas en 4 segundos.
          if (qr && qr.data && (qr.data !== ultimo || Date.now() - ultimoEn > 4000)) {
            ultimo = qr.data;
            ultimoEn = Date.now();
            validar(qr.data);
          }
        }
        requestAnimationFrame(leer);
      };
      requestAnimationFrame(leer);
    } catch (error) {
      apagar();
      estadoCamara.textContent = error.name === 'NotAllowedError' ? 'No se dio permiso para usar la cámara.' : (error.message || 'No se pudo abrir la cámara.');
    }
  });
})();
