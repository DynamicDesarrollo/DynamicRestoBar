/**
 * Rutas: Domicilios
 *
 * NO vive dentro de admin/adminRoutes.js porque ese router está fijo a solo
 * Administrador/Gerente — domicilios necesita que Caja despache pedidos y
 * que el propio Repartidor vea/actualice sus entregas asignadas. Cada
 * handler en DomiciliosController distingue internamente el alcance según
 * el rol (ver construirScope).
 */
const express = require('express');
const router = express.Router();
const DomiciliosController = require('../controllers/DomiciliosController');
const verificarToken = require('../middleware/verificarToken');
const { allowRoles } = require('../middleware/roles');

router.use(verificarToken);
router.use(allowRoles('Administrador', 'Gerente', 'Caja', 'Repartidor'));

router.get('/', DomiciliosController.listarDomicilios);
router.post('/', DomiciliosController.crearDomicilio);
router.patch('/:id/asignar', DomiciliosController.asignarRepartidor);
router.patch('/:id/estado', DomiciliosController.actualizarEstado);
router.post('/:id/pagar', DomiciliosController.registrarPago);

module.exports = router;
