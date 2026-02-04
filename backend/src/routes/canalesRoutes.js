const express = require('express');
const CanalesController = require('../controllers/CanalesController');
const router = express.Router();

router.get('/', CanalesController.listar);

module.exports = router;
