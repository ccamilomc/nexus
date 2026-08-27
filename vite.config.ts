/// <reference types="vitest/config" />
import path from 'node:path'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // `prompt` y no `autoUpdate`: el diseño pide **actualizaciones
      // controladas** (docs/13). Recargar por sorpresa a media serie del
      // gimnasio, o con un formulario a medio llenar, se lleva por delante lo
      // que el usuario estaba haciendo. Se avisa y decide él.
      registerType: 'prompt',
      // El icono y el manifiesto tienen que llegar al navegador aunque el
      // service worker aún no exista.
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'icons/maskable.svg'],
      manifest: {
        name: 'Nexus',
        short_name: 'Nexus',
        description: 'Tu sistema operativo personal: entrenamiento, nutrición, hábitos y más.',
        lang: 'es',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        // Retrato: la aplicación es mobile-first y ninguna pantalla gana nada
        // en horizontal.
        orientation: 'portrait',
        // El mismo negro que `--background` en globals.css, hsl(250 18% 5%).
        // Antes aquí había un negro distinto y la pantalla de arranque
        // parpadeaba: se pintaba un fondo y al segundo otro.
        background_color: '#0B0A0F',
        theme_color: '#0B0A0F',
        icons: [
          { src: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          // El SVG cubre los tamaños grandes sin arrastrar más binarios: escala
          // a cualquier resolución sin perder nitidez.
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          {
            src: '/icons/maskable.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // El cascarón de la aplicación se precachea entero: es lo que permite
        // abrirla sin señal. Los datos ya los guarda la caché de TanStack
        // Query en `localStorage` (ADR-0007), así que aquí no se tocan.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        /**
         * Las ilustraciones de los ejercicios **no** se precachean.
         *
         * Son 5,3 MB y entran en `**\/*.svg` sin querer, así que sin esta línea
         * el teléfono se las descargaría **todas** al instalar la aplicación
         * —incluidas las de los ejercicios que ese usuario no hace— antes de
         * poder usarla. El cascarón entero pesa hoy menos de 1 MB.
         *
         * Se guardan al verlas, con la regla de abajo: la primera vez cuestan
         * una descarga y a partir de ahí están también sin señal, que es lo
         * mismo que se consigue precacheando pero pagando sólo por lo que se usa.
         */
        globIgnores: ['**/ilustraciones/**'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/ilustraciones/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'ilustraciones-de-ejercicios',
              // Un dibujo de un ejercicio no cambia: si alguna vez cambia, lo
              // hace con otro despliegue y otro nombre de archivo.
              expiration: { maxEntries: 240, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
        // Nada de interceptar las llamadas a Supabase: servir datos de salud
        // caducados desde el service worker, sin que nadie lo controle, es
        // justo lo que se quiso evitar al persistir la caché por usuario.
        navigateFallbackDenylist: [/^\/api/],
      },
      devOptions: {
        // Desactivado en desarrollo: un service worker cacheando mientras se
        // programa hace perder horas persiguiendo cambios que sí estaban.
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    // Media jornada de Nexus se apoya en la fecha **local** (un hábito se cumple
    // «el martes», no a las 21:04 UTC; ver docs/04-modelo-de-datos.md). Fijar la
    // zona horaria hace que los tests midan lo mismo aquí y en CI, que corre en
    // UTC: sin esto, un fallo de zona horaria sólo aparecería en producción.
    env: { TZ: 'America/Bogota' },
  },
})
