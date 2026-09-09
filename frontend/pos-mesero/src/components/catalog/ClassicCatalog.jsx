import React from 'react';
import { IconClock } from '../Icons';
import { formatMoney } from '../../utils/formatters';

export default function ClassicCatalog({
  categorias,
  productos,
  categoriaSeleccionada,
  onSelectCategoria,
  onSelectProducto,
}) {
  return (
    <div>
      <div className="orden-categoria-filter">
        {categorias.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`orden-categoria-btn ${categoriaSeleccionada === cat.id ? 'is-active' : ''}`}
            onClick={() => onSelectCategoria(cat.id)}
          >
            {cat.nombre}
          </button>
        ))}
      </div>

      <div className="orden-productos-grid">
        {productos.length > 0 ? (
          productos.map((producto) => (
            <div
              key={producto.id}
              className="orden-producto"
              onClick={() => onSelectProducto(producto)}
              role="button"
              tabIndex={0}
            >
              <h3 className="orden-producto__nombre">{producto.nombre}</h3>
              {producto.descripcion && (
                <p className="orden-producto__desc">{producto.descripcion}</p>
              )}

              {producto.stock_disponible === null ? (
                <span className="rb-badge rb-badge--neutral">Sin receta</span>
              ) : producto.stock_disponible <= 0 ? (
                <span className="rb-badge rb-badge--danger">Agotado</span>
              ) : (
                <span className="rb-badge rb-badge--success">
                  Disponible: {producto.stock_disponible}
                </span>
              )}

              <div className="orden-producto__meta">
                <span className="orden-producto__precio">
                  {formatMoney(producto.precio_venta)}
                </span>
                {producto.tiempo_preparacion && (
                  <span className="orden-producto__tiempo">
                    <IconClock /> {producto.tiempo_preparacion}min
                  </span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="rb-alert rb-alert--warning" style={{ gridColumn: '1 / -1' }}>
            No hay productos en esta categoría
          </div>
        )}
      </div>
    </div>
  );
}
