const pool = require('../db');

async function trackOrder(req, res, next) {
  try {
    const { order_number } = req.params;

    // 1. Find the order (case-insensitive)
    const orderRes = await pool.query(
      `SELECT 
         o.order_number, o.item_name, o.item_description, o.from_location, o.to_location, 
         o.declared_value, o.currency, o.created_at,
         s.slug AS status_slug, s.customer_label AS status_label, s.color AS status_color,
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

    // 2. Get the timeline (ONLY events visible to the customer)
    const eventsRes = await pool.query(
      `SELECT 
         e.created_at, e.note,
         ts.customer_label AS label, ts.color, ts.slug
       FROM order_events e
       JOIN statuses ts ON ts.id = e.to_status_id
       WHERE e.order_id = (SELECT id FROM orders WHERE order_number = $1) 
         AND e.is_customer_visible = TRUE
       ORDER BY e.created_at ASC`,
      [order.order_number]
    );

    res.json({
      order,
      events: eventsRes.rows
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { trackOrder };