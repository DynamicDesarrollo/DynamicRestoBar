import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { domiciliosService } from '../services/api';
import './DireccionMapPreview.css';

// divIcon (no imagen) — evita el problema clásico de Leaflet con bundlers
// donde los PNG del ícono por defecto no se resuelven. Mismo estilo que el
// pin de destino de la app de conductor/seguimiento, para que se vea igual.
const iconoDestino = L.divIcon({
  className: '',
  html: '<div style="width:16px;height:16px;border-radius:50% 50% 50% 0;background:#f0958c;border:2px solid #0e0c0a;transform:rotate(-45deg);"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 16],
});

const MIN_LARGO = 6;
const ESPERA_MS = 900;

export default function DireccionMapPreview({ direccion }) {
  const [estado, setEstado] = useState('idle'); // idle | buscando | encontrada | no_encontrada
  const [coordenadas, setCoordenadas] = useState(null);
  const idPeticionRef = useRef(0);

  useEffect(() => {
    const texto = (direccion || '').trim();
    if (texto.length < MIN_LARGO) {
      setEstado('idle');
      setCoordenadas(null);
      return undefined;
    }

    setEstado('buscando');
    const miId = ++idPeticionRef.current;

    const timeout = setTimeout(async () => {
      try {
        const res = await domiciliosService.geocodificar(texto);
        if (idPeticionRef.current !== miId) return; // llegó tarde, ya hay una búsqueda más nueva
        const data = res.data?.data;
        if (data?.latitud && data?.longitud) {
          setCoordenadas(data);
          setEstado('encontrada');
        } else {
          setCoordenadas(null);
          setEstado('no_encontrada');
        }
      } catch {
        if (idPeticionRef.current !== miId) return;
        setCoordenadas(null);
        setEstado('no_encontrada');
      }
    }, ESPERA_MS);

    return () => clearTimeout(timeout);
  }, [direccion]);

  if (estado === 'idle') return null;

  return (
    <div className="direccion-map-preview">
      {estado === 'buscando' && (
        <p className="direccion-map-preview__estado">Buscando la dirección en el mapa...</p>
      )}
      {estado === 'no_encontrada' && (
        <p className="direccion-map-preview__estado direccion-map-preview__estado--aviso">
          No pudimos ubicar esta dirección en el mapa. El domiciliario igual verá el texto
          que escribiste, pero sin pin — probá agregar calle, número y barrio.
        </p>
      )}
      {estado === 'encontrada' && coordenadas && (
        <div className="direccion-map-preview__mapa">
          <MapContainer
            key={`${coordenadas.latitud}-${coordenadas.longitud}`}
            center={[coordenadas.latitud, coordenadas.longitud]}
            zoom={16}
            style={{ width: '100%', height: '100%' }}
            dragging={false}
            scrollWheelZoom={false}
            doubleClickZoom={false}
            zoomControl={false}
            attributionControl={false}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[coordenadas.latitud, coordenadas.longitud]} icon={iconoDestino} />
          </MapContainer>
        </div>
      )}
    </div>
  );
}
