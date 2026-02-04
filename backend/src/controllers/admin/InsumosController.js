const db = require('../../config/database');

class InsumosController {
  // Obtener todos los insumos
  static async getInsumos(req, res) {
    try {
      const insumos = await db('insumos')
        .leftJoin('unidad_medida', 'insumos.unidad_medida_id', 'unidad_medida.id')
        .leftJoin('proveedores', 'insumos.proveedor_principal_id', 'proveedores.id')
        .select(
          'insumos.id',
          'insumos.nombre',
          'insumos.codigo_sku',
          'insumos.unidad_medida_id',
          'insumos.stock_actual',
          'insumos.stock_minimo',
          'insumos.stock_maximo',
          'insumos.costo_unitario',
          'insumos.costo_promedio',
          'insumos.proveedor_principal_id',
          'unidad_medida.nombre as unidad_medida',
          'proveedores.nombre as proveedor'
        )
        .where('insumos.activo', true)
        .orderBy('insumos.nombre', 'asc');

      return res.json({
        success: true,
        data: insumos,
      });
    } catch (err) {
      console.error('❌ Error en getInsumos:', err.message);
      return res.status(500).json({
        error: 'Error al obtener insumos',
        message: err.message,
      });
    }
  }

  // Obtener insumo por ID
  static async getInsumoById(req, res) {
    try {
      const { id } = req.params;

      const insumo = await db('insumos')
        .leftJoin('unidad_medida', 'insumos.unidad_medida_id', 'unidad_medida.id')
        .leftJoin('proveedores', 'insumos.proveedor_principal_id', 'proveedores.id')
        .select(
          'insumos.*',
          'unidad_medida.nombre as unidad_medida',
          'proveedores.nombre as proveedor'
        )
        .where('insumos.id', id)
        .where('insumos.activo', true)
        .first();

      if (!insumo) {
        return res.status(404).json({ error: 'Insumo no encontrado' });
      }

      return res.json({
        success: true,
        data: insumo,
      });
    } catch (err) {
      console.error('❌ Error en getInsumoById:', err.message);
      return res.status(500).json({
        error: 'Error al obtener insumo',
        message: err.message,
      });
    }
  }

  // Obtener insumos bajo stock
  static async getInsumosBajoStock(req, res) {
    try {
      const insumos = await db('insumos')
        .leftJoin('unidad_medida', 'insumos.unidad_medida_id', 'unidad_medida.id')
        .select(
          'insumos.id',
          'insumos.nombre',
          'insumos.stock_actual',
          'insumos.stock_minimo',
          'unidad_medida.nombre as unidad_medida'
        )
        .where('insumos.activo', true)
        .whereRaw('insumos.stock_actual <= insumos.stock_minimo')
        .orderBy('insumos.stock_actual', 'asc');

      return res.json({
        success: true,
        data: insumos,
        total: insumos.length,
      });
    } catch (err) {
      console.error('❌ Error en getInsumosBajoStock:', err.message);
      return res.status(500).json({
        error: 'Error al obtener insumos bajo stock',
        message: err.message,
      });
    }
  }

  // Crear insumo
  static async crearInsumo(req, res) {
    try {
      const {
        nombre,
        codigo_sku,
        unidad_medida_id,
        stock_actual,
        stock_minimo,
        stock_maximo,
        costo_unitario,
        proveedor_principal_id,
      } = req.body;

      if (!nombre || !unidad_medida_id || !costo_unitario) {
        return res.status(400).json({
          error: 'Nombre, unidad de medida y costo unitario son requeridos',
        });
      }

      // Verificar si el SKU ya existe (si se proporciona)
      if (codigo_sku) {
        const existe = await db('insumos')
          .where('codigo_sku', codigo_sku)
          .where('activo', true)
          .first();

        if (existe) {
          return res.status(400).json({
            error: 'El código SKU ya existe',
          });
        }
      }

      const result = await db('insumos').insert({
        nombre,
        codigo_sku: codigo_sku || null,
        unidad_medida_id,
        stock_actual: parseFloat(stock_actual) || 0,
        stock_minimo: stock_minimo || 0,
        stock_maximo: stock_maximo || null,
        costo_unitario: parseFloat(costo_unitario),
        costo_promedio: parseFloat(costo_unitario),
        proveedor_principal_id: proveedor_principal_id || null,
        activo: true,
      }).returning('*');

      const insumo = Array.isArray(result) ? result[0] : result;

      console.log(`✅ Insumo ${nombre} creado`);

      return res.json({
        success: true,
        message: 'Insumo creado exitosamente',
        data: insumo,
      });
    } catch (err) {
      console.error('❌ Error en crearInsumo:', err.message);
      return res.status(500).json({
        error: 'Error al crear insumo',
        message: err.message,
      });
    }
  }

  // Actualizar insumo
  static async actualizarInsumo(req, res) {
    try {
      const { id } = req.params;
      const {
        nombre,
        codigo_sku,
        unidad_medida_id,
        stock_actual,
        stock_minimo,
        stock_maximo,
        costo_unitario,
        proveedor_principal_id,
      } = req.body;

      const insumo = await db('insumos').where('id', id).first();

      if (!insumo) {
        return res.status(404).json({ error: 'Insumo no encontrado' });
      }

      // Verificar SKU duplicado si cambió
      if (codigo_sku && codigo_sku !== insumo.codigo_sku) {
        const existe = await db('insumos')
          .where('codigo_sku', codigo_sku)
          .where('id', '!=', id)
          .where('activo', true)
          .first();

        if (existe) {
          return res.status(400).json({
            error: 'El código SKU ya existe en otro insumo',
          });
        }
      }

      const updateData = {};
      if (nombre !== undefined) updateData.nombre = nombre;
      if (codigo_sku !== undefined) updateData.codigo_sku = codigo_sku || null;
      if (unidad_medida_id !== undefined) updateData.unidad_medida_id = unidad_medida_id;
      if (stock_actual !== undefined) updateData.stock_actual = parseFloat(stock_actual);
      if (stock_minimo !== undefined) updateData.stock_minimo = parseFloat(stock_minimo);
      if (stock_maximo !== undefined) updateData.stock_maximo = parseFloat(stock_maximo) || null;
      if (costo_unitario !== undefined) updateData.costo_unitario = parseFloat(costo_unitario);
      if (proveedor_principal_id !== undefined) updateData.proveedor_principal_id = proveedor_principal_id || null;
      
      updateData.updated_at = new Date();

      await db('insumos').where('id', id).update(updateData);

      console.log(`✅ Insumo ${id} actualizado`);

      return res.json({
        success: true,
        message: 'Insumo actualizado exitosamente',
      });
    } catch (err) {
      console.error('❌ Error en actualizarInsumo:', err.message);
      return res.status(500).json({
        error: 'Error al actualizar insumo',
        message: err.message,
      });
    }
  }

  // Actualizar stock (entrada o salida)
  static async actualizarStock(req, res) {
    try {
      const { id } = req.params;
      const { cantidad, tipo } = req.body; // tipo: 'entrada' o 'salida'

      if (!cantidad || !tipo) {
        return res.status(400).json({
          error: 'Cantidad y tipo son requeridos',
        });
      }

      const insumo = await db('insumos').where('id', id).first();

      if (!insumo) {
        return res.status(404).json({ error: 'Insumo no encontrado' });
      }

      let nuevoStock = insumo.stock_actual;

      if (tipo === 'entrada') {
        nuevoStock += parseFloat(cantidad);
      } else if (tipo === 'salida') {
        nuevoStock -= parseFloat(cantidad);

        if (nuevoStock < 0) {
          return res.status(400).json({
            error: 'Stock insuficiente para salida',
          });
        }
      } else {
        return res.status(400).json({
          error: 'Tipo debe ser "entrada" o "salida"',
        });
      }

      await db('insumos').where('id', id).update({
        stock_actual: nuevoStock,
        updated_at: new Date(),
      });

      console.log(`✅ Stock de insumo ${id} actualizado: ${tipo} de ${cantidad}`);

      return res.json({
        success: true,
        message: 'Stock actualizado exitosamente',
        nuevo_stock: nuevoStock,
      });
    } catch (err) {
      console.error('❌ Error en actualizarStock:', err.message);
      return res.status(500).json({
        error: 'Error al actualizar stock',
        message: err.message,
      });
    }
  }

  // Desactivar insumo (soft delete)
  static async eliminarInsumo(req, res) {
    try {
      const { id } = req.params;

      const insumo = await db('insumos').where('id', id).first();

      if (!insumo) {
        return res.status(404).json({ error: 'Insumo no encontrado' });
      }

      await db('insumos').where('id', id).update({
        activo: false,
        deleted_at: new Date(),
      });

      console.log(`✅ Insumo ${id} desactivado`);

      return res.json({
        success: true,
        message: 'Insumo eliminado exitosamente',
      });
    } catch (err) {
      console.error('❌ Error en eliminarInsumo:', err.message);
      return res.status(500).json({
        error: 'Error al eliminar insumo',
        message: err.message,
      });
    }
  }

  // Obtener unidades de medida
  static async getUnidadesMedida(req, res) {
    try {
      const unidades = await db('unidad_medida')
        .select('*')
        .orderBy('nombre', 'asc');

      return res.json({
        success: true,
        data: unidades,
      });
    } catch (err) {
      console.error('❌ Error en getUnidadesMedida:', err.message);
      return res.status(500).json({
        error: 'Error al obtener unidades de medida',
        message: err.message,
      });
    }
  }

  // Obtener proveedores
  static async getProveedores(req, res) {
    try {
      const proveedores = await db('proveedores')
        .select('*')
        .where('activo', true)
        .orderBy('nombre', 'asc');

      return res.json({
        success: true,
        data: proveedores,
      });
    } catch (err) {
      console.error('❌ Error en getProveedores:', err.message);
      return res.status(500).json({
        error: 'Error al obtener proveedores',
        message: err.message,
      });
    }
  }

  // Crear nuevo proveedor
  static async crearProveedor(req, res) {
    try {
      const { nombre, contacto, email, telefono, direccion } = req.body;

      if (!nombre || !nombre.trim()) {
        return res.status(400).json({ error: 'El nombre del proveedor es requerido' });
      }

      const proveedor = await db('proveedores').insert({
        nombre: nombre.trim(),
        contacto: contacto || null,
        email: email || null,
        telefono: telefono || null,
        direccion: direccion || null,
        activo: true,
      }).returning('*');

      return res.json({
        success: true,
        data: proveedor[0],
      });
    } catch (err) {
      console.error('❌ Error en crearProveedor:', err.message);
      return res.status(500).json({
        error: 'Error al crear proveedor',
        message: err.message,
      });
    }
  }
}

module.exports = InsumosController;
