'use strict';

/**
 * Piezas comunes de la interfaz: barra de navegación, formatos de fecha y
 * dinero, avisos (toast), ventana modal y estados. Cada pantalla llama a
 * ui.iniciarPagina('<id>') al empezar.
 */
const ui = (() => {
  const LOGO = `<svg width="22" height="28" viewBox="0 0 22 28" aria-hidden="true">
    <rect x="1.5" y="1.5" width="19" height="25" rx="1.5" fill="none" stroke="#ef5b48" stroke-width="2.4"/>
    <line x1="0" y1="14" x2="22" y2="14" stroke="#fff" stroke-width="2.4"/>
    <line x1="11" y1="7" x2="11" y2="21" stroke="#fff" stroke-width="1.6" opacity=".7"/></svg>`;

  const NAV = [
    { id: 'inicio', href: 'dashboard.html', texto: 'Inicio' },
    { id: 'reservar', href: 'reservar.html', texto: 'Reservar cancha' },
    { id: 'clases', href: 'clases.html', texto: 'Clases' },
    { id: 'mis-reservas', href: 'mis-reservas.html', texto: 'Mis reservas' },
    { id: 'acceso', href: 'acceso.html', texto: 'Mi acceso' },
    { separador: true },
    { id: 'recepcion', href: 'recepcion.html', texto: 'Recepción' },
    { id: 'gestion', href: 'gestion.html', texto: 'Gestión' },
    { id: 'usuarios', href: 'usuarios.html', texto: 'Usuarios' },
  ];

  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

  function esc(texto) {
    return String(texto ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  const dos = (n) => String(n).padStart(2, '0');
  const hora = (f) => { const d = new Date(f); return `${dos(d.getHours())}:${dos(d.getMinutes())}`; };
  const fecha = (f) => { const d = new Date(f); return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`; };
  const fechaHora = (f) => `${fecha(f)}, ${hora(f)} hs`;
  const mes = (f) => MESES[new Date(f).getMonth()];
  const diaNum = (f) => new Date(f).getDate();
  const dinero = (n) => `$ ${Number(n || 0).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  /** YYYY-MM-DD en hora local (no UTC). */
  const isoDia = (d = new Date()) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
  const diasHasta = (fechaISO) => {
    const fin = new Date(`${String(fechaISO).slice(0, 10)}T23:59:59`);
    return Math.ceil((fin - Date.now()) / 86400000);
  };

  const ESTADOS = {
    CONFIRMADA: ['Confirmada', 'ok'],
    PENDIENTE_PAGO: ['Falta pagar', 'alerta'],
    CANCELADA: ['Cancelada', 'gris'],
    ASISTIO: ['Asististe', 'ok'],
    ACTIVO: ['Activa', 'ok'],
    VENCIDO: ['Vencida', 'mal'],
    SUSPENDIDO: ['Suspendida', 'mal'],
    APROBADO: ['Aprobado', 'ok'],
    RECHAZADO: ['Rechazado', 'mal'],
    DISPONIBLE: ['Disponible', 'ok'],
    MANTENIMIENTO: ['En mantenimiento', 'alerta'],
    INACTIVA: ['Inactiva', 'gris'],
    SOCIO: ['Socio', ''],
    CLIENTE_EXTERNO: ['Cliente externo', 'alerta'],
  };
  function estado(valor) {
    const [texto, clase] = ESTADOS[valor] || [valor, ''];
    return `<span class="estado ${clase}">${esc(texto)}</span>`;
  }

  // ---------- Toast ----------
  let toastEl;
  let toastTimer;
  function toast(texto, tipo = '') {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = texto;
    toastEl.className = `toast ${tipo}`;
    requestAnimationFrame(() => toastEl.classList.add('visible'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('visible'), 3800);
  }

  // ---------- Modal ----------
  function modal(titulo, contenidoHTML) {
    const fondo = document.createElement('div');
    fondo.className = 'modal-fondo';
    fondo.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-label="${esc(titulo)}">
        <div class="modal-cab"><h2>${esc(titulo)}</h2><button type="button" aria-label="Cerrar">&times;</button></div>
        <div class="modal-cuerpo">${contenidoHTML}</div>
      </div>`;
    const cerrar = () => { fondo.remove(); document.removeEventListener('keydown', alTeclear); };
    const alTeclear = (ev) => { if (ev.key === 'Escape') cerrar(); };
    fondo.querySelector('.modal-cab button').addEventListener('click', cerrar);
    fondo.addEventListener('click', (ev) => { if (ev.target === fondo) cerrar(); });
    document.addEventListener('keydown', alTeclear);
    document.body.appendChild(fondo);
    const primero = fondo.querySelector('input, select, button.boton');
    if (primero) primero.focus();
    return { el: fondo, cuerpo: fondo.querySelector('.modal-cuerpo'), cerrar };
  }

  function aviso(contenedor, texto, tipo = 'error') {
    contenedor.innerHTML = texto ? `<div class="aviso ${tipo}" role="${tipo === 'error' ? 'alert' : 'status'}">${esc(texto)}</div>` : '';
  }

  /** Muestra el QR que devuelve la API (svg) como un pase. */
  function pase({ svg, titulo = 'Pase', nombre = '', detalle = '', extraPie = '', variante = '' }) {
    return `
      <div class="pase ${variante}">
        <div class="pase-cab"><span class="marca">${LOGO} FitZone</span><span class="tipo">${esc(titulo)}</span></div>
        <div class="pase-cancha"><div class="pase-qr">${svg}</div></div>
        <div class="pase-troquel"><span></span><span></span></div>
        <div class="pase-pie">
          <div><div class="nombre">${esc(nombre)}</div><div class="detalle">${detalle}</div></div>
          ${extraPie}
        </div>
      </div>`;
  }

  // ---------- Barra y arranque de cada pantalla ----------
  function montarBarra(actual) {
    const header = document.getElementById('barra');
    if (!header) return;
    const links = NAV.map((n) => (n.separador
      ? '<span class="separador" aria-hidden="true"></span>'
      : `<a href="${n.href}"${n.id === actual ? ' aria-current="page"' : ''}>${n.texto}</a>`)).join('');
    header.className = 'barra';
    header.innerHTML = `
      <div class="barra-in">
        <a class="marca" href="dashboard.html">${LOGO} FitZone Sports</a>
        <nav class="nav" aria-label="Secciones">${links}</nav>
        <div class="usuario-barra"><span class="nombre" id="barra-nombre"></span><button type="button" id="barra-salir">Salir</button></div>
      </div>`;
    document.getElementById('barra-salir').addEventListener('click', () => {
      sesion.cerrar();
      window.location.href = 'index.html';
    });
  }

  /** Exige sesión, arma la barra y trae al usuario logueado. */
  async function iniciarPagina(actual) {
    const usuarioId = sesion.requerirONavegar();
    if (!usuarioId) return new Promise(() => {});
    montarBarra(actual);
    try {
      const usuario = await api.obtenerUsuario(usuarioId);
      const nombre = document.getElementById('barra-nombre');
      if (nombre) nombre.textContent = usuario.nombre_completo;
      return { usuarioId, usuario };
    } catch (error) {
      if (error.status === 404) {
        sesion.cerrar();
        window.location.href = 'index.html';
        return new Promise(() => {});
      }
      throw error;
    }
  }

  const esSocioActivo = (u) => u && u.tipo === 'SOCIO' && u.membresia && u.membresia.estado === 'ACTIVO';

  return {
    LOGO, esc, hora, fecha, fechaHora, mes, diaNum, dinero, isoDia, diasHasta,
    estado, toast, modal, aviso, pase, iniciarPagina, esSocioActivo,
  };
})();
