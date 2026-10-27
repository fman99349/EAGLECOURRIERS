const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

async function generateReceiptPDF(order, events = []) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      
      const trackingUrl = `https://eaglecourrier-tracking-tracking.netlify.app/?track=${order.order_number}`;
      const qrDataUrl = await QRCode.toDataURL(trackingUrl, { margin: 1, width: 100 });
      
      // --- HEADER ---
      doc.rect(0, 0, 595.28, 120).fill('#1e3a8a');
      doc.fontSize(28).fillColor('#ffffff').text('EagleCourier', 50, 40);
      doc.fontSize(10).fillColor('#94a3b8').text('INTERNATIONAL LOGISTICS', 50, 75);
      doc.fontSize(20).fillColor('#ffffff').text('OFFICIAL RECEIPT', 0, 45, { align: 'right', width: 545 });

      // --- QR CODE & TRACKING INFO ---
      const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
      doc.image(qrBuffer, 490, 130, { width: 70 });
      
      doc.fontSize(10).fillColor('#64748b').text('Tracking Number:', 50, 140);
      doc.fontSize(16).fillColor('#0f172a').font('Courier-Bold').text(order.order_number, 50, 155);
      doc.font('Helvetica');
      
      doc.fontSize(10).fillColor('#64748b').text('Receipt Date:', 50, 185);
      doc.fontSize(12).fillColor('#0f172a').text(new Date().toLocaleString(), 50, 200);

      doc.fontSize(10).fillColor('#64748b').text('Status:', 300, 140);
      doc.fontSize(12).fillColor('#0f172a').text(order.status_label, 300, 155);

      // --- ROUTE INFO ---
      doc.moveDown(3);
      doc.rect(50, 230, 495, 80).fill('#f8fafc').stroke('#e2e8f0');
      doc.fontSize(10).fillColor('#64748b').text('ORIGIN', 65, 245);
      doc.fontSize(12).fillColor('#0f172a').text(order.from_location, 65, 260);
      doc.fontSize(10).fillColor('#64748b').text('DESTINATION', 300, 245);
      doc.fontSize(12).fillColor('#0f172a').text(order.to_location, 300, 260);
      doc.fontSize(10).fillColor('#64748b').text('RECIPIENT', 65, 285);
      doc.fontSize(12).fillColor('#0f172a').text(`${order.first_name} ${order.last_name}`, 65, 300);

      // --- ITEM TABLE ---
      const tableTop = 350;
      doc.rect(50, tableTop, 495, 25).fill('#0f172a');
      doc.fillColor('#ffffff').fontSize(10).text('ITEM DESCRIPTION', 60, tableTop + 8);
      doc.text('ITEM COST', 480, tableTop + 8, { align: 'right', width: 55 });

      doc.fillColor('#0f172a').fontSize(11).text(order.item_name, 60, tableTop + 40);
      doc.fontSize(9).fillColor('#64748b').text(order.item_description || 'No description provided', 60, tableTop + 55, { width: 350 });
      doc.fontSize(12).fillColor('#0f172a').text(`${order.currency} ${Number(order.declared_value).toFixed(2)}`, 450, tableTop + 40, { align: 'right', width: 85 });
      doc.moveTo(50, tableTop + 85).lineTo(545, tableTop + 85).stroke('#e2e8f0');

      // --- FINANCIAL LEDGER ---
      const payments = events.filter(e => e.payment_amount > 0);
      let yPos = 460;

      doc.fontSize(12).fillColor('#0f172a').text('Financial Summary', 350, yPos);
      yPos += 20;
      
      if (payments.length > 0) {
        payments.forEach((pay) => {
          doc.fontSize(9).fillColor('#64748b').text(`${pay.payment_type || 'Payment'}:`, 350, yPos);
          doc.text(`${order.currency} ${Number(pay.payment_amount).toFixed(2)}`, 450, yPos, { align: 'right', width: 85 });
          yPos += 15;
        });
      } else {
         doc.fontSize(9).fillColor('#64748b').text('No payments recorded', 350, yPos);
         yPos += 15;
      }

      // Total Paid
      doc.moveTo(350, yPos + 5).lineTo(545, yPos + 5).stroke('#0f172a');
      yPos += 15;
      doc.fontSize(12).fillColor('#1e3a8a').text('Total Paid:', 350, yPos);
      doc.text(`${order.currency} ${Number(order.total_amount_paid || 0).toFixed(2)}`, 450, yPos, { align: 'right', width: 85 });

      // --- FOOTER ---
      doc.fontSize(9).fillColor('#94a3b8').text('This document serves as an official receipt for your shipment with EagleCourier International.', 50, 700, { align: 'center', width: 495 });
      doc.text('Thank you for choosing EagleCourier.', 50, 720, { align: 'center', width: 495 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generateReceiptPDF };