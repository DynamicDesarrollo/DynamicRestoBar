import React from 'react';

export default function AurumSidebar({ categorias, categoriaSeleccionada, onSelectCategoria }) {
  return (
    <nav className="aurum-sidebar">
      {categorias.map((cat) => (
        <button
          key={cat.id}
          type="button"
          className={`aurum-sidebar__item ${categoriaSeleccionada === cat.id ? 'is-active' : ''}`}
          onClick={() => onSelectCategoria(cat.id)}
        >
          {cat.icono_url ? (
            <img className="aurum-sidebar__icon" src={cat.icono_url} alt="" />
          ) : (
            <span className="aurum-sidebar__icon aurum-sidebar__icon--fallback">
              {cat.nombre?.charAt(0)?.toUpperCase()}
            </span>
          )}
          {cat.nombre}
        </button>
      ))}
    </nav>
  );
}
