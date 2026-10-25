const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const ctrl = require('../controllers/statusController');

router.get('/', requireAuth, ctrl.listStatuses);
router.get('/admin', requireAuth, ctrl.adminListStatuses);
router.post('/', requireAuth, ctrl.createStatus);
router.put('/:id', requireAuth, ctrl.updateStatus);
router.delete('/:id', requireAuth, ctrl.deleteStatus);

module.exports = router;