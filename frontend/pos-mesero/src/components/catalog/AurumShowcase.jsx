import React from 'react';
import { IconClock } from '../Icons';
import { formatMoney } from '../../utils/formatters';

export default function AurumShowcase({ productos, onSelectProducto }) {
  return (
    <div className="aurum-showcase">
      {productos.length > 0 ? (
        productos.map((producto) => (
          <div
            key={producto.id}
            className="aurum-card"
            onClick={() => onSelectProducto(producto)}
            role="button"
            tabIndex={0}
          >
            {producto.foto_url ? (
              <img className="aurum-card__media" src={producto.foto_url} alt={producto.nombre} />
            ) : (
              <div className="aurum-card__media aurum-card__media--placeholder">
                {producto.nombre?.charAt(0)?.toUpperCase()}
              </div>
            )}
            <div className="aurum-card__body">
              <h3 className="aurum-card__nombre">{producto.nombre}</h3>
              {producto.descripcion && (
                <p className="aurum-card__desc">{producto.descripcion}</p>
              )}

              {producto.stock_disponible === null ? (
                <span className="aurum-card__badge aurum-card__badge--neutral">Sin receta</span>
              ) : producto.stock_disponible <= 0 ? (
                <span className="aurum-card__badge aurum-card__badge--danger">Agotado</span>
              ) : (
                <span className="aurum-card__badge aurum-card__badge--success">
                  Disponible: {producto.stock_disponible}
                </span>
              )}

              <div className="aurum-card__meta">
                <span className="aurum-card__precio">{formatMoney(producto.precio_venta)}</span>
                {producto.tiempo_preparacion && (
                  <span className="aurum-card__tiempo">
                    <IconClock /> {producto.tiempo_preparacion}min
                  </span>
                )}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="aurum-showcase__empty">No hay productos en esta categoría</div>
      )}
    </div>
  );
}
