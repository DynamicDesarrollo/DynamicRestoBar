/**
 * Rutas: Autenticación
 * 
 * POST   /auth/login        - Login con email/contraseña
 * POST   /auth/login-pin    - Login con PIN (tablets)
 * POST   /auth/refresh      - Refrescar token
 * GET    /auth/me           - Obtener usuario autenticado
 * POST   /auth/logout       - Logout
 * POST   /auth/change-password - Cambiar contraseña
 */

const express = require('express');
const AuthController = require('../controllers/AuthController');
const verificarToken = require('../middleware/verificarToken');

const router = express.Router();

// Rutas públicas
router.post('/login', AuthController.login);
router.post('/login-pin', AuthController.loginPin);
router.post('/refresh', AuthController.refresh);

// Rutas protegidas
router.get('/me', verificarToken, AuthController.getMe);
router.post('/logout', verificarToken, AuthController.logout);
router.post('/change-password', verificarToken, AuthController.changePassword);

module.exports = router;
