const express = require('express');
const router = express.Router();
const AdminEmpresaController = require('../controllers/AdminEmpresaController');

// Crear admin para empresa
router.post('/crear-admin', AdminEmpresaController.crearAdmin);

module.exports = router;
