/// <reference types="vitest/config" />
import path from 'node:path'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
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
