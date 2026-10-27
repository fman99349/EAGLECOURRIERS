const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/orderController');




router.get('/:id/receipt', ctrl.downloadReceipt);
router.use(requireAuth);
router.post('/', ctrl.createOrder);
router.get('/', ctrl.listOrders);
router.get('/:id', ctrl.getOrder);
router.post('/:id/status', ctrl.updateOrderStatus);
router.delete('/:id', ctrl.deleteOrder);


// Receipt download for Admin
router.get('/:id/receipt', ctrl.downloadReceipt);




module.exports = router;