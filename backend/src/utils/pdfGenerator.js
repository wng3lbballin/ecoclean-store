const PDFDocument = require('pdfkit');

function generateTicket(venta) {
  const doc = new PDFDocument({ size: 'A6', margin: 20 });
  const chunks = [];

  doc.on('data', (chunk) => chunks.push(chunk));

  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    doc.fontSize(16).font('Helvetica-Bold').text('EcoClean Store', { align: 'center' });
    doc.fontSize(8).font('Helvetica').fillColor('#64748b').text('Comprobante de Venta', { align: 'center' });
    doc.moveDown(0.3);

    doc.fillColor('#334155')
      .moveTo(20, doc.y).lineTo(280, doc.y).stroke('#e2e8f0');
    doc.moveDown(0.5);

    const id = venta.id.substring(0, 8);
    const fecha = new Date(venta.fecha).toLocaleString('es-MX', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    doc.fontSize(7).font('Helvetica').fillColor('#475569');
    if (venta.numero_factura) doc.text(`Factura: ${venta.numero_factura}`);
    doc.text(`Ticket:  #${id}`);
    doc.text(`Fecha:   ${fecha}`);
    doc.text(`Atendió: ${venta.vendedor_nombre || '—'}`);
    if (venta.cliente_nombre) doc.text(`Cliente: ${venta.cliente_nombre}`);
    doc.text(`Estado:  ${venta.estado || 'pagado'}`);
    doc.moveDown(0.5);

    doc.fillColor('#334155')
      .moveTo(20, doc.y)
      .lineTo(280, doc.y)
      .stroke('#e2e8f0');
    doc.moveDown(0.3);

    doc.fontSize(8).font('Helvetica-Bold').fillColor('#1e293b');
    doc.text('Producto', 20, doc.y, { width: 130, continued: true });
    doc.text('Cant', 150, doc.y, { width: 40, align: 'center', continued: true });
    doc.text('Precio', 190, doc.y, { width: 50, align: 'right', continued: true });
    doc.text('Subtotal', 240, doc.y, { width: 50, align: 'right' });
    doc.moveDown(0.3);

    doc.fontSize(7).font('Helvetica').fillColor('#475569');
    const items = venta.items || [];
    for (const item of items) {
      const y = doc.y;
      doc.text(item.producto_nombre || item.nombre || 'Producto', 20, y, { width: 120 });
      doc.text(String(item.cantidad), 150, y, { width: 40, align: 'center' });
      doc.text(`$${parseFloat(item.precio_unitario || item.precio).toFixed(2)}`, 190, y, { width: 50, align: 'right' });
      doc.text(`$${parseFloat(item.subtotal).toFixed(2)}`, 240, y, { width: 50, align: 'right' });
      doc.moveDown(0.15);
    }

    doc.moveDown(0.2);
    doc.fillColor('#334155')
      .moveTo(20, doc.y)
      .lineTo(280, doc.y)
      .stroke('#e2e8f0');
    doc.moveDown(0.3);

    doc.fontSize(10).font('Helvetica-Bold').fillColor('#059669');
    doc.text('Total:', 160, doc.y, { width: 60, align: 'right', continued: true });
    doc.text(`$${parseFloat(venta.total).toFixed(2)}`, 220, doc.y, { width: 70, align: 'right' });

    doc.moveDown(1);
    doc.fontSize(7).font('Helvetica').fillColor('#94a3b8');
    doc.text('Gracias por su compra', { align: 'center' });
    doc.text('EcoClean Store © 2024', { align: 'center' });

    doc.end();
  });
}

module.exports = { generateTicket };
