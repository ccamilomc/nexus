/**
 * Si quien mira ha pedido que las cosas se muevan lo menos posible.
 *
 * El CSS ya lo respeta por su cuenta —`globals.css` apaga las transiciones—,
 * pero eso no basta cuando el código **espera** a que una animación termine: sin
 * preguntar, quien no ve ningún movimiento se quedaría igualmente esperándolo.
 *
 * Se consulta en el momento, no se guarda: la preferencia se puede cambiar con
 * la aplicación abierta, y aquí se lee una vez por gesto.
 */
export function prefersReducedMotion(): boolean {
  // jsdom no trae `matchMedia` de serie y el arranque de los tests lo rellena,
  // pero esta función también corre en contextos sin DOM.
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
