const express = require('express');
const router = express.Router();
// Controladores para usuarios y roles
const UsuariosController = require('../../controllers/admin/UsuariosController');
const RolesController = require('../../controllers/admin/RolesController');
const EstadisticasController = require('../../controllers/admin/EstadisticasController');
const verificarToken = require('../../middleware/verificarToken');
const { allowRoles } = require('../../middleware/roles');

// Autenticación Y autorización para TODAS las rutas de este router.
// Sin el control de rol, cualquier usuario autenticado (un mesero, un cocinero)
// podía leer y escribir toda la administración del restaurante.
router.use(verificarToken);
router.use(allowRoles('Administrador', 'Gerente'));

// ========================================
// RUTAS DE USUARIOS
// ========================================
router.get('/usuarios', UsuariosController.getUsuarios);
router.get('/usuarios/:id', UsuariosController.getUsuarioById);
router.post('/usuarios', UsuariosController.crearUsuario);
router.put('/usuarios/:id', UsuariosController.actualizarUsuario);
router.delete('/usuarios/:id', UsuariosController.eliminarUsuario);

// ========================================
// RUTAS DE ROLES
// ========================================
router.get('/roles', RolesController.getRoles);

// Endpoint para gráfico de barras: ventas por día (ahora protegido)
router.get('/informes/ventas-por-dia', EstadisticasController.ventasPorDia);

// Controllers
const MesasController = require('../../controllers/admin/MesasController');
const ProductosController = require('../../controllers/admin/ProductosController');
const InsumosController = require('../../controllers/admin/InsumosController');
const RecetasController = require('../../controllers/admin/RecetasController');
const InventarioController = require('../../controllers/admin/InventarioController');
const InformesController = require('../../controllers/admin/InformesController');
const ZonasController = require('../../controllers/admin/ZonasController');
const ImpresorasController = require('../../controllers/admin/ImpresorasController');
const uploadProductoFoto = require('../../middleware/uploadProductoFoto');

// ========================================
// RUTAS DE MESAS
// ========================================
// Rutas específicas PRIMERO (antes de :id)
router.get('/mesas/siguiente-numero', MesasController.obtenerSiguienteNumero);

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
router.post('/productos', uploadProductoFoto.single('foto'), ProductosController.crearProducto);
router.put('/productos/:id', uploadProductoFoto.single('foto'), ProductosController.actualizarProducto);
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
router.get('/informes/utilidad', InformesController.getReporteUtilidad);
router.get('/informes/estadisticas', InformesController.getEstadisticas);

// ========================================
// RUTAS DE IMPRESORAS
// ========================================
router.get('/impresoras', ImpresorasController.getImpresoras);
router.post('/impresoras', ImpresorasController.crearImpresora);
router.put('/impresoras/:id', ImpresorasController.actualizarImpresora);
router.delete('/impresoras/:id', ImpresorasController.eliminarImpresora);
router.post('/impresoras/:id/test', ImpresorasController.testImpresora);

// ========================================
// RUTAS DE ZONAS (primer bloque vacío)
// ========================================

// ========================================
// RUTAS DE SEDES
// ========================================
const SedesController = require('../../controllers/admin/SedesController');
router.get('/sedes', SedesController.getSedes);
router.get('/sedes/:id', SedesController.getSedeById);
router.post('/sedes', SedesController.crearSede);
router.put('/sedes/:id', SedesController.actualizarSede);
router.put('/sedes/:id/impresora-factura', SedesController.actualizarImpresoraFactura);
router.delete('/sedes/:id', SedesController.eliminarSede);

// ========================================
// RUTAS DE ZONAS
// ========================================
router.get('/zonas', ZonasController.getZonas);
router.post('/zonas', ZonasController.crearZona);
router.put('/zonas/:id', ZonasController.actualizarZona);
router.delete('/zonas/:id', ZonasController.eliminarZona);

// ========================================
// RUTAS DE CONCEPTOS DE MOVIMIENTO (catálogo)
// ========================================
const ConceptosMovimientoController = require('../../controllers/admin/ConceptosMovimientoController');
router.get('/conceptos-movimiento', ConceptosMovimientoController.getConceptos);
router.post('/conceptos-movimiento', ConceptosMovimientoController.crearConcepto);
router.put('/conceptos-movimiento/:id', ConceptosMovimientoController.actualizarConcepto);
router.delete('/conceptos-movimiento/:id', ConceptosMovimientoController.eliminarConcepto);

// ========================================
// RUTAS DE COMPROBANTES DE INGRESOS Y EGRESOS
// ========================================
const ComprobantesController = require('../../controllers/admin/ComprobantesController');
const uploadComprobanteAdjunto = require('../../middleware/uploadComprobanteAdjunto');
router.get('/comprobantes', ComprobantesController.getComprobantes);
router.post('/comprobantes', uploadComprobanteAdjunto.single('adjunto'), ComprobantesController.crearComprobante);
router.put('/comprobantes/:id', uploadComprobanteAdjunto.single('adjunto'), ComprobantesController.actualizarComprobante);
router.delete('/comprobantes/:id', ComprobantesController.eliminarComprobante);

// ========================================
// RUTAS DE FACTURA ELECTRÓNICA (envío a la app puente con Aliaddo)
// ========================================
const FacturasElectronicasController = require('../../controllers/admin/FacturasElectronicasController');
router.get('/facturas-electronicas', FacturasElectronicasController.listar);
router.post('/facturas-electronicas/:id/reenviar', FacturasElectronicasController.reenviar);

module.exports = router;
