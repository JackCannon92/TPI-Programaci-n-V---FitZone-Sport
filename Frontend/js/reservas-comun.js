'use strict';

/**
 * Piezas que comparten "Reservar cancha" y "Mis reservas":
 * el pago con la pasarela simulada (RF-13) y el QR de ingreso de la reserva
 * con su comprobante (QR 1 y QR 4 del ADR-010).
 */
const reservasComun = (() => {
  /** Detalle del precio que arma el Tarifador (Strategy, RF-11). */
  function lineasPrecio(detalle = []) {
    return detalle.map((d, i) => {
      const clase = i === 0 ? '' : d.monto < 0 ? 'descuento' : 'recargo';
      const signo = i === 0 ? '' : d.monto < 0 ? '− ' : '+ ';
      return `<div class="linea-precio ${clase}"><span>${ui.esc(d.concepto)}</span><span>${signo}${ui.dinero(Math.abs(d.monto))}</span></div>`;
    }).join('');
  }

  /**
   * Abre el formulario de pago. Resuelve con el pago aprobado, o con null si
   * la persona cierra la ventana.
   */
  function abrirPago({ reserva, usuarioId, titulo }) {
    return new Promise((resolve) => {
      let pagado = null;
      const m = ui.modal('Pagar la reserva', `
        <p class="texto-2" style="margin-top:0">${ui.esc(titulo)}</p>
        <div class="tarjeta-credito" aria-hidden="true">
          <div class="fila"><span>FitZone Pay</span><span>simulada</span></div>
          <div class="numero" id="tc-numero">4111 1111 1111 1111</div>
          <div class="fila"><span id="tc-titular">TITULAR</span><span id="tc-venc">12/30</span></div>
        </div>
        <div id="pago-msg"></div>
        <form id="form-pago" novalidate>
          <div class="campo"><label for="p-numero">Número de tarjeta</label>
            <input id="p-numero" inputmode="numeric" autocomplete="cc-number" value="4111 1111 1111 1111">
            <div class="ayuda">Es una pasarela de prueba: una tarjeta terminada en 0000 se rechaza.</div></div>
          <div class="campo"><label for="p-titular">Titular</label><input id="p-titular" autocomplete="cc-name" value=""></div>
          <div class="fila-campos">
            <div class="campo"><label for="p-venc">Vencimiento</label><input id="p-venc" placeholder="MM/AA" autocomplete="cc-exp" value="12/30"></div>
            <div class="campo"><label for="p-cvv">CVV</label><input id="p-cvv" inputmode="numeric" autocomplete="cc-csc" value="123"></div>
          </div>
          <button class="boton ancho" type="submit">Pagar ${ui.dinero(reserva.precioFinal)}</button>
        </form>`);

      const $ = (id) => m.cuerpo.querySelector(`#${id}`);
      const sincronizar = () => {
        $('tc-numero').textContent = $('p-numero').value || '•••• •••• •••• ••••';
        $('tc-titular').textContent = ($('p-titular').value || 'TITULAR').toUpperCase();
        $('tc-venc').textContent = $('p-venc').value || 'MM/AA';
      };
      ['p-numero', 'p-titular', 'p-venc'].forEach((id) => $(id).addEventListener('input', sincronizar));

      // Si se cierra sin pagar, resolver null.
      const observador = new MutationObserver(() => {
        if (!document.body.contains(m.el)) { observador.disconnect(); resolve(pagado); }
      });
      observador.observe(document.body, { childList: true });

      $('form-pago').addEventListener('submit', async (ev) => {
        ev.preventDefault();
        ui.aviso($('pago-msg'), '');
        const tarjeta = {
          numero: $('p-numero').value.replace(/\s+/g, ''),
          titular: $('p-titular').value.trim() || 'Titular',
          vencimiento: $('p-venc').value.trim(),
          cvv: $('p-cvv').value.trim(),
        };
        const boton = ev.target.querySelector('button');
        boton.disabled = true;
        boton.textContent = 'Procesando…';
        try {
          pagado = await api.pagarReserva(reserva.id, usuarioId, tarjeta);
          m.cerrar();
        } catch (error) {
          ui.aviso($('pago-msg'), error.status === 402
            ? `${error.message}. La reserva sigue guardada: podés pagarla con otra tarjeta.`
            : error.message);
          boton.disabled = false;
          boton.textContent = `Pagar ${ui.dinero(reserva.precioFinal)}`;
        }
      });
    });
  }

  /** Muestra el QR de ingreso de una reserva paga y el link al comprobante. */
  async function verQrReserva({ reserva, cancha, pago, usuario }) {
    const m = ui.modal('Tu reserva está confirmada', '<p class="cargando">Generando el QR…</p>');
    try {
      const qr = await api.qrReservaCancha(reserva.id);
      const desde = new Date(qr.validoDesde);
      const ahora = Date.now();
      const vigencia = ahora < desde.getTime()
        ? `Vale desde las ${ui.hora(qr.validoDesde)} del ${ui.fecha(qr.validoDesde)}`
        : ahora > new Date(qr.validoHasta).getTime() ? 'Este turno ya terminó' : `Vale hasta las ${ui.hora(qr.validoHasta)}`;
      m.cuerpo.innerHTML = `
        <p class="texto-2" style="margin-top:0">Mostrá este QR en el molinete de la sede. Sirve solo para este turno y en esta sede.</p>
        ${ui.pase({
          svg: qr.svg,
          titulo: 'Ingreso con reserva',
          nombre: cancha ? cancha.nombre : 'Cancha',
          detalle: `${ui.esc(ui.fechaHora(reserva.fechaHoraInicio))}<br>${ui.esc(vigencia)}`,
        })}
        <div class="acciones" style="margin-top:18px">
          ${pago ? `<a class="boton tinta" href="${api.urlComprobante(pago.id)}" target="_blank" rel="noopener">Descargar comprobante</a>` : ''}
          <button class="boton sec" type="button" data-copiar>Copiar código</button>
        </div>
        <p class="texto-2 chico" style="margin-bottom:0">${usuario && usuario.tipo === 'CLIENTE_EXTERNO' ? 'Como cliente externo, este es tu QR de ingreso.' : 'El comprobante PDF trae este mismo QR y otro para verificar el pago.'}</p>`;
      m.cuerpo.querySelector('[data-copiar]').addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(qr.token); ui.toast('Código copiado'); } catch (_) { ui.toast('No se pudo copiar', 'error'); }
      });
    } catch (error) {
      ui.aviso(m.cuerpo, error.message);
    }
  }

  /** QR de asistencia a una clase (QR 3): se escanea en recepción al llegar. */
  async function verQrAsistencia({ reserva, clase }) {
    const m = ui.modal('QR de asistencia', '<p class="cargando">Generando el QR…</p>');
    try {
      const qr = await api.qrAsistencia(reserva.id);
      const ahora = Date.now();
      const vigencia = ahora < new Date(qr.validoDesde).getTime()
        ? `Se habilita a las ${ui.hora(qr.validoDesde)} (30 min antes)`
        : ahora > new Date(qr.validoHasta).getTime() ? 'Ya pasó el horario de la clase' : `Vale hasta las ${ui.hora(qr.validoHasta)}`;
      m.cuerpo.innerHTML = `
        <p class="texto-2" style="margin-top:0">Mostralo en recepción o al instructor cuando llegues. Se usa una sola vez.</p>
        ${ui.pase({
          svg: qr.svg,
          titulo: 'Asistencia a clase',
          nombre: clase ? clase.tipo : 'Clase',
          detalle: `${clase ? `${ui.esc(ui.fechaHora(clase.fechaHora))} con ${ui.esc(clase.instructor)}<br>` : ''}${ui.esc(vigencia)}`,
          variante: 'verde',
        })}
        <div class="acciones" style="margin-top:18px"><button class="boton sec" type="button" data-copiar>Copiar código</button></div>`;
      m.cuerpo.querySelector('[data-copiar]').addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(qr.token); ui.toast('Código copiado'); } catch (_) { ui.toast('No se pudo copiar', 'error'); }
      });
    } catch (error) {
      ui.aviso(m.cuerpo, error.message);
    }
  }

  return { lineasPrecio, abrirPago, verQrReserva, verQrAsistencia };
})();
