const db = require('../config/database');
const bcrypt = require('bcryptjs');

const ActivacionController = {
  async activarCuenta(req, res) {
    const { token, nueva_contraseña } = req.body;
    if (!token || !nueva_contraseña) {
      return res.status(400).json({ error: 'Token y nueva contraseña requeridos' });
    }
    // Buscar token válido
    const tokenRow = await db('tokens_activacion')
      .where({ token, usado: false })
      .andWhere('expira_en', '>', new Date())
      .first();
    if (!tokenRow) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }
    // Actualizar contraseña del usuario
    const hash = await bcrypt.hash(nueva_contraseña, 10);
    await db('usuarios')
      .where({ id: tokenRow.usuario_id })
      .update({ contraseña: hash });
    // Marcar token como usado
    await db('tokens_activacion')
      .where({ id: tokenRow.id })
      .update({ usado: true });
    res.json({ success: true, message: 'Cuenta activada correctamente' });
  },
};

module.exports = ActivacionController;
