const pool = require('../db');
const { generateOrderNumber } = require('../utils/orderNumber');
const { sendStatusEmail } = require('../utils/emailService');

// ────────────────────────────────────────────────────────
// POST /api/orders
// ────────────────────────────────────────────────────────
async function createOrder(req, res, next) {
  const client = await pool.connect();
  try {
    const {
      item_name, item_description, from_location, to_location,
      declared_value, currency, insurance_required, internal_notes, recipient,
    } = req.body || {};

    if (!item_name || !from_location || !to_location) {
      return res.status(400).json({ error: 'item_name, from_location, to_location are required' });
    }
    if (!recipient || !recipient.first_name || !recipient.last_name || !recipient.email || !recipient.phone) {
      return res.status(400).json({ error: 'recipient.first_name, last_name, email, phone are required' });
    }

    await client.query('BEGIN');

    // Find 'placed' status (initial state)
    const statusRes = await client.query('SELECT id FROM statuses WHERE slug = $1', ['placed']);
    if (statusRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(500).json({ error: "Status 'placed' not seeded — run migrations" });
    }
    const placedStatusId = statusRes.rows[0].id;

    // Dedupe recipient by email
    const existing = await client.query(
      'SELECT id FROM recipients WHERE LOWER(email) = LOWER($1)', [recipient.email]
    );
    let recipientId;
    if (existing.rows.length > 0) {
      recipientId = existing.rows[0].id;
      await client.query(
        'UPDATE recipients SET first_name=$1, last_name=$2, phone=$3 WHERE id=$4',
        [recipient.first_name, recipient.last_name, recipient.phone, recipientId]
      );
    } else {
      const ins = await client.query(
        'INSERT INTO recipients (first_name, last_name, email, phone) VALUES ($1,$2,$3,$4) RETURNING id',
        [recipient.first_name, recipient.last_name, recipient.email, recipient.phone]
      );
      recipientId = ins.rows[0].id;
    }

    // Generate unique order number (retry on rare collision)
    let orderNumber;
    for (let attempt = 0; attempt < 5; attempt++) {
      orderNumber = generateOrderNumber();
      const collision = await client.query('SELECT 1 FROM orders WHERE order_number = $1', [orderNumber]);
      if (collision.rows.length === 0) break;
      if (attempt === 4) {
        await client.query('ROLLBACK');
        return res.status(500).json({ error: 'Could not generate unique order number' });
      }
    }

        const orderRes = await client.query(
      `INSERT INTO orders (
         order_number, item_name, item_description, from_location, to_location,
         recipient_id, declared_value, currency, insurance_required,
         current_status_id, internal_notes, created_by_admin_id, current_location
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        orderNumber, item_name, item_description || null, from_location, to_location,
        recipientId, declared_value || 0, (currency || 'USD').toUpperCase(),
        Boolean(insurance_required), placedStatusId, internal_notes || null, req.admin.id, from_location
      ]
    );
    const order = orderRes.rows[0];

    // Initial event (from NULL → placed)
       // Initial event (from NULL → placed)
    await client.query(
      `INSERT INTO order_events (order_id, from_status_id, to_status_id, note, is_customer_visible, created_by_admin_id, location)
       VALUES ($1, NULL, $2, $3, TRUE, $4, $5)`,
      [order.id, placedStatusId, 'Order created', req.admin.id, from_location]
    );

    await client.query('COMMIT');
    res.status(201).json({ order });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }



    // Send initial email
    const emailData = await client.query(
      `SELECT o.order_number, o.item_name, o.from_location, o.to_location, o.current_location,
              s.customer_label AS status_label, r.first_name, r.email
       FROM orders o 
       JOIN statuses s ON s.id = o.current_status_id 
       JOIN recipients r ON r.id = o.recipient_id
       WHERE o.id = $1`, [order.id]
    );
    sendStatusEmail(emailData.rows[0]).catch(console.error);

    res.status(201).json({ order });




}

// ────────────────────────────────────────────────────────
// GET /api/orders
// ────────────────────────────────────────────────────────
async function listOrders(req, res, next) {
  try {
    const { search, status } = req.query;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;

    const where = [];
    const params = [];
    let p = 1;

    if (search) {
      where.push(`(o.order_number ILIKE $${p} OR o.item_name ILIKE $${p}
                   OR r.email ILIKE $${p} OR r.first_name ILIKE $${p} OR r.last_name ILIKE $${p})`);
      params.push(`%${search}%`);
      p++;
    }
    if (status) {
      where.push(`s.slug = $${p}`);
      params.push(status);
      p++;
    }
    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    params.push(limit);
    params.push(offset);

    const result = await pool.query(
      `SELECT
         o.id, o.order_number, o.item_name, o.from_location, o.to_location,
         o.declared_value, o.currency, o.created_at, o.updated_at,
         s.slug AS status_slug, s.customer_label AS status_label,
         s.color AS status_color, s.category AS status_category,
         r.first_name, r.last_name, r.email
       FROM orders o
       JOIN statuses s ON s.id = o.current_status_id
       JOIN recipients r ON r.id = o.recipient_id
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT $${p} OFFSET $${p + 1}`,
      params
    );

    const countParams = params.slice(0, p - 1);
    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM orders o
       JOIN statuses s ON s.id = o.current_status_id
       JOIN recipients r ON r.id = o.recipient_id
       ${whereClause}`,
      countParams
    );

    res.json({
      orders: result.rows,
      total: countRes.rows[0].total,
      limit,
      offset,
    });
  } catch (err) {
    next(err);
  }
}

// ────────────────────────────────────────────────────────
// GET /api/orders/:id
// ────────────────────────────────────────────────────────
async function getOrder(req, res, next) {
  try {
    const { id } = req.params;

    const orderRes = await pool.query(
      `SELECT
         o.*,
         s.slug AS status_slug, s.customer_label AS status_label,
         s.color AS status_color, s.category AS status_category,
         s.requires_action AS status_requires_action,
         r.first_name, r.last_name, r.email, r.phone
       FROM orders o
       JOIN statuses s ON s.id = o.current_status_id
       JOIN recipients r ON r.id = o.recipient_id
       WHERE o.id = $1`,
      [id]
    );

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const order = orderRes.rows[0];

    const eventsRes = await pool.query(
      `SELECT
         e.id, e.note, e.is_customer_visible, e.created_at,
         fs.slug AS from_slug, fs.customer_label AS from_label,
         ts.slug AS to_slug, ts.customer_label AS to_label, ts.color AS to_color,
         a.full_name AS by_admin
       FROM order_events e
       LEFT JOIN statuses fs ON fs.id = e.from_status_id
       JOIN statuses ts ON ts.id = e.to_status_id
       LEFT JOIN admins a ON a.id = e.created_by_admin_id
       WHERE e.order_id = $1
       ORDER BY e.created_at ASC`,
      [id]
    );

    // Valid next statuses (from state machine)
    const nextRes = await pool.query(
      `SELECT s.id, s.slug, s.customer_label, s.category, s.color, s.requires_action
       FROM statuses s
       JOIN status_transitions t ON t.to_status_id = s.id
       WHERE t.from_status_id = $1 AND s.is_active = TRUE
       ORDER BY s.sort_order`,
      [order.current_status_id]
    );

    res.json({
      order,
      events: eventsRes.rows,
      validNextStatuses: nextRes.rows,
    });
  } catch (err) {
    next(err);
  }
}

// ────────────────────────────────────────────────────────
// POST /api/orders/:id/status
// ────────────────────────────────────────────────────────
async function updateOrderStatus(req, res, next) {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { to_status_slug, note, is_customer_visible } = req.body || {};

    if (!to_status_slug) {
      return res.status(400).json({ error: 'to_status_slug is required' });
    }

    await client.query('BEGIN');

    // Lock order for safe concurrent updates
    const orderRes = await client.query(
      'SELECT id, current_status_id FROM orders WHERE id = $1 FOR UPDATE',
      [id]
    );
    if (orderRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }
    const order = orderRes.rows[0];

    // Find target status
    const statusRes = await client.query(
      'SELECT id, slug, customer_label, color FROM statuses WHERE slug = $1 AND is_active = TRUE',
      [to_status_slug]
    );
    if (statusRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid target status' });
    }
    const targetStatus = statusRes.rows[0];

    // Validate transition via state machine (unless admin forces it)
    if (!req.body.force_override) {
      const transition = await client.query(
        'SELECT 1 FROM status_transitions WHERE from_status_id = $1 AND to_status_id = $2',
        [order.current_status_id, targetStatus.id]
      );
      if (transition.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Cannot transition to "${targetStatus.customer_label}" from current status`,
        });
      }
    }

    // Update order + insert event
        await client.query(
      'UPDATE orders SET current_status_id = $1, current_location = COALESCE($2, current_location) WHERE id = $3',
      [targetStatus.id, req.body.current_location || null, order.id]
    );
        const eventRes = await client.query(
      `INSERT INTO order_events (order_id, from_status_id, to_status_id, note, is_customer_visible, created_by_admin_id, location)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, created_at`,
      [
        order.id, order.current_status_id, targetStatus.id,
        note || null, is_customer_visible !== false, req.admin.id,
        req.body.current_location || null // Save the location to the event!
      ]
    );

    await client.query('COMMIT');




    // Send email update
    const emailData = await client.query(
      `SELECT o.order_number, o.item_name, o.from_location, o.to_location, o.current_location,
              s.customer_label AS status_label, r.first_name, r.email
       FROM orders o 
       JOIN statuses s ON s.id = o.current_status_id 
       JOIN recipients r ON r.id = o.recipient_id
       WHERE o.id = $1`, [order.id]
    );
    sendStatusEmail(emailData.rows[0]).catch(console.error);










    res.json({
      ok: true,
      event_id: eventRes.rows[0].id,
      created_at: eventRes.rows[0].created_at,
      new_status: targetStatus,
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }









}



// ────────────────────────────────────────────────────────
// DELETE /api/orders/:id
// ────────────────────────────────────────────────────────
async function deleteOrder(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM orders WHERE id = $1 RETURNING id', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ ok: true, message: 'Item deleted successfully' });
  } catch (err) {
    next(err);
  }
}














module.exports = { createOrder, listOrders, getOrder, updateOrderStatus,deleteOrder };