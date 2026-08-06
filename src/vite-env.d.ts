/// <reference types="vite/client" />
// Tipos del módulo virtual `virtual:pwa-register/react`, que genera
// vite-plugin-pwa en tiempo de compilación y no existe como archivo.
/// <reference types="vite-plugin-pwa/react" />

// ─── Instalación (A2HS) ─────────────────────────────────────────────────────
// Nada de esto está en la librería de tipos del DOM: la instalación de una PWA
// no llegó a ser estándar y cada motor puso lo suyo. Se declara aquí, tipado de
// verdad, en lugar de forzar los tipos en el sitio donde se usa.

/**
 * El aviso con el que Chromium ofrece instalar la aplicación.
 *
 * Sólo existe en Chromium (Chrome, Edge, Samsung Internet…). Ni Firefox ni
 * Safari lo disparan nunca, así que ningún código puede darlo por hecho.
 */
interface BeforeInstallPromptEvent extends Event {
  /** Enseña el diálogo del navegador. **Se gasta al usarlo**: sólo una vez. */
  prompt: () => Promise<void>
  readonly userChoice: Promise<{ readonly outcome: 'accepted' | 'dismissed' }>
}

interface WindowEventMap {
  beforeinstallprompt: BeforeInstallPromptEvent
  appinstalled: Event
}

interface Navigator {
  /**
   * Sólo en iOS: si la página se abrió desde la pantalla de inicio. Es la única
   * forma de saberlo allí, porque Safari no implementa `display-mode`.
   */
  readonly standalone?: boolean
}
