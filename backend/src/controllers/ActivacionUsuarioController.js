const db = require('../config/database');
const bcrypt = require('bcryptjs');

const ActivacionUsuarioController = {
  async activarCuenta(req, res) {
    const { token, password } = req.body;
    // Buscar token válido
    const tokenRow = await db('tokens_activacion')
      .where({ token, usado: false })
      .andWhere('expira_en', '>', db.fn.now())
      .first();
    if (!tokenRow) return res.status(400).json({ error: 'Token inválido o expirado' });

    // Actualizar usuario: setear password, activar, verificar email
    const password_hash = await bcrypt.hash(password, 10);
    await db('usuarios')
      .where({ id: tokenRow.usuario_id })
      .update({ password_hash, activo: true, email_verificado: true });

    // Marcar token como usado
    await db('tokens_activacion')
      .where({ id: tokenRow.id })
      .update({ usado: true });

    res.json({ success: true });
  },
};

module.exports = ActivacionUsuarioController;
