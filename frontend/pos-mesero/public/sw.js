/* eslint-disable no-restricted-globals */
// Service worker mínimo: solo lo necesario para que el navegador ofrezca
// "Instalar app" (PWA) y para que abrir la app con mala señal no muestre
// la pantalla de error del navegador. NO cachea nada de la API — todo
// pedido a /api/* (mesas, órdenes, caja...) siempre va directo a la red,
// nunca se sirve desde caché, porque mostrarle a un mesero datos viejos
// de mesas u órdenes sería peor que no mostrar nada.
//
// Este archivo vive en public/ (no en src/) a propósito: así se sirve tal
// cual, sin pasar por el empaquetado de webpack ni por el plugin de
// Workbox que react-scripts activa automáticamente si detecta
// src/service-worker.js — evitando esa complejidad por completo.

const CACHE_NAME = 'restobar-shell-v1';
const SHELL_URLS = ['/', '/manifest.json', '/logo192.png', '/logo512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(
        nombres
          .filter((nombre) => nombre !== CACHE_NAME)
          .map((nombre) => caches.delete(nombre))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Solo se maneja GET, mismo origen y navegación (carga de página).
  // Todo lo demás —y en particular cualquier llamada a la API— pasa de
  // largo sin tocarlo.
  const esMismoOrigen = request.url.startsWith(self.location.origin);
  if (request.method !== 'GET' || !esMismoOrigen || request.mode !== 'navigate') {
    return;
  }

  event.respondWith(
    fetch(request).catch(() => caches.match('/'))
  );
});
