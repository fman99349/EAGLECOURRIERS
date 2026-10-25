const pool = require('../db');

// GET /api/statuses (Public/Active only)
async function listStatuses(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT id, slug, internal_name, customer_label, category, color, customer_visible, requires_action, is_system, is_active, sort_order
       FROM statuses WHERE is_active = TRUE ORDER BY sort_order`
    );
    res.json({ statuses: result.rows });
  } catch (err) { next(err); }
}

// GET /api/statuses/admin (All statuses + their transitions)
async function adminListStatuses(req, res, next) {
  try {
    const statusesRes = await pool.query(`SELECT * FROM statuses ORDER BY sort_order`);
    const transitionsRes = await pool.query(`SELECT from_status_id, to_status_id FROM status_transitions`);
    res.json({ statuses: statusesRes.rows, transitions: transitionsRes.rows });
  } catch (err) { next(err); }
}

// POST /api/statuses
async function createStatus(req, res, next) {
  const client = await pool.connect();
  try {
    const { slug, internal_name, customer_label, category, color, requires_action, transitions_to } = req.body;
    
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO statuses (slug, internal_name, customer_label, category, color, requires_action, is_system, is_active, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, FALSE, TRUE, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM statuses))
       RETURNING *`,
      [slug, internal_name, customer_label, category, color, requires_action]
    );
    const newStatusId = result.rows[0].id;

    // Add transitions (where can this new status go?)
    if (transitions_to && transitions_to.length > 0) {
      for (const toId of transitions_to) {
        await client.query(
          `INSERT INTO status_transitions (from_status_id, to_status_id) VALUES ($1, $2)`,
          [newStatusId, toId]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ status: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// PUT /api/statuses/:id
async function updateStatus(req, res, next) {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { internal_name, customer_label, color, requires_action, is_active, transitions_to } = req.body;
    
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE statuses SET internal_name=$1, customer_label=$2, color=$3, requires_action=$4, is_active=$5
       WHERE id=$6 AND is_system = FALSE RETURNING *`,
      [internal_name, customer_label, color, requires_action, is_active, id]
    );

    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Status not found or is a system status.' });
    }

    // Update transitions (wipe and recreate for simplicity)
    await client.query('DELETE FROM status_transitions WHERE from_status_id = $1', [id]);
    if (transitions_to && transitions_to.length > 0) {
      for (const toId of transitions_to) {
        await client.query(
          `INSERT INTO status_transitions (from_status_id, to_status_id) VALUES ($1, $2)`,
          [id, toId]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ status: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// DELETE /api/statuses/:id (Soft delete)
async function deleteStatus(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE statuses SET is_active = FALSE WHERE id = $1 AND is_system = FALSE RETURNING id`,
      [id]
    );
    
    if (result.rowCount === 0) {
      return res.status(400).json({ error: 'Cannot delete system status or status not found' });
    }
    res.json({ ok: true, message: 'Status deactivated' });
  } catch (err) { next(err); }
}

module.exports = { listStatuses, adminListStatuses, createStatus, updateStatus, deleteStatus };