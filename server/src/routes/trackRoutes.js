const express = require('express');
const router = express.Router();
const { trackOrder } = require('../controllers/trackController');

// Public route — no auth middleware!
router.get('/:order_number', trackOrder);

module.exports = router;