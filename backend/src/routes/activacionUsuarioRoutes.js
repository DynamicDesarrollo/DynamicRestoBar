const express = require('express');
const router = express.Router();
const ActivacionUsuarioController = require('../controllers/ActivacionUsuarioController');

// Activar cuenta de usuario
router.post('/activar', ActivacionUsuarioController.activarCuenta);

module.exports = router;
