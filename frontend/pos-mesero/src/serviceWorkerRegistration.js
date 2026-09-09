// Registro del service worker (public/sw.js). Solo en producción y solo
// si el navegador lo soporta — en desarrollo se deja sin registrar para
// no cachear nada mientras se trabaja con npm start.

export function register() {
  if (process.env.NODE_ENV !== 'production') return;
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    // sw.js llama a self.skipWaiting() y clients.claim() en su propio
    // install/activate, así que una versión nueva toma control apenas
    // termina de instalarse — no hace falta coordinarlo desde aquí.
    navigator.serviceWorker
      .register('/sw.js')
      .catch((error) => {
        console.error('Error al registrar el service worker:', error);
      });
  });
}
