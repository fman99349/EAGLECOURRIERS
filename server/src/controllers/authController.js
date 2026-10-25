const bcrypt = require('bcryptjs');
const pool = require('../db');
const { signToken } = require('../utils/jwt');

async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await pool.query(
      `SELECT id, email, password_hash, full_name, role, is_active
       FROM admins WHERE email = $1`,
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = result.rows[0];

    if (!admin.is_active) {
      return res.status(403).json({ error: 'Account is disabled' });
    }

    const ok = await bcrypt.compare(password, admin.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken({ id: admin.id, role: admin.role });

    res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        full_name: admin.full_name,
        role: admin.role,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function me(req, res) {
  res.json({ admin: req.admin });
}

module.exports = { login, me };