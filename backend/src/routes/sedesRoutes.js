const express = require('express');
const SedesController = require('../controllers/SedesController');
const verificarToken = require('../middleware/verificarToken');
const router = express.Router();

router.use(verificarToken);

// Listar sedes de un cliente
router.get('/', SedesController.getAll);
// Obtener sede por ID
router.get('/:id', SedesController.getById);
// Crear sede
router.post('/', SedesController.create);
// Actualizar sede
router.put('/:id', SedesController.update);
// Eliminar sede (soft delete)
router.delete('/:id', SedesController.delete);

// Verificar si una sede tiene datos asociados
router.get('/:id/tiene-asociados', SedesController.tieneAsociados);

module.exports = router;
