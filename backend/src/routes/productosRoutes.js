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

// Todas las rutas exigen sesión. Antes las lecturas eran públicas y, sin
// sedeId, devolvían el catálogo de TODOS los clientes. Cuando exista el menú
// QR para comensales, debe añadirse un endpoint público aparte que reciba la
// sede y devuelva solo esa, en vez de reabrir estas.
router.use(verificarToken);

// Consulta de catálogo
router.get('/categorias', ProductosController.getCategorias);
router.get('/combos/listar', ProductosController.getCombos);
router.get('/modificadores/:modificadorId', ProductosController.getModificadorOpciones);
router.get('/', ProductosController.getProductos);
router.get('/:id', ProductosController.getProductoDetalle);

// Crear/editar/eliminar
router.post('/', ProductosController.crearProducto);
router.put('/:id', ProductosController.actualizarProducto);
router.delete('/:id', ProductosController.eliminarProducto);

module.exports = router;
