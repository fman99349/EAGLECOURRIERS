const { Resend } = require('resend');
const PDFDocument = require('pdfkit');

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Generate a professional PDF Waybill
async function generatePDF(order) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    doc.fontSize(24).fillColor('#1e3a8a').text('EagleCourier International', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#64748b').text('Official Shipping Waybill', { align: 'center' });
    doc.moveDown(2);
    doc.rect(50, doc.y, 500, 40).fill('#f1f5f9');
    doc.fillColor('#0f172a').fontSize(16).text(`Tracking #: ${order.order_number}`, 60, doc.y + 12);
    doc.moveDown(3);
    doc.fontSize(12).fillColor('#334155');
    doc.text(`Item: ${order.item_name}`);
    doc.text(`Route: ${order.from_location} -> ${order.to_location}`);
    doc.text(`Current Location: ${order.current_location || 'In Transit'}`);
    doc.text(`Current Status: ${order.status_label}`);
    doc.text(`Date: ${new Date().toLocaleString()}`);
    doc.moveDown(3);
    doc.fontSize(10).fillColor('#94a3b8').text('This document serves as an official record of your shipment with EagleCourier.', { align: 'center' });
    doc.end();
  });
}

async function sendStatusEmail(order) {
  try {
    // Generate PDF
    const pdfBuffer = await generatePDF(order);
    const trackingLink = `https://eaglecourrier-tracking-tracking.netlify.app/?track=${order.order_number}`;

    // Send via Resend API
    const { data, error } = await resend.emails.send({
      from: 'EagleCourier <onboarding@resend.dev>', // Resend allows this for testing without a custom domain
      to: [order.email],
      subject: `EagleCourier Update: ${order.order_number} is now ${order.status_label}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #334155;">
          <h2 style="color: #1e3a8a;">Hello ${order.first_name},</h2>
          <p>The status of your shipment <strong>${order.order_number}</strong> has been updated.</p>
          <div style="background: #f8fafc; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;">
            <p style="margin: 0;"><strong>New Status:</strong> ${order.status_label}</p>
            <p style="margin: 5px 0 0 0;"><strong>Current Location:</strong> ${order.current_location || 'In Transit'}</p>
          </div>
          <p>Please find your official shipping waybill attached to this email.</p>
          <br/>
          <a href="${trackingLink}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Track My Shipment</a>
          <br/><br/>
          <p style="font-size: 12px; color: #94a3b8;">If the button doesn't work, copy this link: ${trackingLink}</p>
          <p>Thank you for choosing EagleCourier.</p>
        </div>
      `,
      attachments: [
        {
          filename: `EagleCourier_${order.order_number}.pdf`,
          content: pdfBuffer.toString('base64'), // Resend requires base64 for attachments
        }
      ]
    });

    if (error) {
      console.error('❌ Resend API Error:', error);
    } else {
      console.log(`📧 Email sent to ${order.email} via Resend. ID: ${data.id}`);
    }
  } catch (error) {
    console.error('❌ Email failed to send:', error.message);
  }
}

module.exports = { sendStatusEmail };