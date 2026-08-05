const db = require('../../config/database');

const RolesController = {
  async getRoles(req, res) {
    try {
      const roles = await db('roles').select('id', 'nombre');
      res.json({ data: roles });
    } catch (err) {
      res.status(500).json({ error: 'Error al obtener roles' });
    }
  },
};

module.exports = RolesController;
