/**
 * Rutas: Productos
 * 
 * GET    /api/v1/productos                    - Listar productos
 * GET    /api/v1/productos/categorias         - Listar categorías
 * GET    /api/v1/productos/:id                - Obtener producto detalle
 * GET    /api/v1/productos/combos/listar      - Listar combos
 * GET    /api/v1/productos/modificadores/:id  - Opciones modificador
 * 
 * POST   /api/v1/productos                    - Crear producto (ADMIN)
 * PUT    /api/v1/productos/:id                - Actualizar producto (ADMIN)
 * DELETE /api/v1/productos/:id                - Eliminar producto (ADMIN)
 */

const express = require('express');
const ProductosController = require('../controllers/ProductosController');
const verificarToken = require('../middleware/verificarToken');

const router = express.Router();

// Rutas públicas (obtener datos)
router.get('/categorias', ProductosController.getCategorias);
router.get('/combos/listar', ProductosController.getCombos);
router.get('/modificadores/:modificadorId', ProductosController.getModificadorOpciones);
router.get('/', ProductosController.getProductos);
router.get('/:id', ProductosController.getProductoDetalle);

// Rutas protegidas (crear/editar/eliminar)
router.post('/', verificarToken, ProductosController.crearProducto);
router.put('/:id', verificarToken, ProductosController.actualizarProducto);
router.delete('/:id', verificarToken, ProductosController.eliminarProducto);

module.exports = router;
