const express = require('express');
const router = express.Router();
const MenuDigitalController = require('../controllers/publico/MenuDigitalController');

// Router 100% público — el comensal lo abre desde su celular sin login.
// La validación de tenant (¿existe la sede? ¿tiene el add-on activo la
// empresa dueña?) se hace dentro del controlador, no aquí.
router.get('/:sedeId', MenuDigitalController.getMenu);
router.post('/:sedeId/llamar-mesero', MenuDigitalController.llamarMesero);

module.exports = router;
