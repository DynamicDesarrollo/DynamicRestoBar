const express = require('express');
const router = express.Router();
const TokenActivacionController = require('../controllers/TokenActivacionController');

// Obtener token de activación por usuario
router.get('/:usuario_id', TokenActivacionController.obtenerPorUsuario);

module.exports = router;
