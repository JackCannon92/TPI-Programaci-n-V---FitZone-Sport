'use strict';

const PDFDocument = require('pdfkit');

const f24 = { hour12: false, hour: '2-digit', minute: '2-digit' };
const fechaHora = (fecha) => new Date(fecha).toLocaleString('es-AR', { hour12: false });

/**
 * RF-14 — Genera el ticket/factura en PDF con cancha, horario y monto.
 *
 * Lleva dos QR (ADR-016):
 *  - QR de ingreso (QR 1): para entrar a la sede el día del turno.
 *  - QR de verificación (QR 4): confirma que el comprobante es auténtico.
 */
function generarComprobantePdf({ pago, reserva, cancha, sede, usuario, qrs = {} }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A5', margin: 40 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fillColor('#1e2a5e').fontSize(20).text('FitZone Sports', { align: 'left' });
    doc.fontSize(10).fillColor('#5a6072').text('Comprobante de pago - Reserva de cancha');
    doc.moveDown();
    doc.moveTo(40, doc.y).lineTo(380, doc.y).strokeColor('#f26c6c').lineWidth(2).stroke();
    doc.moveDown();

    const fila = (k, v) => {
      doc.fillColor('#1e2a5e').fontSize(10).text(k, { continued: true }).fillColor('#2b2b2b').text(`  ${v}`);
    };
    fila('Comprobante N°:', pago.id);
    fila('Fecha de pago:', fechaHora(pago.created_at || pago.createdAt));
    // El modelo de usuario se llama nombre_completo (olor O-12: antes decía "undefined").
    fila('Cliente:', `${usuario.nombre_completo} (DNI ${usuario.dni})`);
    doc.moveDown(0.5);
    fila('Sede:', sede.nombre);
    fila('Cancha:', `${cancha.nombre} (${cancha.tipo})`);
    const ini = new Date(reserva.fechaHoraInicio);
    const fin = new Date(reserva.fechaHoraFin);
    fila('Turno:', `${ini.toLocaleDateString('es-AR')} de ${ini.toLocaleTimeString('es-AR', f24)} a ${fin.toLocaleTimeString('es-AR', f24)} hs`);
    doc.moveDown(0.5);

    // Detalle que arma el Tarifador (ADR-013): { concepto, monto }
    if (Array.isArray(reserva.detallePrecio)) {
      doc.fillColor('#5a6072').fontSize(9).text('Detalle del precio:');
      for (const d of reserva.detallePrecio) {
        const signo = d.monto < 0 ? '-' : '';
        doc.text(`  - ${d.concepto}: ${signo}$${Math.abs(Number(d.monto)).toFixed(2)}`);
      }
      doc.moveDown(0.5);
    }
    doc.fillColor('#1e2a5e').fontSize(14).text(`TOTAL: $${Number(pago.monto).toFixed(2)}`);
    fila('Estado:', pago.estado);
    fila('Tarjeta:', pago.ultimos4 ? `**** **** **** ${pago.ultimos4}` : '-');
    fila('Token pasarela:', pago.tokenPasarela);

    // Los dos QR, uno al lado del otro
    const { ingreso, verificacion } = qrs;
    if (ingreso || verificacion) {
      const TAMANIO = 130;
      doc.moveDown();
      if (doc.y + TAMANIO + 60 > doc.page.height - doc.page.margins.bottom) doc.addPage();
      const arriba = doc.y;
      const columnas = [
        ingreso && {
          png: ingreso.png,
          titulo: 'QR de ingreso',
          texto: `Mostralo en la recepción. Vale desde las ${new Date(ingreso.validoDesde).toLocaleTimeString('es-AR', f24)} hasta las ${new Date(ingreso.validoHasta).toLocaleTimeString('es-AR', f24)} del ${new Date(ingreso.validoDesde).toLocaleDateString('es-AR')}.`,
        },
        verificacion && {
          png: verificacion.png,
          titulo: 'QR de verificación',
          texto: 'Escanealo para confirmar que este comprobante es auténtico.',
        },
      ].filter(Boolean);

      columnas.forEach((col, i) => {
        const x = 40 + i * 175;
        doc.image(col.png, x, arriba, { width: TAMANIO, height: TAMANIO });
        doc.fillColor('#1e2a5e').fontSize(9).text(col.titulo, x, arriba + TAMANIO + 4, { width: 160 });
        doc.fillColor('#5a6072').fontSize(7.5).text(col.texto, x, doc.y + 1, { width: 160 });
      });
      doc.x = 40;
      doc.y = arriba + TAMANIO + 55;
    }

    doc.fillColor('#9aa0b4').fontSize(8).text('Los datos de tarjeta no se almacenan (RNF-02). Solo se guarda el token de la pasarela.', 40);
    doc.end();
  });
}

module.exports = { generarComprobantePdf };
