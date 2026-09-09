const bcrypt = require('bcryptjs');
const db = require('../../config/database');
const { sedesDelCliente } = require('../../utils/tenantScope');

// Compatibilidad con tokens antiguos que no incluyen cliente_id.
const resolverClienteId = async (req) => {
  let clienteId = req.usuario?.cliente_id || null;
  const userId = req.usuario?.userId;
  if (!clienteId && userId) {
    const usuarioActual = await db('usuarios')
      .select('cliente_id')
      .where('id', userId)
      .whereNull('deleted_at')
      .first();
    clienteId = usuarioActual?.cliente_id || null;
  }
  return clienteId;
};

// Un mismo PIN en dos empresas distintas no es problema (el login lo acota
// por sede), pero dos usuarios de la MISMA empresa con el mismo PIN sí
// generan el login-pin ambiguo que reportó el usuario — se valida acá,
// al momento de crear/editar, en vez de descubrirlo después al iniciar sesión.
const pinDuplicadoEnCliente = async (pin, clienteId, sedeIds, excluirUsuarioId = null) => {
  if (!pin) return false;
  let query = db('usuarios')
    .where('pin', String(pin).trim())
    .andWhere('estado', 'activo')
    .whereNull('deleted_at')
    .andWhere((q) => {
      q.where('cliente_id', clienteId).orWhereIn('sede_id', sedeIds);
    });
  if (excluirUsuarioId) {
    query = query.andWhereNot('id', excluirUsuarioId);
  }
  const existente = await query.first();
  return !!existente;
};

// El rol se recibe del body, así que hay que validarlo: sin esto, quien
// pueda llamar a este endpoint se asigna el rol que quiera. Un Gerente no
// puede crear ni ascender a nadie a Administrador (sería auto-ascenso).
const validarRolAsignable = async (rolId, rolSolicitante) => {
  if (rolId === undefined || rolId === null || rolId === '') {
    return { ok: true };
  }
  const rol = await db('roles').where('id', rolId).first();
  if (!rol) {
    return { ok: false, status: 400, error: 'El rol indicado no existe' };
  }
  if (rol.nombre === 'Administrador' && rolSolicitante !== 'Administrador') {
    return { ok: false, status: 403, error: 'Solo un Administrador puede asignar el rol Administrador' };
  }
  return { ok: true };
};

// Verifica que el usuario objetivo pertenezca al mismo cliente que el
// que hace la petición (por cliente_id directo, o por sede_id como
// fallback para filas legacy sin cliente_id asignado).
const usuarioPerteneceACliente = async (usuarioId, clienteId, sedeIds) => {
  const objetivo = await db('usuarios')
    .select('id', 'cliente_id', 'sede_id')
    .where('id', usuarioId)
    .whereNull('deleted_at')
    .first();
  if (!objetivo) return { objetivo: null, permitido: false };
  if (objetivo.cliente_id != null) {
    return { objetivo, permitido: objetivo.cliente_id === clienteId };
  }
  return { objetivo, permitido: objetivo.sede_id != null && sedeIds.includes(objetivo.sede_id) };
};

const UsuariosController = {
  async getUsuarios(req, res) {
    try {
      const sedeId = req.usuario?.sedeId || req.usuario?.sede_id;
      const clienteId = await resolverClienteId(req);

      let query = db('usuarios')
        .select('id', 'nombre', 'email', 'rol_id', 'sede_id', 'cliente_id')
        .whereNull('deleted_at')
        .whereNot('rol_id', 8);

      if (clienteId) {
        query = query.where('cliente_id', clienteId);
      } else if (sedeId) {
        // Fallback defensivo para datos legacy sin cliente asociado.
        query = query.where('sede_id', sedeId);
      } else {
        return res.json({ success: true, data: [] });
      }

      const usuarios = await query.orderBy('nombre', 'asc');
      res.json({ success: true, data: usuarios });
    } catch (err) {
      res.status(500).json({ error: 'Error al obtener usuarios' });
    }
  },

  async getUsuarioById(req, res) {
    try {
      const clienteId = await resolverClienteId(req);
      const sedeIds = await sedesDelCliente(clienteId);
      const { objetivo, permitido } = await usuarioPerteneceACliente(req.params.id, clienteId, sedeIds);
      if (!objetivo) return res.status(404).json({ error: 'Usuario no encontrado' });
      if (!permitido) return res.status(403).json({ error: 'No puedes ver un usuario de otra empresa' });

      const usuario = await db('usuarios')
        .select('id', 'nombre', 'email', 'rol_id', 'sede_id')
        .where({ id: req.params.id })
        .whereNull('deleted_at')
        .first();
      res.json({ data: usuario });
    } catch (err) {
      res.status(500).json({ error: 'Error al obtener usuario' });
    }
  },

  async crearUsuario(req, res) {
    try {
      const { nombre, email, pin, rol_id } = req.body;
      const cliente_id = req.usuario?.cliente_id;
      if (!cliente_id) {
        return res.status(400).json({ error: 'No se puede determinar el cliente para el usuario.' });
      }

      const sedeIds = await sedesDelCliente(cliente_id);
      let sede_id = req.body.sede_id || null;
      if (sede_id && !sedeIds.includes(Number(sede_id))) {
        return res.status(403).json({ error: 'La sede indicada no pertenece a tu empresa' });
      }
      if (!sede_id) {
        sede_id = req.usuario?.sede_id || null;
      }

      const rolValido = await validarRolAsignable(rol_id, req.usuario?.rol);
      if (!rolValido.ok) {
        return res.status(rolValido.status).json({ error: rolValido.error });
      }

      if (await pinDuplicadoEnCliente(pin, cliente_id, sedeIds)) {
        return res.status(409).json({ error: 'Ya existe otro usuario de tu empresa con ese PIN. Elige uno distinto.' });
      }

      // Usamos una contraseña temporal segura para cumplir la columna NOT NULL.
      // El usuario puede cambiarla después si es necesario.
      const contraseña = await bcrypt.hash(pin || '1234', 10);
      const [id] = await db('usuarios')
        .insert({ nombre, email, pin, rol_id, sede_id, cliente_id, contraseña })
        .returning('id');
      res.json({ success: true, id });
    } catch (err) {
      console.error('❌ Error al crear usuario:', err);
      const response = { error: 'Error al crear usuario' };
      if (process.env.NODE_ENV !== 'production') {
        response.details = err.message;
      }
      res.status(500).json(response);
    }
  },

  async actualizarUsuario(req, res) {
    try {
      const { nombre, email, pin, rol_id, sede_id } = req.body;
      const clienteId = await resolverClienteId(req);
      const sedeIds = await sedesDelCliente(clienteId);
      const { objetivo, permitido } = await usuarioPerteneceACliente(req.params.id, clienteId, sedeIds);
      if (!objetivo) return res.status(404).json({ error: 'Usuario no encontrado' });
      if (!permitido) return res.status(403).json({ error: 'No puedes editar un usuario de otra empresa' });
      if (sede_id && !sedeIds.includes(Number(sede_id))) {
        return res.status(403).json({ error: 'La sede indicada no pertenece a tu empresa' });
      }
      const rolValido = await validarRolAsignable(rol_id, req.usuario?.rol);
      if (!rolValido.ok) {
        return res.status(rolValido.status).json({ error: rolValido.error });
      }
      if (pin && await pinDuplicadoEnCliente(pin, clienteId, sedeIds, req.params.id)) {
        return res.status(409).json({ error: 'Ya existe otro usuario de tu empresa con ese PIN. Elige uno distinto.' });
      }

      // El PIN ya no viaja al frontend, así que el formulario lo manda vacío
      // cuando no se quiere cambiar: solo se actualiza si trae valor.
      const cambios = { nombre, email, rol_id, sede_id };
      if (pin) {
        cambios.pin = String(pin).trim();
      }

      await db('usuarios').where({ id: req.params.id }).update(cambios);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Error al actualizar usuario' });
    }
  },

  async eliminarUsuario(req, res) {
    try {
      const clienteId = await resolverClienteId(req);
      const sedeIds = await sedesDelCliente(clienteId);
      const { objetivo, permitido } = await usuarioPerteneceACliente(req.params.id, clienteId, sedeIds);
      if (!objetivo) return res.status(404).json({ error: 'Usuario no encontrado' });
      if (!permitido) return res.status(403).json({ error: 'No puedes eliminar un usuario de otra empresa' });

      await db('usuarios')
        .where({ id: req.params.id })
        .update({ deleted_at: db.fn.now() });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Error al eliminar usuario' });
    }
  },
};

module.exports = UsuariosController;
