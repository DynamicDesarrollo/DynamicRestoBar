/**
 * SedesController
 * CRUD para sedes (sucursales) de una empresa (cliente)
 * Relación: cada sede pertenece a un cliente (empresa)
 *
 * Toda operación se acota al cliente autenticado. El super-admin del SaaS
 * es el único que puede operar sobre cualquier cliente, y debe indicarlo
 * explícitamente.
 */
const db = require('../config/database');
const { esSuperAdmin: esSuperAdminUsuario } = require('../middleware/roles');

const esSuperAdmin = (req) => esSuperAdminUsuario(req.usuario);

/**
 * Cliente sobre el que puede operar quien hace la petición.
 * Devuelve { ok: false, ... } cuando pide uno que no le corresponde.
 */
const resolverCliente = (req, clienteSolicitado) => {
  const propio = req.usuario?.cliente_id ?? null;

  if (esSuperAdmin(req)) {
    const elegido = clienteSolicitado ?? null;
    if (!elegido) {
      return { ok: false, status: 400, error: 'clienteId es requerido' };
    }
    return { ok: true, clienteId: Number(elegido) };
  }

  if (propio == null) {
    return { ok: false, status: 403, error: 'Tu usuario no tiene una empresa asociada' };
  }
  if (clienteSolicitado != null && Number(clienteSolicitado) !== Number(propio)) {
    return { ok: false, status: 403, error: 'No puedes consultar sedes de otra empresa' };
  }
  return { ok: true, clienteId: Number(propio) };
};

/** Carga la sede solo si pertenece al cliente de quien hace la petición. */
const sedePropia = async (req, sedeId) => {
  const sede = await db('sedes').where({ id: sedeId, deleted_at: null }).first();
  if (!sede) return { ok: false, status: 404, error: 'Sede no encontrada' };
  if (esSuperAdmin(req)) return { ok: true, sede };
  if (Number(sede.cliente_id) !== Number(req.usuario?.cliente_id)) {
    return { ok: false, status: 403, error: 'Esa sede no pertenece a tu empresa' };
  }
  return { ok: true, sede };
};

class SedesController {
  // Verificar si una sede tiene datos asociados
  static async tieneAsociados(req, res) {
    try {
      const permiso = await sedePropia(req, req.params.id);
      if (!permiso.ok) return res.status(permiso.status).json({ error: permiso.error });

      const { id } = req.params;
      const mesas = await db('mesas').where({ sede_id: id, deleted_at: null }).count('id as total');
      const ordenes = await db('ordenes').where({ sede_id: id, deleted_at: null }).count('id as total');
      const productos = await db('productos').where({ sede_id: id, deleted_at: null }).count('id as total');
      const tiene =
        Number(mesas[0].total) > 0 || Number(ordenes[0].total) > 0 || Number(productos[0].total) > 0;
      return res.json({ tieneAsociados: tiene });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }

  // Obtener todas las sedes del cliente autenticado
  static async getAll(req, res) {
    try {
      const permiso = resolverCliente(req, req.query.clienteId);
      if (!permiso.ok) return res.status(permiso.status).json({ error: permiso.error });

      const sedes = await db('sedes')
        .select('*')
        .where('cliente_id', permiso.clienteId)
        .where('deleted_at', null)
        .orderBy('nombre', 'asc');
      return res.json({ success: true, data: sedes });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }

  // Obtener sede por ID
  static async getById(req, res) {
    try {
      const permiso = await sedePropia(req, req.params.id);
      if (!permiso.ok) return res.status(permiso.status).json({ error: permiso.error });
      return res.json({ success: true, data: permiso.sede });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }

  // Crear sede
  static async create(req, res) {
    try {
      const { nombre, direccion, ciudad, telefono, email, descripcion, activa } = req.body;
      if (!nombre) {
        return res.status(400).json({ error: 'nombre es requerido' });
      }

      // El cliente sale del token; solo el super-admin puede indicarlo.
      const permiso = resolverCliente(req, req.body.cliente_id);
      if (!permiso.ok) return res.status(permiso.status).json({ error: permiso.error });

      const [sede] = await db('sedes')
        .insert({
          nombre,
          direccion,
          ciudad,
          telefono,
          email,
          descripcion,
          activa: activa !== undefined ? activa : true,
          cliente_id: permiso.clienteId,
          created_at: db.fn.now(),
          updated_at: db.fn.now(),
        })
        .returning('*');
      return res.status(201).json({ success: true, data: sede });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }

  // Actualizar sede
  static async update(req, res) {
    try {
      const permiso = await sedePropia(req, req.params.id);
      if (!permiso.ok) return res.status(permiso.status).json({ error: permiso.error });

      // Whitelist explícita: estilo_catalogo y cliente_id NUNCA se aceptan por esta vía
      // (estilo_catalogo solo lo fija el super-admin del SaaS vía ClientesController).
      const { nombre, direccion, ciudad, telefono, email, descripcion, activa } = req.body;
      const [sede] = await db('sedes')
        .where({ id: req.params.id, deleted_at: null })
        .update({
          nombre, direccion, ciudad, telefono, email, descripcion, activa,
          updated_at: db.fn.now(),
        })
        .returning('*');
      if (!sede) return res.status(404).json({ error: 'Sede no encontrada' });
      return res.json({ success: true, data: sede });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }

  // Eliminar sede (soft delete)
  static async delete(req, res) {
    try {
      const permiso = await sedePropia(req, req.params.id);
      if (!permiso.ok) return res.status(permiso.status).json({ error: permiso.error });

      const [sede] = await db('sedes')
        .where({ id: req.params.id, deleted_at: null })
        .update({ deleted_at: db.fn.now() })
        .returning('*');
      if (!sede) return res.status(404).json({ error: 'Sede no encontrada' });
      return res.json({ success: true, data: sede });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }
}

module.exports = SedesController;
