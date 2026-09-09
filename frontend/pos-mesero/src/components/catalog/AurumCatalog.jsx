import React from 'react';
import AurumSidebar from './AurumSidebar';
import AurumShowcase from './AurumShowcase';
import './aurum-theme.css';

export default function AurumCatalog({
  categorias,
  productos,
  categoriaSeleccionada,
  onSelectCategoria,
  onSelectProducto,
}) {
  return (
    <div className="aurum-catalog">
      <AurumSidebar
        categorias={categorias}
        categoriaSeleccionada={categoriaSeleccionada}
        onSelectCategoria={onSelectCategoria}
      />
      <AurumShowcase productos={productos} onSelectProducto={onSelectProducto} />
    </div>
  );
}
