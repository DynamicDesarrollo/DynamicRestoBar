const express = require('express');
const router = express.Router();
const BridgeController = require('../controllers/BridgeController');
const verificarBridgeToken = require('../middleware/verificarBridgeToken');

router.get('/health', BridgeController.health);
router.use(verificarBridgeToken);
router.post('/jobs/next/:sedeId', BridgeController.nextJob);
router.post('/jobs/:id/done', BridgeController.markDone);
router.post('/jobs/:id/failed', BridgeController.markFailed);

module.exports = router;
