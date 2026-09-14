/**
 * GeocodingService
 *
 * Convierte una dirección de texto libre en lat/lng usando Nominatim
 * (OpenStreetMap) — gratis, sin API key, mismo proveedor que el mapa
 * (Leaflet + OSM) que usa la app de domicilios. Nunca lanza: si falla o no
 * encuentra nada, devuelve null y quien llama sigue sin coordenadas de
 * destino (el domicilio se crea igual, solo sin pin en el mapa).
 */
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

class GeocodingService {
  static async geocodificar(direccion, contexto = 'Colombia') {
    if (!direccion) return null;
    try {
      const query = `${direccion}, ${contexto}`;
      const url = `${NOMINATIM_URL}?format=json&limit=1&countrycodes=co&q=${encodeURIComponent(query)}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(url, {
        headers: { 'User-Agent': 'DynamicRestoBar-Domicilios/1.0 (soporte@dynamicrestobar.com)' },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) return null;
      const resultados = await res.json();
      const primero = resultados?.[0];
      if (!primero) return null;
      return { latitud: Number(primero.lat), longitud: Number(primero.lon) };
    } catch (err) {
      console.error('❌ Error geocodificando dirección:', err.message);
      return null;
    }
  }
}

module.exports = GeocodingService;
