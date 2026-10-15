'use strict';

const PDFDocument = require('pdfkit');

/** RF-14 — Genera el ticket/factura en PDF con cancha, horario y monto. */
function generarComprobantePdf({ pago, reserva, cancha, sede, usuario }) {
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
    fila('Fecha de pago:', new Date(pago.createdAt).toLocaleString('es-AR', { hour12: false }));
    fila('Cliente:', `${usuario.nombreCompleto} (DNI ${usuario.dni})`);
    doc.moveDown(0.5);
    fila('Sede:', sede.nombre);
    fila('Cancha:', `${cancha.nombre} (${cancha.tipo})`);
    const f24 = { hour12: false, hour: '2-digit', minute: '2-digit' };
    const ini = new Date(reserva.fechaHoraInicio);
    const fin = new Date(reserva.fechaHoraFin);
    fila('Turno:', `${ini.toLocaleDateString('es-AR')} de ${ini.toLocaleTimeString('es-AR', f24)} a ${fin.toLocaleTimeString('es-AR', f24)} hs`);
    doc.moveDown(0.5);
    if (Array.isArray(reserva.detallePrecio)) {
      doc.fillColor('#5a6072').fontSize(9).text('Detalle del precio:');
      for (const d of reserva.detallePrecio) {
        doc.text(`  - ${d.estrategia}: $${Number(d.despues).toFixed(2)}`);
      }
      doc.moveDown(0.5);
    }
    doc.fillColor('#1e2a5e').fontSize(14).text(`TOTAL: $${Number(pago.monto).toFixed(2)}`);
    fila('Estado:', pago.estado);
    fila('Tarjeta:', pago.ultimos4 ? `**** **** **** ${pago.ultimos4}` : '-');
    fila('Token pasarela:', pago.tokenPasarela);
    doc.moveDown();
    doc.fillColor('#9aa0b4').fontSize(8).text('Los datos de tarjeta no se almacenan (RNF-02). Solo se guarda el token de la pasarela.');
    doc.end();
  });
}

module.exports = { generarComprobantePdf };
