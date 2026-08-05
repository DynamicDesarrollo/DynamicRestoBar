const express = require('express');
const SedesController = require('../controllers/SedesController');
const router = express.Router();

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
