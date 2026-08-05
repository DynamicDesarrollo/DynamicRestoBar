const db = require('../config/database');

const ClientesController = {
  async listarClientes(req, res) {
    // Traer todos los clientes
    const clientes = await db('clientes').select('*');
    // Para cada cliente, buscar el usuario admin asociado (rol: 'ADMIN_EMPRESA')
    const clientesConAdmin = await Promise.all(clientes.map(async (cliente) => {
      const admin = await db('usuarios')
        .select('id')
        .where({ cliente_id: cliente.id, rol_id: 8 })
        .first();
      return {
        ...cliente,
        admin_usuario_id: admin ? admin.id : null,
      };
    }));
    res.json(clientesConAdmin);
  },

  async crearCliente(req, res) {
    const { nombre, plan, estado, fecha_corte, email, telefono, departamento, ciudad, valor_plan } = req.body;
    let foto_url = null;
    if (req.file) {
      // Construir la URL pública para la foto
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      foto_url = `${baseUrl}/uploads/clientes/${req.file.filename}`;
    }
    // Crear cliente
    const [cliente] = await db('clientes')
      .insert({ nombre, plan, estado, fecha_corte, email, telefono, departamento, ciudad, valor_plan, foto_url })
      .returning('*');

    // Crear sede principal asociada al cliente
    const [sede] = await db('sedes')
      .insert({
        nombre: 'Sede Principal',
        direccion: '',
        ciudad,
        telefono,
        email,
        descripcion: 'Sede principal creada automáticamente',
        activa: true,
        created_at: db.fn.now(),
        updated_at: db.fn.now()
      })
      .returning('*');

    // Crear usuario admin asociado y asignar sede principal
    const bcrypt = require('bcryptjs');
    const contraseña = await bcrypt.hash('admin123', 10);
    const [admin] = await db('usuarios')
      .insert({
        nombre,
        email,
        rol_id: 8, // Administrador
        cliente_id: cliente.id,
        sede_id: sede.id,
        estado: 'activo',
        pin: '0000',
        contraseña,
        created_at: db.fn.now(),
      })
      .returning('*');

    // Generar token de activación
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expira_en = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 días
    await db('tokens_activacion').insert({
      usuario_id: admin.id,
      token,
      expira_en,
      usado: false,
    });

    // Enviar email de activación
    const { enviarTokenActivacion } = require('../services/emailService');
    try {
      await enviarTokenActivacion(admin.email, cliente.nombre, token);
    } catch (e) {
      console.error('Error enviando email de activación:', e);
    }

    res.status(201).json({ cliente, admin, token });
  },

  async obtenerCliente(req, res) {
    const { id } = req.params;
    const cliente = await db('clientes').where({ id }).first();
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(cliente);
  },

  async actualizarCliente(req, res) {
    const { id } = req.params;
    const { nombre, plan, estado, fecha_corte, email, telefono, departamento, ciudad, valor_plan } = req.body;
    let updateData = { nombre, plan, estado, fecha_corte, email, telefono, departamento, ciudad, valor_plan };
    if (req.file) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      updateData.foto_url = `${baseUrl}/uploads/clientes/${req.file.filename}`;
    }
    const [cliente] = await db('clientes')
      .where({ id })
      .update(updateData)
      .returning('*');
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(cliente);
  },

  async eliminarCliente(req, res) {
    const { id } = req.params;
    await db('clientes').where({ id }).del();
    res.json({ success: true });
  },

  async cambiarEstado(req, res) {
    const { id } = req.params;
    const { estado } = req.body;
    const [cliente] = await db('clientes')
      .where({ id })
      .update({ estado })
      .returning('*');
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(cliente);
  },

  async metricasCliente(req, res) {
    const { id } = req.params;
    // Ejemplo: contar sedes y usuarios activos
    const tieneClienteIdEnSedes = await db.schema.hasColumn('sedes', 'cliente_id');
    const sedes = tieneClienteIdEnSedes
      ? await db('sedes').where({ cliente_id: id })
      : [];
    // Puedes agregar más métricas aquí
    res.json({
      sedes: sedes.length,
      // ventas, usuarios, etc.
    });
  },
};

module.exports = ClientesController;
