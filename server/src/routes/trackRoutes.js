const express = require('express');
const router = express.Router();
const { trackOrder, downloadPublicReceipt } = require('../controllers/trackController');

// Receipt route MUST come first so it doesn't get caught by the :order_number route
router.get('/:order_number/receipt', downloadPublicReceipt);

// Public route — no auth middleware!
router.get('/:order_number', trackOrder);

module.exports = router;