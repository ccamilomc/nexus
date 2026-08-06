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
        background_color: '#09090b',
        theme_color: '#09090b',
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
