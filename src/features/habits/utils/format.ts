/** Presentación de los días de un hábito. */

/**
 * Inicial del día de la semana, en la convención española: la equis del
 * miércoles lo distingue del martes.
 *
 * No sale de `Intl` a propósito: allí el día corto es «mié», que no cabe en el
 * mini-calendario ni distingue de un vistazo.
 */
const WEEKDAY_INITIALS = ['D', 'L', 'M', 'X', 'J', 'V', 'S']

export function weekdayInitial(date: Date): string {
  return WEEKDAY_INITIALS[date.getDay()] ?? '?'
}

/** «29 de julio», para que el lector de pantalla no deletree la clave. */
export function formatDayAndMonth(date: Date): string {
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })
}
