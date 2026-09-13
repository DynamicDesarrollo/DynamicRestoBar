/**
 * MenuDigitalController
 *
 * Endpoint PÚBLICO (sin JWT) para el menú digital que ve el comensal desde
 * su celular. A diferencia de ProductosController (que resuelve la sede
 * desde req.usuario), aquí la sede viene directo de la URL — por eso valida
 * "a mano" en vez de reusar tenantScope.js.
 *
 * Solo responde si la empresa dueña de la sede tiene el valor agregado
 * activo (clientes.menu_digital_habilitado) — lo activa el super-admin del
 * SaaS, nunca el propio restaurante.
 */
const db = require('../../config/database');

const DUPLICADO_VENTANA_MINUTOS = 2;

// Nunca revela si la sede existe pero no tiene el add-on, o si el id ni
// siquiera corresponde a una sede — mismo 404 genérico en ambos casos.
const resolverSedeConMenuDigital = async (sedeId) => {
  if (!sedeId || Number.isNaN(Number(sedeId))) return null;

  const sede = await db('sedes')
    .where({ id: Number(sedeId) })
    .whereNull('deleted_at')
    .andWhere('activa', true)
    .first();
  if (!sede) return null;

  const cliente = await db('clientes').where({ id: sede.cliente_id }).first();
  if (!cliente || !cliente.menu_digital_habilitado) return null;

  return sede;
};

const MenuDigitalController = {
  async getMenu(req, res) {
    try {
      const sede = await resolverSedeConMenuDigital(req.params.sedeId);
      if (!sede) return res.status(404).json({ error: 'Menú no disponible' });

      const [categorias, productos, mesas] = await Promise.all([
        db('categorias')
          .select('id', 'nombre', 'descripcion', 'icono_url', 'orden')
          .where('activa', true)
          .andWhere('sede_id', sede.id)
          .whereNull('deleted_at')
          .orderBy('orden', 'asc'),
        db('productos')
          .select('id', 'nombre', 'descripcion', 'precio_venta', 'foto_url', 'categoria_id')
          .where('estado', 'activo')
          .andWhere('sede_id', sede.id)
          .whereNull('deleted_at')
          .orderBy('nombre', 'asc'),
        db('mesas')
          .where('sede_id', sede.id)
          .whereNull('deleted_at')
          .orderBy('numero', 'asc')
          .pluck('numero'),
      ]);

      return res.json({
        success: true,
        sede: { id: sede.id, nombre: sede.nombre, estilo_catalogo: sede.estilo_catalogo || 'clasico' },
        categorias,
        productos,
        mesas,
      });
    } catch (error) {
      console.error('❌ Error al obtener menú digital:', error);
      return res.status(500).json({ error: 'Error al obtener el menú' });
    }
  },

  async llamarMesero(req, res) {
    try {
      const sede = await resolverSedeConMenuDigital(req.params.sedeId);
      if (!sede) return res.status(404).json({ error: 'Menú no disponible' });

      const mesaNumero = String(req.body?.mesa_numero || '').trim();
      const mensaje = req.body?.mensaje ? String(req.body.mensaje).slice(0, 2000) : null;

      if (!mesaNumero) {
        return res.status(400).json({ error: 'mesa_numero es requerido' });
      }

      const mesa = await db('mesas')
        .where({ sede_id: sede.id, numero: mesaNumero })
        .whereNull('deleted_at')
        .first();
      if (!mesa) {
        return res.status(400).json({ error: 'Esa mesa no existe en esta sede' });
      }

      // Evita que un doble-tap (o alguien jugando con el botón) llene la
      // pantalla del mesero de avisos duplicados de la misma mesa.
      const ventanaDesde = new Date(Date.now() - DUPLICADO_VENTANA_MINUTOS * 60 * 1000);
      const existente = await db('llamados_mesero')
        .where({ sede_id: sede.id, mesa_numero: mesaNumero, estado: 'pendiente' })
        .andWhere('created_at', '>=', ventanaDesde)
        .first();
      if (existente) {
        return res.json({ success: true, data: existente, duplicado: true });
      }

      const [llamado] = await db('llamados_mesero')
        .insert({
          sede_id: sede.id,
          mesa_numero: mesaNumero,
          mensaje,
          created_at: db.fn.now(),
          updated_at: db.fn.now(),
        })
        .returning('*');

      return res.status(201).json({ success: true, data: llamado });
    } catch (error) {
      console.error('❌ Error al llamar al mesero:', error);
      return res.status(500).json({ error: 'Error al enviar el aviso' });
    }
  },
};

module.exports = MenuDigitalController;
