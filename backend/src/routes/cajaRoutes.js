const express = require('express');
const router = express.Router();
const CajaController = require('../controllers/CajaController');
const verificarToken = require('../middleware/verificarToken');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// ==================== GESTIÓN DE CAJA ====================
// POST - Abrir caja
router.post('/abrir', CajaController.abrirCaja);

// GET - Obtener apertura actual
router.get('/apertura-actual', CajaController.getAperturaActual);

// POST - Registrar pago/abono
router.post('/pago', CajaController.registrarPago);

// POST - Procesar devolución
router.post('/devolucion', CajaController.procesarDevolucion);

// POST - Cerrar caja
router.post('/cerrar', CajaController.cerrarCaja);

// GET - Métodos de pago disponibles
router.get('/metodos-pago', CajaController.getMetodosPago);

// ==================== FACTURACIÓN (LEGACY) ====================
// GET - Obtener facturas por sede
router.get('/facturas/:sedeId', CajaController.getFacturasBySede);

// GET - Resumen de caja general
router.get('/resumen/:sedeId', CajaController.getResumenCaja);

// GET - Resumen de caja del día
router.get('/resumen-hoy/:sedeId', CajaController.getResumenHoy);

// POST - Cerrar orden (DEPRECATED)
router.post('/cerrar-orden/:ordenId', CajaController.cerrarOrden);

// POST - Registrar devolución (DEPRECATED)
router.post('/devoluciones', CajaController.crearDevolucion);

module.exports = router;
