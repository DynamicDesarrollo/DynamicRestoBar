const express = require('express');
const router = express.Router();
const verificarToken = require('../middleware/verificarToken');
const { requireSuperAdmin } = require('../middleware/roles');
const PagosClientesController = require('../controllers/PagosClientesController');

// Los pagos de suscripción son facturación del SaaS: solo el super-admin.
router.use(verificarToken);
router.use(requireSuperAdmin);

router.get('/', PagosClientesController.listar);
router.post('/', PagosClientesController.crear);
router.get('/:id', PagosClientesController.obtener);
router.put('/:id', PagosClientesController.actualizar);
router.delete('/:id', PagosClientesController.eliminar);

module.exports = router;
