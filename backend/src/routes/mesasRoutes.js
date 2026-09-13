/**
 * Rutas: Mesas
 * 
 * GET    /mesas           - Obtener todas las mesas (con filtro sedeId)
 * GET    /mesas/:id       - Obtener mesa por ID
 * PATCH  /mesas/:id/estado - Actualizar estado de mesa
 * GET    /mesas/:id/comanda - Obtener comanda actual de mesa
 */

const express = require('express');
const MesasController = require('../controllers/MesasController');
const verificarToken = require('../middleware/verificarToken');

const router = express.Router();

// Todas las rutas de mesas requieren autenticación
router.use(verificarToken);

// Rutas
router.get('/', MesasController.getAll);
router.patch('/trasladar', MesasController.trasladar);
// Antes de '/:id' — si no, Express las confunde con una mesa de id "llamados".
router.get('/llamados', MesasController.getLlamados);
router.post('/llamados/:id/atender', MesasController.atenderLlamado);
router.get('/:id', MesasController.getById);
router.patch('/:id/estado', MesasController.updateEstado);
router.get('/:id/comanda', MesasController.getComanda);

module.exports = router;
