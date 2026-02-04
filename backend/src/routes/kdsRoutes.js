const express = require('express');
const router = express.Router();
const KdsController = require('../controllers/KdsController');
const verificarToken = require('../middleware/verificarToken');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// GET - Obtener estaciones por sede
router.get('/estaciones/:sedeId', KdsController.getEstacionesPorSede);

// GET - Obtener comandas de una estación
router.get('/estacion/:estacionId', KdsController.getComandaByEstacion);

// GET - Resumen de todas las estaciones
router.get('/resumen', KdsController.getResumenEstaciones);

// PATCH - Actualizar estado de comanda completa
router.patch('/comanda/:comandaId/estado', KdsController.updateEstadoComanda);

// PATCH - Actualizar estado de un item individual
router.patch('/item/:itemId/estado', KdsController.updateEstadoItem);

module.exports = router;
