const db = require('../config/database');

const TokenActivacionController = {
  async obtenerPorUsuario(req, res) {
    const { usuario_id } = req.params;
    const token = await db('tokens_activacion')
      .where({ usuario_id, usado: false })
      .orderBy('expira_en', 'desc')
      .first();
    if (!token) return res.status(404).json({ error: 'No hay token activo para este usuario' });
    res.json({ token: token.token, expira_en: token.expira_en });
  },
};

module.exports = TokenActivacionController;
