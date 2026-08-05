const express = require('express');
const router = express.Router();
const PagosClientesController = require('../controllers/PagosClientesController');

router.get('/', PagosClientesController.listar);
router.post('/', PagosClientesController.crear);
router.get('/:id', PagosClientesController.obtener);
router.put('/:id', PagosClientesController.actualizar);
router.delete('/:id', PagosClientesController.eliminar);

module.exports = router;
