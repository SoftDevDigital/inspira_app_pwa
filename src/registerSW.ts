/**
 * Registro del Service Worker para la PWA de Inspira.
 *
 * - Registra `/sw.js` cuando el navegador lo soporta.
 * - Detecta nuevas versiones del service worker y avisa para refrescar.
 * - Es seguro en desarrollo y producción (vite-plugin-pwa genera el sw.js).
 */

export function registerServiceWorker(): void {
  // Solo registramos si el navegador soporta service workers.
  if (!('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    const swUrl = `${import.meta.env.BASE_URL ?? '/'}sw.js`.replace('//sw.js', '/sw.js');

    navigator.serviceWorker
      .register(swUrl, {scope: import.meta.env.BASE_URL ?? '/'})
      .then((registration) => {
        // Comprobamos actualizaciones periódicamente (cada hora).
        const ONE_HOUR = 60 * 60 * 1000;
        setInterval(() => {
          registration.update().catch(() => {
            /* sin conexión: se reintentará más tarde */
          });
        }, ONE_HOUR);

        // Cuando se encuentra un SW nuevo en instalación.
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) {
            return;
          }
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // Hay una versión nueva disponible; pedimos activarla.
              newWorker.postMessage({type: 'SKIP_WAITING'});
            }
          });
        });
      })
      .catch((error) => {
        console.error('Error al registrar el Service Worker:', error);
      });

    // Cuando el nuevo SW toma el control, recargamos una sola vez
    // para que el usuario reciba la última versión de la app.
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) {
        return;
      }
      refreshing = true;
      window.location.reload();
    });
  });
}
