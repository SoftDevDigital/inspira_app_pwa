import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        // Usamos nuestro service worker hecho a mano (public/sw.js) y dejamos
        // que vite-plugin-pwa le inyecte la lista de precache del build.
        strategies: 'injectManifest',
        srcDir: 'public',
        filename: 'sw.js',
        // El manifest lo mantenemos como archivo estático en public/manifest.json,
        // así que desactivamos la generación automática del plugin.
        manifest: false,
        // El registro del SW lo hacemos manualmente en main.tsx.
        injectRegister: false,
        // Habilita el SW también en `vite dev` para poder probar la PWA.
        devOptions: {
          enabled: true,
          type: 'module',
        },
        injectManifest: {
          // Archivos del build que se precachean (cache-first / offline).
          globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,svg,webp,woff,woff2,json}'],
          // El bundle principal supera los 2 MiB por defecto; subimos el límite
          // para que se incluya en el precache y la app funcione offline.
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        },
      }),
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
