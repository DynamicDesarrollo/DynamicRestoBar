const express = require('express');
const router = express.Router();
const verificarToken = require('../middleware/verificarToken');
const { allowRoles } = require('../middleware/roles');

const uploadClienteFoto = require('../middleware/uploadClienteFoto');
const ClientesController = require('../controllers/ClientesController');

// Proteger todas las rutas de clientes
router.use(verificarToken);
router.use(allowRoles('SUPER_ADMIN'));

// CRUD Clientes
router.get('/', ClientesController.listarClientes);
router.post('/', uploadClienteFoto.single('foto'), ClientesController.crearCliente);
router.get('/:id', ClientesController.obtenerCliente);
router.put('/:id', uploadClienteFoto.single('foto'), ClientesController.actualizarCliente);
router.delete('/:id', ClientesController.eliminarCliente);

// Cambiar estado (activar/suspender)
router.put('/:id/estado', ClientesController.cambiarEstado);

// Métricas por cliente
router.get('/:id/metricas', ClientesController.metricasCliente);

module.exports = router;
