import '@testing-library/jest-dom'

/**
 * `window.matchMedia` no existe en jsdom, y la aplicación lo consulta para dos
 * cosas de verdad: si se está usando instalada (`useInstallPrompt`) y si se ha
 * pedido menos movimiento (`prefersReducedMotion`).
 *
 * Se rellena aquí, en el banco de pruebas, y no con una guarda en el código de
 * la aplicación: es un hueco de jsdom, no del navegador. Por defecto **nada
 * coincide**, que es el caso normal —una pestaña, tema claro—; los tests que
 * necesiten lo contrario lo doblan ellos.
 */
if (typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string): MediaQueryList =>
    Object.assign(new EventTarget(), {
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
    })
}
