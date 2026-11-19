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
    { id: 'inicio', href: '../portal/dashboard.html', texto: 'Inicio' },
    { id: 'reservar', href: '../portal/reservar.html', texto: 'Reservar cancha' },
    { id: 'clases', href: '../portal/clases.html', texto: 'Clases' },
    { id: 'mis-reservas', href: '../portal/mis-reservas.html', texto: 'Mis reservas' },
    { id: 'acceso', href: '../portal/acceso.html', texto: 'Mi acceso' },
    { separador: true },
    { id: 'recepcion', href: '../admin/recepcion.html', texto: 'Recepción' },
    { id: 'gestion', href: '../admin/gestion.html', texto: 'Gestión' },
    { id: 'usuarios', href: '../admin/usuarios.html', texto: 'Usuarios' },
  ];

  // Qué pantallas ve cada rol. El cliente (socio o externo) usa solo el portal.
  // El personal usa su parte de la consola y, además, el portal: también puede
  // reservar canchas, anotarse en clases y entrar como cliente. La primera es su inicio.
  const PORTAL = ['inicio', 'reservar', 'clases', 'mis-reservas', 'acceso'];
  const PANTALLAS_POR_ROL = {
    CLIENTE: PORTAL,
    RECEPCIONISTA: ['recepcion', ...PORTAL],
    ADMIN_SEDE: ['recepcion', 'gestion', ...PORTAL],
    GERENTE: ['gestion', 'recepcion', 'usuarios', ...PORTAL],
  };
  const pantallasDe = (rol) => PANTALLAS_POR_ROL[rol] || PANTALLAS_POR_ROL.CLIENTE;
  const inicioDe = (rol) => NAV.find((n) => n.id === pantallasDe(rol)[0]).href;

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
  function montarBarra(actual, rol) {
    const header = document.getElementById('barra');
    if (!header) return;
    const permitidas = pantallasDe(rol);
    const enlace = (n) => `<a href="${n.href}"${n.id === actual ? ' aria-current="page"' : ''}>${n.texto}</a>`;
    const corte = NAV.findIndex((n) => n.separador);
    const portal = NAV.slice(0, corte).filter((n) => permitidas.includes(n.id)).map(enlace);
    const consola = NAV.slice(corte + 1).filter((n) => permitidas.includes(n.id)).map(enlace);
    const links = [portal.join(''), consola.join('')].filter(Boolean)
      .join('<span class="separador" aria-hidden="true"></span>');
    header.className = 'barra';
    header.innerHTML = `
      <div class="barra-in">
        <a class="marca" href="${inicioDe(rol)}">${LOGO} FitZone Sports</a>
        <nav class="nav" aria-label="Secciones">${links}</nav>
        <div class="usuario-barra"><span class="nombre" id="barra-nombre"></span><button type="button" id="barra-salir">Salir</button></div>
      </div>`;
    document.getElementById('barra-salir').addEventListener('click', () => {
      sesion.cerrar();
      window.location.href = '../portal/index.html';
    });
  }

  /**
   * Exige sesión, trae al usuario logueado y arma la barra con las pantallas
   * de su rol. Si entra a una pantalla que no es de su rol, lo lleva a su inicio.
   */
  async function iniciarPagina(actual) {
    const usuarioId = sesion.requerirONavegar();
    if (!usuarioId) return new Promise(() => {});
    try {
      const usuario = await api.obtenerUsuario(usuarioId);
      if (!pantallasDe(usuario.rol).includes(actual)) {
        window.location.replace(inicioDe(usuario.rol));
        return new Promise(() => {});
      }
      try { sessionStorage.setItem('fitzone_rol', usuario.rol); } catch (_) { /* sin almacenamiento */ }
      montarBarra(actual, usuario.rol);
      const nombre = document.getElementById('barra-nombre');
      if (nombre) nombre.textContent = usuario.nombre_completo;
      return { usuarioId, usuario };
    } catch (error) {
      if (error.status === 404) {
        sesion.cerrar();
        window.location.href = '../portal/index.html';
        return new Promise(() => {});
      }
      // Sin conexión (ADR-007): la barra se arma con el último rol conocido.
      if (error.status === 0) {
        let rol = null;
        try { rol = sessionStorage.getItem('fitzone_rol'); } catch (_) { /* sin almacenamiento */ }
        montarBarra(actual, rol || 'RECEPCIONISTA');
      }
      throw error;
    }
  }

  const esSocioActivo = (u) => u && u.tipo === 'SOCIO' && u.membresia && u.membresia.estado === 'ACTIVO';

  return {
    LOGO, esc, hora, fecha, fechaHora, mes, diaNum, dinero, isoDia, diasHasta,
    estado, toast, modal, aviso, pase, iniciarPagina, esSocioActivo, inicioDe,
  };
})();
