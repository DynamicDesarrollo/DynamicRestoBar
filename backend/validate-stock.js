const db = require('./src/config/database');

(async () => {
  try {
    const query = db('productos')
      .select(
        'productos.id',
        'productos.nombre',
        'productos.descripcion',
        'productos.precio_venta',
        'productos.foto_url',
        'productos.categoria_id',
        'productos.estacion_id',
        'productos.tiempo_preparacion',
        'categorias.nombre as categoria_nombre',
        'estaciones.nombre as estacion_nombre',
        db.raw(`(
            SELECT MIN(
              GREATEST(
                0,
                FLOOR(
                  (
                    COALESCE(insumos.stock_actual, 0)
                    - COALESCE(
                        (
                          SELECT SUM(oi.cantidad * ri.cantidad)
                          FROM orden_items oi
                          JOIN ordenes o ON o.id = oi.orden_id
                          JOIN recetas r ON r.producto_id = oi.producto_id AND r.activa = true
                          JOIN receta_insumos ri ON ri.receta_id = r.id
                          WHERE o.estado IN ('abierta', 'enviada_produccion', 'en_preparacion', 'lista_entrega')
                            AND ri.insumo_id = insumos.id
                        ),
                        0
                      )
                  ) / NULLIF(receta_insumos.cantidad, 0)
                )
              )
            )
            FROM receta_insumos
            JOIN recetas ON recetas.id = receta_insumos.receta_id
            JOIN insumos ON insumos.id = receta_insumos.insumo_id
            WHERE recetas.producto_id = productos.id
              AND recetas.activa = true
          ) as stock_disponible`)
      )
      .join('categorias', 'productos.categoria_id', 'categorias.id')
      .leftJoin('estaciones', 'productos.estacion_id', 'estaciones.id')
      .where('productos.deleted_at', null)
      .andWhere('productos.estado', 'activo')
      .andWhere((q) => {
        q.whereNull('productos.sede_id').orWhere('productos.sede_id', 20);
      })
      .andWhere('productos.id', 27)
      .limit(1);

    console.log('SQL:', query.toString());
    const rows = await query;
    console.log(rows);
  } catch (err) {
    console.error('ERROR', err);
  } finally {
    process.exit(0);
  }
})();
