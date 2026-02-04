/**
 * Rutas: Órdenes
 * 
 * POST   /ordenes           - Crear nueva orden
 * GET    /ordenes/:id       - Obtener orden por ID
 * GET    /ordenes/mesa/:mesaId - Obtener órdenes de una mesa
 * PATCH  /ordenes/:id/estado - Actualizar estado de orden
 * DELETE /ordenes/:id       - Cancelar orden
 * GET    /ordenes/sede/:sedeId - Obtener órdenes abiertas de una sede
 */

const express = require('express');
const OrdenesController = require('../controllers/OrdenesController');
const verificarToken = require('../middleware/verificarToken');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verificarToken);

// Rutas
router.post('/', OrdenesController.crear);
router.get('/estado/abierta', OrdenesController.getPendientes);
router.get('/:id', OrdenesController.getById);
router.get('/mesa/:mesaId', OrdenesController.getByMesa);
router.patch('/:id/estado', OrdenesController.updateEstado);
router.delete('/:id', OrdenesController.cancelar);
router.get('/sede/:sedeId', OrdenesController.getBySedeAbiertas);

module.exports = router;
