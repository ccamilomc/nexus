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

/** Iniciales de los días, con la numeración de la base (1 = lunes). */
const WEEKDAY_NAMES = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']

/**
 * Qué días toca un hábito, en una frase: «Lunes, miércoles y viernes».
 *
 * Devuelve `null` cuando es diario, para que la tarjeta pueda callar. Escribir
 * «todos los días» en cada hábito diario sería repetir en siete tarjetas algo
 * que no distingue a ninguna.
 */
export function describeWeekdays(weekdays: readonly number[] | null): string | null {
  if (!weekdays || weekdays.length === 0 || weekdays.length === 7) return null

  const nombres = [...weekdays].sort().map((day) => WEEKDAY_NAMES[day - 1] ?? '')
  const frase =
    nombres.length === 1
      ? nombres[0]
      : `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`

  return frase ? frase.charAt(0).toUpperCase() + frase.slice(1) : null
}
