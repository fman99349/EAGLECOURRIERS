require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const trackRoutes = require('./routes/trackRoutes');

const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const statusRoutes = require('./routes/statusRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT NOW() AS now, current_database() AS db');
    res.json({ status: 'ok', database: result.rows[0].db, serverTime: result.rows[0].now });
  } catch (err) {
    next(err);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/statuses', statusRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/track', trackRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🦅 EagleCourier API → http://localhost:${PORT}`);
});


const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://https://eaglecourrier.netlify.app/', // <-- Make sure this matches perfectly
  'https://your-web-site.netlify.app'
];