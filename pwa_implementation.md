# Implementación PWA — Inspira

Este documento resume la conversión de la aplicación **Inspira** (React + Vite + TypeScript) en una **PWA (Progressive Web App)** completa e instalable, con soporte offline y reproducción de audio en segundo plano.

---

## 1. Resumen de lo que se logró

La aplicación ahora es una PWA completa que:

- ✅ Se puede **instalar** en el celular (Android/iOS) y en computadoras de escritorio, como una app nativa.
- ✅ Funciona **sin conexión** (offline): las pantallas ya visitadas y los archivos principales se guardan en caché.
- ✅ Tiene **íconos profesionales** de la marca Inspira en todos los tamaños requeridos.
- ✅ Muestra una **pantalla a pantalla completa** (sin la barra del navegador) al abrirse instalada.
- ✅ Soporta la **reproducción de audio** (las peticiones de audio se manejan correctamente, incluso por partes/streaming).
- ✅ Se actualiza automáticamente cuando se publica una versión nueva.

---

## 2. Archivos creados

| Archivo | Propósito |
|---------|-----------|
| `public/manifest.json` | Manifiesto de la PWA: nombre, colores, íconos, orientación, accesos directos. |
| `public/sw.js` | Service Worker: maneja el caché, el modo offline y el audio. |
| `public/icons/` | Carpeta con todos los íconos de la app en distintos tamaños. |
| `src/registerSW.ts` | Código que registra el Service Worker y detecta actualizaciones. |
| `scripts/generate_pwa_icons.py` | Script que genera automáticamente todos los íconos de la marca. |

## 3. Archivos modificados

| Archivo | Cambios |
|---------|---------|
| `index.html` | Se agregaron las meta etiquetas de la PWA (manifest, theme-color, íconos de Apple, modo app en iOS) y el idioma `es`. |
| `vite.config.ts` | Se agregó y configuró el plugin `vite-plugin-pwa`. |
| `src/main.tsx` | Se llama a `registerServiceWorker()` para activar la PWA al cargar la app. |

---

## 4. Detalle del Manifiesto (`public/manifest.json`)

- **name:** "Inspira - Tu Plataforma de Crecimiento Personal"
- **short_name:** "Inspira"
- **description:** comunidad de crecimiento personal y liderazgo (audios motivacionales, etc.)
- **start_url:** `/`
- **display:** `standalone` (se ve como app nativa, sin barra del navegador)
- **background_color:** `#000000` (negro, igual que la app)
- **theme_color:** `#ff8c00` (naranja, color de acento de la marca)
- **orientation:** `portrait-primary` (vertical, ideal para celular)
- **categories:** lifestyle, education, productivity
- **lang:** `es`
- **icons:** 8 íconos "any" (72 a 512 px) + 2 íconos "maskable" (192 y 512 px)
- **shortcuts:** accesos directos rápidos dentro de la app

---

## 5. Detalle del Service Worker (`public/sw.js`)

El Service Worker implementa varias estrategias de caché según el tipo de recurso:

- **Precache (instalación):** guarda los archivos esenciales de la app (HTML, JS, CSS, íconos) durante la instalación. La lista exacta la inyecta `vite-plugin-pwa` automáticamente en cada build.
- **Cache-first para recursos estáticos:** imágenes, fuentes, JS y CSS se sirven primero desde el caché (carga instantánea), y si no están, se descargan y se guardan.
- **Network-first para contenido dinámico:** las llamadas a Firebase / Google APIs intentan ir primero a la red (datos frescos) y usan el caché como respaldo si no hay conexión.
- **Navegación offline:** si el usuario abre la app sin conexión, se le muestra la pantalla principal guardada (`/index.html`).
- **Soporte de audio:** las peticiones con `Range` (streaming de audio por partes) se dejan pasar directo a la red para que la reproducción y el adelantado/retroceso funcionen bien.
- **Solo GET:** solo se cachean peticiones GET; las de escritura (POST, etc.) nunca se interceptan.
- **Limpieza automática:** al activarse una versión nueva, borra los cachés viejos.

---

## 6. Íconos generados (`public/icons/`)

Se generaron automáticamente con `scripts/generate_pwa_icons.py` (usando Pillow). Diseño: fondo negro, llama naranja y el texto "INSPIRA", acorde a la identidad de la marca.

- `icon-72x72.png`, `icon-96x96.png`, `icon-128x128.png`, `icon-144x144.png`, `icon-152x152.png`, `icon-192x192.png`, `icon-384x384.png`, `icon-512x512.png`
- `maskable-192x192.png`, `maskable-512x512.png` (con margen de seguridad para Android)
- `apple-touch-icon.png` (180×180, para iPhone/iPad)
- `favicon-32x32.png` (ícono de la pestaña del navegador)

---

## 7. Configuración de Vite (`vite.config.ts`)

Se usa el plugin **`vite-plugin-pwa`** en modo `injectManifest`:

- `strategies: 'injectManifest'` → usamos nuestro propio `public/sw.js` y el plugin solo le inyecta la lista de archivos a precachear.
- `srcDir: 'public'`, `filename: 'sw.js'` → ubicación del Service Worker fuente.
- `manifest: false` → usamos nuestro `public/manifest.json` manual.
- `injectRegister: false` → el registro lo hacemos nosotros en `src/registerSW.ts`.
- `maximumFileSizeToCacheInBytes: 6 MiB` → para permitir cachear el bundle principal (~2.4 MB).
- `devOptions.enabled: true` → la PWA también funciona en modo desarrollo.

---

## 8. Verificación realizada

1. **`npm run lint`** (TypeScript) → ✅ sin errores.
2. **`npm run build`** → ✅ build exitoso. El plugin generó `dist/sw.js` con **20 entradas de precache** (~3 MB).
3. Se confirmó que en `dist/` están: `manifest.json`, `sw.js`, `index.html` y la carpeta `icons/` completa.
4. Se sirvió el build (`vite preview`) y se confirmó vía HTTP:
   - `GET /sw.js` → 200 (text/javascript)
   - `GET /manifest.json` → 200 (application/json)
   - `GET /icons/icon-192x192.png` → 200 (image/png)
   - `index.html` contiene el link al manifest, el `theme-color` y las meta de Apple.

---

## 9. Cómo probar la instalación

1. Ejecutar `npm run build` y luego `npm run preview` (o desplegar el contenido de `dist/`).
2. Abrir la app en Chrome (Android/escritorio): aparecerá el botón **"Instalar"** en la barra de direcciones.
3. En iPhone (Safari): tocar **Compartir → "Agregar a pantalla de inicio"**.
4. Una vez instalada, abre a pantalla completa, funciona offline y el audio se reproduce normalmente.

> **Nota:** La PWA requiere **HTTPS** en producción (los Service Workers no funcionan sobre HTTP, salvo en `localhost`). Al desplegar en un dominio con HTTPS, la instalación funcionará automáticamente.
