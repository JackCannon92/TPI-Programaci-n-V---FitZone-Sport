'use strict';

(async function () {
  const mensaje = document.getElementById('mensaje');
  // ADR-007: si no hay servidor, Recepción sigue andando en modo sin conexión.
  let conectado = true;
  try {
    await ui.iniciarPagina('recepcion');
  } catch (error) {
    if (error.status !== 0) {
      ui.aviso(mensaje, error.message);
      return;
    }
    conectado = false;
  }

  const select = document.getElementById('sede');
  const resultado = document.getElementById('resultado');
  const sedes = await api.listarSedes()
    .then((lista) => { terminalOffline.guardarSedes(lista); return lista; })
    .catch((e) => {
      if (e.status === 0) { conectado = false; return terminalOffline.sedesGuardadas(); }
      ui.aviso(mensaje, e.message);
      return [];
    });
  if (!sedes.length) {
    select.innerHTML = '<option>No hay sedes</option>';
    if (!conectado) ui.aviso(mensaje, 'No hay conexión con el servidor y este terminal todavía no guardó las sedes: hay que conectarlo una vez.');
    return;
  }
  select.innerHTML = sedes.map((s) => `<option value="${s.id}">${ui.esc(s.nombre)}</option>`).join('');
  try { const guardada = localStorage.getItem('fitzone_sede_recepcion'); if (guardada && sedes.some((s) => s.id === guardada)) select.value = guardada; } catch (_) { /* sin almacenamiento */ }
  select.addEventListener('change', () => {
    try { localStorage.setItem('fitzone_sede_recepcion', select.value); } catch (_) { /* sin almacenamiento */ }
    refrescar();
  });

  // ---------- Terminal sin conexión (ADR-007) ----------
  const terminalCont = document.getElementById('terminal');
  let ultimoInforme = null; // resultado de la última sincronización
  let ultimoAforo = null;   // último aforo que respondió el servidor
  let adentro = { sedeId: null, usuarios: new Set() }; // últimos presentes que respondió el servidor

  const MOTIVOS_SINCRONIZACION = {
    FIRMA_INVALIDA: 'Rechazado: la firma del QR no es válida.',
    QR_VENCIDO_AL_INGRESAR: 'Rechazado: el QR ya estaba vencido cuando pasó.',
    FECHA_FUTURA: 'Rechazado: la hora del ingreso es futura (revisar el reloj del terminal).',
    ANTERIOR_A_LA_EMISION: 'Rechazado: la hora del ingreso es anterior a la emisión del QR (revisar el reloj del terminal).',
    USUARIO_INEXISTENTE: 'Rechazado: el usuario ya no existe.',
  };
  const textoObservacion = (o) => o.conflicto || MOTIVOS_SINCRONIZACION[o.motivo] || o.motivo;
  const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

  function pintarTerminal() {
    const n = terminalOffline.pendientes();
    const clave = terminalOffline.claveGuardada();
    const inf = ultimoInforme;
    const observaciones = inf && inf.observaciones.length
      ? `<ul class="lista">${inf.observaciones.map((o) => `
          <li class="item"><div class="cuerpo">
            <div class="titulo">${ui.esc(o.nombre || 'Sede')}${o.fechaIngreso ? ` · ${ui.hora(o.fechaIngreso)} hs` : ''}</div>
            <div class="meta">${ui.esc(textoObservacion(o))}</div>
          </div></li>`).join('')}</ul>`
      : '';
    terminalCont.className = '';
    terminalCont.innerHTML = `
      <p style="margin:0 0 8px">${conectado ? '<span class="estado ok">En línea</span>' : '<span class="estado mal">Sin conexión</span>'}</p>
      <p class="texto-2 chico" style="margin:0 0 4px">${n ? `${plural(n, 'ingreso', 'ingresos')} sin sincronizar` : 'No hay ingresos pendientes de sincronizar.'}</p>
      <p class="texto-2 chico" style="margin:0 0 4px">${clave
        ? `Clave pública guardada el ${ui.esc(ui.fechaHora(clave.obtenida))}: valida el QR sin conexión sin el servidor.`
        : 'Todavía no tiene la clave pública: no puede validar el QR sin conexión hasta conectarse.'}</p>
      ${inf ? `<p class="texto-2 chico" style="margin:0 0 4px">Última sincronización ${ui.hora(inf.fecha)} hs: ${plural(inf.aceptados, 'aceptado', 'aceptados')}, ${plural(inf.duplicados, 'repetido', 'repetidos')}, ${plural(inf.rechazados, 'rechazado', 'rechazados')}.</p>` : ''}
      ${observaciones}
      ${n ? `<button type="button" class="boton chico sec" id="btn-sincronizar" ${conectado ? '' : 'disabled'}>Sincronizar ahora</button>` : ''}`;
    const btn = document.getElementById('btn-sincronizar');
    if (btn) btn.addEventListener('click', () => { btn.disabled = true; sincronizarAhora(); });
  }

  /** Manda la cola al servidor. Si se corta la conexión, lo que falta queda para la próxima. */
  async function sincronizarAhora() {
    const informe = await terminalOffline.sincronizar();
    if (informe) {
      if (informe.enviados) {
        conectado = true;
        ultimoInforme = informe;
        ui.toast(informe.enviados === 1 ? 'Se sincronizó 1 ingreso sin conexión' : `Se sincronizaron ${informe.enviados} ingresos sin conexión`);
      }
      if (informe.error) {
        if (informe.error.status === 0) conectado = false;
        else ui.toast(`No se pudo sincronizar: ${informe.error.message}`, 'error');
      }
      if (informe.enviados) refrescar();
    }
    pintarTerminal();
    return informe;
  }

  // ---------- Aforo y presentes (RF-05) ----------
  async function refrescar() {
    const sedeId = select.value;
    const aforoCont = document.getElementById('aforo');
    const presCont = document.getElementById('presentes');
    try {
      const [a, presentes] = await Promise.all([api.aforoSede(sedeId), api.presentes(sedeId)]);
      conectado = true;
      ultimoAforo = a;
      adentro = { sedeId, usuarios: new Set(presentes.map((p) => p.usuarioId)) };
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
      // Con conexión: renovar la clave pública (cada 24 h) y vaciar la cola si quedó algo.
      terminalOffline.actualizarClave().catch(() => {}).then(pintarTerminal);
      if (terminalOffline.pendientes()) sincronizarAhora();
    } catch (error) {
      aforoCont.className = '';
      if (error.status === 0) {
        conectado = false;
        const n = terminalOffline.pendientes(sedeId);
        const ultimo = ultimoAforo && ultimoAforo.sedeId === sedeId ? `Último dato: ${ultimoAforo.actual} de ${ultimoAforo.maximo}` : 'No hay un dato de aforo reciente';
        ui.aviso(aforoCont, `Sin conexión con el servidor. ${ultimo}${n ? `, más ${plural(n, 'ingreso', 'ingresos')} sin conexión` : ''}.`, 'info');
        presCont.className = '';
        ui.aviso(presCont, 'La lista se actualiza cuando vuelva la conexión. Mientras tanto se puede entrar con el QR sin conexión.', 'info');
      } else {
        ui.aviso(aforoCont, error.message);
      }
      pintarTerminal();
    }
  }
  pintarTerminal();
  refrescar();
  setInterval(() => { if (!document.hidden) refrescar(); }, 15000);
  window.addEventListener('online', refrescar);
  window.addEventListener('offline', () => { conectado = false; pintarTerminal(); });

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

  /**
   * QR sin conexión (ADR-003 y ADR-007): el terminal lo valida con la clave
   * pública que tiene guardada, sin consultar el servidor, y guarda el ingreso
   * en la cola. Si hay conexión, la cola se manda en el momento.
   */
  async function ingresoSinConexion(codigo, sedeId) {
    if (conectado && !terminalOffline.claveGuardada()) await terminalOffline.actualizarClave().catch(() => {});
    let r;
    try {
      r = await terminalOffline.validar(codigo);
    } catch (error) {
      // Navegador sin Ed25519: si hay servidor, valida él (tampoco consulta la base).
      if (error.codigo === 'SIN_WEBCRYPTO' && conectado) r = await api.validarOffline(codigo);
      else { mostrar('mal', 'No se puede validar', ui.esc(error.message)); return; }
    }

    if (!r.valido) {
      mostrar('mal', 'No puede pasar', r.motivo === 'VENCIDO' ? 'El QR sin conexión venció: que genere uno nuevo desde Mi acceso.' : 'La firma no es válida: el QR fue alterado o no es de FitZone.');
      return;
    }
    if (terminalOffline.recienEncolado(r.usuarioId, sedeId)) {
      mostrar('info', 'Ya registrado', `${ui.esc(r.nombre)} ya pasó por este terminal hace un momento.`);
      return;
    }
    // Con conexión se aplica RN-01 como con cualquier QR; sin conexión lo concilia el servidor al sincronizar.
    if (conectado && adentro.sedeId === sedeId && adentro.usuarios.has(r.usuarioId)) {
      mostrar('mal', 'No puede pasar', `RN-01: ${ui.esc(r.nombre)} ya figura adentro de esta sede. Registrar la salida primero.`);
      return;
    }
    if (conectado && ultimoAforo && ultimoAforo.sedeId === sedeId && ultimoAforo.actual + terminalOffline.pendientes(sedeId) >= ultimoAforo.maximo) {
      mostrar('mal', 'Sede completa', 'No pueden entrar más personas.');
      return;
    }

    const ingreso = terminalOffline.encolar({ token: codigo, sedeId, usuarioId: r.usuarioId, nombre: r.nombre });
    const detalle = `${ui.esc(r.nombre)} · QR sin conexión validado ${r.local ? 'en este terminal con la clave pública, sin consultar el servidor' : 'por el servidor'}. Vale hasta el ${ui.esc(ui.fechaHora(r.validoHasta))}.`;
    const enCola = () => `Ingreso guardado en el terminal: ${plural(terminalOffline.pendientes(), 'ingreso pendiente', 'ingresos pendientes')} de sincronizar.`;
    mostrar('ok', 'Puede pasar', `${detalle}<br>${conectado ? 'Registrando el ingreso…' : enCola()}`);
    pintarTerminal();
    if (!conectado) return;

    await sincronizarAhora();
    const sigueEnCola = terminalOffline.cola().some((i) => i.id === ingreso.id);
    const obs = !sigueEnCola && ultimoInforme && ultimoInforme.observaciones.find((o) => o.id === ingreso.id);
    mostrar('ok', 'Puede pasar', `${detalle}<br>${sigueEnCola ? enCola() : 'Ingreso registrado en el servidor.'}${obs ? `<br><strong>Ojo:</strong> ${ui.esc(textoObservacion(obs))}` : ''}`);
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
        await ingresoSinConexion(codigo, sedeId);
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
      if (error.status === 0) {
        conectado = false;
        pintarTerminal();
        mostrar('mal', 'Sin conexión', 'Este QR necesita el servidor. Sin conexión solo sirve el QR sin conexión: el socio lo tiene en Mi acceso → Sin conexión.');
        return;
      }
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
