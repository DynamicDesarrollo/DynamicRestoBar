const express = require('express');
const router = express.Router();
const verificarToken = require('../middleware/verificarToken');
const { requireSuperAdmin } = require('../middleware/roles');
const TokenActivacionController = require('../controllers/TokenActivacionController');

// El token de activación permite reescribir la contraseña de su usuario
// (ver ActivacionController), así que solo el super-admin puede consultarlo.
router.use(verificarToken);
router.use(requireSuperAdmin);

// Obtener token de activación por usuario
router.get('/:usuario_id', TokenActivacionController.obtenerPorUsuario);

module.exports = router;
