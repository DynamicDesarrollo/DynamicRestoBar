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
  static async buscar(query) {
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
  }

  /**
   * Dos intentos: primero la dirección tal cual la escribieron (el
   * parámetro countrycodes=co ya acota a Colombia, no hace falta repetirlo
   * en el texto); si no encuentra nada, se reintenta agregando la ciudad de
   * la sede como contexto. Probado en vivo: repetir un mismo nombre de
   * lugar en el texto de búsqueda (ej. "...Colombia, Colombia" o
   * "...Medellín...Medellín...") hace que Nominatim no encuentre nada —
   * por eso no se concatena país/ciudad a ciegas.
   */
  static async geocodificar(direccion, ciudadSede) {
    if (!direccion) return null;
    try {
      const directo = await GeocodingService.buscar(direccion);
      if (directo) return directo;
      if (ciudadSede && !direccion.toLowerCase().includes(ciudadSede.toLowerCase().split(',')[0])) {
        return await GeocodingService.buscar(`${direccion}, ${ciudadSede}`);
      }
      return null;
    } catch (err) {
      console.error('❌ Error geocodificando dirección:', err.message);
      return null;
    }
  }
}

module.exports = GeocodingService;
