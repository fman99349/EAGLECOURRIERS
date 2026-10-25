const pool = require('../db');

async function getStats(req, res, next) {
  try {
    const totals = await pool.query(`
      SELECT
        COUNT(*)::int AS orders,
        COUNT(*) FILTER (WHERE DATE(o.created_at) = CURRENT_DATE)::int AS orders_today,
        COUNT(*) FILTER (WHERE o.created_at >= NOW() - INTERVAL '7 days')::int AS orders_this_week,
        COUNT(*) FILTER (WHERE s.category = 'in_transit')::int AS orders_in_transit,
        COUNT(*) FILTER (WHERE s.category = 'delivered')::int AS orders_delivered,
        COUNT(*) FILTER (WHERE s.category = 'hold_financial')::int AS orders_on_hold,
        COUNT(*) FILTER (WHERE s.category = 'failed')::int AS orders_failed,
        COALESCE(SUM(o.declared_value), 0)::text AS total_declared_value
      FROM orders o
      JOIN statuses s ON s.id = o.current_status_id
    `);

    const byStatus = await pool.query(`
      SELECT s.slug, s.customer_label AS label, s.color, s.category, COUNT(o.id)::int AS count
      FROM statuses s
      LEFT JOIN orders o ON o.current_status_id = s.id
      GROUP BY s.id, s.slug, s.customer_label, s.color, s.category, s.sort_order
      HAVING COUNT(o.id) > 0
      ORDER BY s.sort_order
    `);

    const timeline = await pool.query(`
      SELECT to_char(d.day, 'YYYY-MM-DD') AS date, COALESCE(COUNT(o.id), 0)::int AS count
      FROM generate_series(CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE, '1 day') AS d(day)
      LEFT JOIN orders o ON DATE(o.created_at) = d.day
      GROUP BY d.day
      ORDER BY d.day
    `);

    const recent = await pool.query(`
      SELECT o.id, o.order_number, o.item_name, o.from_location, o.to_location,
             o.declared_value, o.currency, o.created_at,
             s.slug AS status_slug, s.customer_label AS status_label, s.color AS status_color,
             r.first_name, r.last_name, r.email
      FROM orders o
      JOIN statuses s ON s.id = o.current_status_id
      JOIN recipients r ON r.id = o.recipient_id
      ORDER BY o.created_at DESC
      LIMIT 5
    `);

    const sysCounts = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM statuses WHERE is_active = TRUE) AS statuses,
        (SELECT COUNT(*)::int FROM status_transitions) AS transitions
    `);

    res.json({
      totals: totals.rows[0],
      by_status: byStatus.rows,
      timeline: timeline.rows,
      recent_orders: recent.rows,
      system: sysCounts.rows[0],
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getStats };