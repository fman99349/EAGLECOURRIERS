const pool = require('../db');
const { generateReceiptPDF } = require('../utils/pdfService');

async function trackOrder(req, res, next) {
  try {
    const { order_number } = req.params;

    const orderRes = await pool.query(
      `SELECT 
         o.id, o.order_number, o.item_name, o.item_description, o.from_location, o.to_location, 
         o.declared_value, o.currency, o.created_at, o.current_location, o.total_amount_paid,
         s.slug AS status_slug, s.customer_label AS status_label, s.color AS status_color, 
         s.sort_order AS status_sort_order, s.category AS status_category,
         r.first_name, r.last_name
       FROM orders o
       JOIN statuses s ON s.id = o.current_status_id
       JOIN recipients r ON r.id = o.recipient_id
       WHERE REPLACE(UPPER(o.order_number), '-', '') = REPLACE(UPPER($1), '-', '')`,
      [order_number]
    );

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ error: 'Shipment not found. Please check the tracking number.' });
    }

    const order = orderRes.rows[0];

    const eventsRes = await pool.query(
      `SELECT 
         e.created_at, e.note, e.location,
         ts.customer_label AS label, ts.color, ts.slug
       FROM order_events e
       JOIN statuses ts ON ts.id = e.to_status_id
       WHERE e.order_id = $1 
         AND e.is_customer_visible = TRUE
       ORDER BY e.created_at ASC`,
      [order.id]
    );

    res.json({
      order,
      events: eventsRes.rows
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/track/:order_number/receipt
async function downloadPublicReceipt(req, res, next) {
  try {
    const { order_number } = req.params;
    const orderResult = await pool.query(
      `SELECT o.*, s.customer_label AS status_label, r.first_name, r.last_name 
       FROM orders o 
       JOIN statuses s ON s.id = o.current_status_id 
       JOIN recipients r ON r.id = o.recipient_id 
       WHERE REPLACE(UPPER(o.order_number), '-', '') = REPLACE(UPPER($1), '-', '')`, 
      [order_number]
    );
    
    if (orderResult.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    
    // 🆕 Fetch full event ledger for the receipt
    const eventsResult = await pool.query(
      `SELECT * FROM order_events WHERE order_id = $1 ORDER BY created_at ASC`, [orderResult.rows[0].id]
    );
    
    const pdfBuffer = await generateReceiptPDF(orderResult.rows[0], eventsResult.rows);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Receipt_${orderResult.rows[0].order_number}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
}

module.exports = { trackOrder, downloadPublicReceipt };