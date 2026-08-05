const db = require('../config/database');
const crypto = require('crypto');
const dayjs = require('dayjs');

const AdminEmpresaController = {
  async crearAdmin(req, res) {
    const { empresa_id, nombre, email, telefono } = req.body;
    // Crear usuario admin
    const [usuario] = await db('usuarios')
      .insert({
        empresa_id,
        nombre,
        email,
        rol: 'ADMIN_EMPRESA',
        activo: false,
        email_verificado: false,
        created_at: db.fn.now(),
      })
      .returning('*');

    // Generar token de activación
    const token = crypto.randomBytes(32).toString('hex');
    const expira_en = dayjs().add(2, 'day').toDate();
    await db('tokens_activacion').insert({
      usuario_id: usuario.id,
      token,
      expira_en,
      usado: false,
    });

    // Aquí puedes enviar email (placeholder)
    // sendActivationEmail(email, token);

    res.status(201).json({ usuario, token });
  },
};

module.exports = AdminEmpresaController;
