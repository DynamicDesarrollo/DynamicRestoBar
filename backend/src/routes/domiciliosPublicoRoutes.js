const express = require('express');
const router = express.Router();
const DomiciliosPublicoController = require('../controllers/publico/DomiciliosPublicoController');

// Router 100% público — el comensal lo abre desde su celular sin login,
// identificado solo por el tracking_token de su propia entrega.
router.get('/:token', DomiciliosPublicoController.getSeguimiento);

module.exports = router;
