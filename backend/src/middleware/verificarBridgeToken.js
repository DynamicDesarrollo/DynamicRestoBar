module.exports = function verificarBridgeToken(req, res, next) {
  const expectedToken = process.env.PRINT_BRIDGE_TOKEN;
  const providedToken = req.headers['x-bridge-token'];

  if (!expectedToken) {
    return res.status(500).json({
      error: 'PRINT_BRIDGE_TOKEN no configurado en servidor',
    });
  }

  if (!providedToken || providedToken !== expectedToken) {
    return res.status(401).json({
      error: 'Bridge token inválido',
    });
  }

  return next();
};
