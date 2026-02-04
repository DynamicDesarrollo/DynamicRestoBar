const express = require('express');
const router = express.Router();
// Gráficos y estadísticas avanzadas
const EstadisticasController = require('../../controllers/admin/EstadisticasController');
const verificarToken = require('../../middleware/verificarToken');

// Controllers
const MesasController = require('../../controllers/admin/MesasController');
const ProductosController = require('../../controllers/admin/ProductosController');
const InsumosController = require('../../controllers/admin/InsumosController');
const RecetasController = require('../../controllers/admin/RecetasController');
const InventarioController = require('../../controllers/admin/InventarioController');
const InformesController = require('../../controllers/admin/InformesController');
const ZonasController = require('../../controllers/admin/ZonasController');

// Middleware de autenticación para todas las rutas admin
router.use(verificarToken);

// Endpoint para gráfico de barras: ventas por día (ahora protegido)
router.get('/informes/ventas-por-dia', EstadisticasController.ventasPorDia);

// ========================================
// RUTAS DE MESAS
// ========================================
// Rutas específicas PRIMERO (antes de :id)
router.get('/mesas/siguiente-numero', MesasController.obtenerSiguienteNumero);
router.post('/mesas/limpiar-duplicadas', MesasController.limpiarDuplicadas);
router.post('/mesas/debug-eliminar-21', MesasController.eliminarTodas21);

// Rutas genéricas DESPUÉS
router.get('/mesas', MesasController.getMesas);
router.post('/mesas', MesasController.crearMesa);
router.put('/mesas/:id', MesasController.actualizarMesa);
router.delete('/mesas/:id', MesasController.eliminarMesa);

// ========================================
// RUTAS DE PRODUCTOS Y CATEGORÍAS
// ========================================
router.get('/categorias', ProductosController.getCategorias);
router.post('/categorias', ProductosController.crearCategoria);
router.put('/categorias/:id', ProductosController.actualizarCategoria);
router.delete('/categorias/:id', ProductosController.eliminarCategoria);
router.get('/estaciones', ProductosController.getEstaciones);

router.get('/productos', ProductosController.getProductos);
router.post('/productos', ProductosController.crearProducto);
router.put('/productos/:id', ProductosController.actualizarProducto);
router.delete('/productos/:id', ProductosController.eliminarProducto);

// ========================================
// RUTAS DE INSUMOS
// ========================================
router.get('/insumos/bajo-stock', InsumosController.getInsumosBajoStock);
router.get('/insumos/unidades', InsumosController.getUnidadesMedida);
router.get('/insumos/proveedores', InsumosController.getProveedores);
router.post('/insumos/proveedores', InsumosController.crearProveedor);

router.get('/insumos', InsumosController.getInsumos);
router.get('/insumos/:id', InsumosController.getInsumoById);
router.post('/insumos', InsumosController.crearInsumo);
router.put('/insumos/:id', InsumosController.actualizarInsumo);
router.patch('/insumos/:id/stock', InsumosController.actualizarStock);
router.delete('/insumos/:id', InsumosController.eliminarInsumo);

// ========================================
// RUTAS DE RECETAS
// ========================================
router.get('/recetas', RecetasController.getRecetas);
router.get('/recetas/:id', RecetasController.getRecetaById);
router.get('/recetas/producto/:producto_id', RecetasController.getRecetaByProducto);
router.post('/recetas', RecetasController.crearReceta);
router.put('/recetas/:id', RecetasController.actualizarReceta);
router.post('/recetas/:id/insumos', RecetasController.agregarInsumoReceta);
router.delete('/recetas/:id/insumos/:insumo_id', RecetasController.eliminarInsumoReceta);
router.delete('/recetas/:id', RecetasController.eliminarReceta);

// ========================================
// RUTAS DE INVENTARIO (Kardex, Movimientos)
// ========================================
router.get('/inventario/dashboard', InventarioController.getDashboardInventario);
router.get('/inventario/kardex', InventarioController.getKardex);
router.get('/inventario/historial/:insumo_id', InventarioController.getHistorialInsumo);
router.post('/inventario/entrada', InventarioController.registrarEntrada);
router.post('/inventario/salida', InventarioController.registrarSalida);
router.post('/inventario/ajuste', InventarioController.registrarAjuste);
router.post('/inventario/descontar-venta', InventarioController.descontarInsumosPorVenta);

// ========================================
// RUTAS DE INFORMES
// ========================================
router.get('/informes/ventas', InformesController.getReporteVentas);
router.get('/informes/productos', InformesController.getReporteProductos);
router.get('/informes/inventario', InformesController.getReporteInventario);
router.get('/informes/impacto-ventas', InformesController.getImpactoVentasInventario);
router.get('/informes/caja', InformesController.getReporteCaja);
router.get('/informes/metodos-pago', InformesController.getReporteMetodosPago);
router.get('/informes/estadisticas', InformesController.getEstadisticas);

// ========================================
// RUTAS DE ZONAS
// ========================================
router.get('/zonas', ZonasController.getZonas);
router.post('/zonas', ZonasController.crearZona);
router.put('/zonas/:id', ZonasController.actualizarZona);
router.delete('/zonas/:id', ZonasController.eliminarZona);

module.exports = router;
