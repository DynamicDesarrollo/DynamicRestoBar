const express = require('express');
const router = express.Router();
const ActivacionController = require('../controllers/ActivacionController');

// Endpoint para activar cuenta
router.post('/', ActivacionController.activarCuenta);

module.exports = router;
