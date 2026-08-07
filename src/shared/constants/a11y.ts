/**
 * Amplía el área pulsable a 44 px de alto sin agrandar lo que se ve.
 *
 * Nexus se usa en el gimnasio, con el móvil en la mano y prisa: la regla del
 * proyecto son **44 px** de objetivo táctil (docs/11), bastante por encima de
 * los 24 que exige la WCAG 2.2. Pero estirar de verdad un enlace de texto hasta
 * 44 px abre un hueco enorme donde el diseño pedía una línea, así que se hace lo
 * mismo que el botón `iconSm`: un pseudo-elemento invisible.
 *
 * A diferencia de `iconSm`, que es un cuadrado de 44 px para un icono, éste
 * cubre **todo el ancho** del elemento y sólo corrige el alto, que es lo que se
 * queda corto en un enlace de texto.
 *
 * **No usarlo en controles adyacentes:** las áreas invisibles se solaparían y se
 * pulsaría el que no era. Ahí los controles se agrandan de verdad.
 */
export const WIDE_TAP_AREA =
  "relative after:absolute after:inset-x-0 after:top-1/2 after:h-11 after:-translate-y-1/2 after:content-['']"
