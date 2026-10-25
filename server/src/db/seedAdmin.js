require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../db');

async function main() {
  const [, , emailArg, passwordArg, fullNameArg, roleArg] = process.argv;

  if (!emailArg || !passwordArg) {
    console.log('Usage: node src/db/seedAdmin.js <email> <password> [full_name] [role]');
    console.log('  role: super_admin | operations | finance  (default: super_admin)');
    process.exit(1);
  }

  const email = emailArg.toLowerCase().trim();
  const password = passwordArg;
  const fullName = fullNameArg || 'System Administrator';
  const role = roleArg || 'super_admin';

  if (!['super_admin', 'operations', 'finance'].includes(role)) {
    console.error('Invalid role. Use: super_admin | operations | finance');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 10);

  try {
    const existing = await pool.query('SELECT id FROM admins WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      console.log(`⚠️  Admin with email "${email}" already exists — skipping.`);
      process.exit(0);
    }

    const res = await pool.query(
      `INSERT INTO admins (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, role, created_at`,
      [email, hash, fullName, role]
    );

    console.log('✅ Admin created successfully:');
    console.log('   ID:    ', res.rows[0].id);
    console.log('   Email: ', res.rows[0].email);
    console.log('   Role:  ', res.rows[0].role);
    console.log('   Created:', res.rows[0].created_at);
    console.log('\n🔐 Save these credentials somewhere safe:');
    console.log('   Email:   ', email);
    console.log('   Password:', '(the one you just typed)');
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});