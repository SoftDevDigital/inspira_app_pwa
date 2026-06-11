/* eslint-disable no-undef */
/**
 * Service Worker de Inspira (PWA)
 * --------------------------------
 * Estrategias:
 *   - Precache: archivos del build inyectados por vite-plugin-pwa (self.__WB_MANIFEST).
 *   - Cache-first: assets estáticos (JS, CSS, imágenes, fuentes, iconos).
 *   - Network-first: navegaciones (HTML) y contenido dinámico, con fallback al caché.
 *   - Audio: las peticiones con cabecera Range (streaming de audio) pasan directo a la
 *     red (no se cachean por defecto, para no romper el "seek"/reproducción en background).
 *
 * Este archivo es la FUENTE del SW. vite-plugin-pwa (strategies: 'injectManifest')
 * reemplaza `self.__WB_MANIFEST` por la lista real de archivos del build y genera
 * el `dist/sw.js` final que se sirve en producción.
 */

const SW_VERSION = 'inspira-v1';
const PRECACHE = `precache-${SW_VERSION}`;
const STATIC_CACHE = `static-${SW_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${SW_VERSION}`;
const OFFLINE_URL = '/index.html';

// Lista de archivos precacheados, inyectada por vite-plugin-pwa en build.
// En dev (sin inyección) queda como arreglo vacío y el SW sigue funcionando.
const PRECACHE_MANIFEST = self.__WB_MANIFEST || [];
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  ...PRECACHE_MANIFEST.map((entry) => (typeof entry === 'string' ? entry : entry.url)),
];

// Extensiones que tratamos como assets estáticos (cache-first).
const STATIC_DESTINATIONS = ['style', 'script', 'worker', 'font', 'image'];
const STATIC_REGEX = /\.(?:js|css|woff2?|ttf|otf|eot|png|jpe?g|gif|svg|webp|avif|ico)$/i;

// ---------------------------------------------------------------------------
// INSTALL: precachea el shell de la app.
// ---------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PRECACHE);
      // addAll falla si alguna URL no responde; cacheamos de forma tolerante.
      await Promise.all(
        [...new Set(PRECACHE_URLS)].map(async (url) => {
          try {
            await cache.add(new Request(url, { cache: 'reload' }));
          } catch (e) {
            // Ignoramos fallos individuales para no abortar la instalación.
            console.warn('[SW] No se pudo precachear:', url, e);
          }
        })
      );
      // Activa el SW nuevo inmediatamente.
      await self.skipWaiting();
    })()
  );
});

// ---------------------------------------------------------------------------
// ACTIVATE: limpia caches de versiones anteriores y toma control.
// ---------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => ![PRECACHE, STATIC_CACHE, DYNAMIC_CACHE].includes(key))
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

// Permite que la app pida activar el SW nuevo sin recargar manualmente.
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING' || event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ---------------------------------------------------------------------------
// Helpers de estrategia.
// ---------------------------------------------------------------------------
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok && response.type === 'basic') {
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    // Sin red y sin caché: devolvemos error controlado.
    return cached || Response.error();
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    const cached = await cache.match(request);
    if (cached) return cached;
    // Fallback al shell offline para navegaciones.
    if (request.mode === 'navigate') {
      const shell = await caches.match(OFFLINE_URL);
      if (shell) return shell;
    }
    return Response.error();
  }
}

// ---------------------------------------------------------------------------
// FETCH: enruta según el tipo de petición.
// ---------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Solo gestionamos GET. POST/PUT (p. ej. Firestore writes) pasan directo.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // No interferimos con extensiones del navegador ni esquemas no http.
  if (!url.protocol.startsWith('http')) return;

  // Audio en streaming: peticiones con Range. Pasamos directo a la red para
  // no romper el seek ni la reproducción en segundo plano.
  if (request.headers.has('range')) {
    return; // el navegador maneja la petición normalmente
  }

  // Peticiones a Firebase/Firestore/Storage y APIs: network-first (dinámico).
  const isFirebase =
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('firebasestorage.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firebaseio.com');

  if (isFirebase) {
    // Las escrituras/lecturas en tiempo real deben ir siempre a la red.
    // (Solo cacheamos respuestas GET correctas como respaldo de lectura.)
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    return;
  }

  // Navegaciones (HTML): network-first con fallback al shell offline.
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    return;
  }

  // Assets estáticos: cache-first.
  const isStatic =
    STATIC_DESTINATIONS.includes(request.destination) || STATIC_REGEX.test(url.pathname);
  if (isStatic) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Resto: network-first como estrategia segura.
  event.respondWith(networkFirst(request, DYNAMIC_CACHE));
});
