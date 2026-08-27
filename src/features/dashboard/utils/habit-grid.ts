import type { SeriesPoint } from '@/shared/utils'

/** Días de la semana, de lunes a domingo. */
const DAYS_PER_WEEK = 7

/** Una casilla del calendario: un día, o un hueco antes de que empiece. */
export interface HabitCell {
  /** `null` en los huecos que rellenan la primera semana. */
  readonly dateKey: string | null
  /** Porcentaje cumplido; `null` si ese día no había hábitos vigentes. */
  readonly value: number | null
}

/**
 * Coloca los días en semanas, como un calendario.
 *
 * **Cada columna es una semana y cada fila un día de la semana**, así que
 * mirando en horizontal se ve si hay un día que siempre falla —los lunes, los
 * domingos— y eso una serie de barras o un área no lo pueden enseñar: en ellas
 * los lunes quedan repartidos por todo el ancho.
 *
 * La primera semana se rellena por delante para que **cada fila sea siempre el
 * mismo día**. Sin eso, las filas se desplazarían y el patrón semanal —que es
 * justo lo que se viene a buscar— dejaría de leerse.
 *
 * `weekday` es el día de la semana de cada punto (lunes = 0), y se pasa desde
 * fuera para no volver a interpretar fechas aquí.
 */
export function buildHabitGrid(
  points: readonly SeriesPoint[],
  weekdayOf: (dateKey: string) => number,
): readonly (readonly HabitCell[])[] {
  if (points.length === 0) return []

  const cells: HabitCell[] = []

  const first = points[0]
  if (first) {
    // Huecos hasta el primer día, para que la fila 0 sea siempre lunes.
    for (let i = 0; i < weekdayOf(first.dateKey); i += 1) {
      cells.push({ dateKey: null, value: null })
    }
  }

  for (const point of points) cells.push({ dateKey: point.dateKey, value: point.value })

  const weeks: HabitCell[][] = []
  for (let i = 0; i < cells.length; i += DAYS_PER_WEEK) {
    weeks.push(cells.slice(i, i + DAYS_PER_WEEK))
  }

  return weeks
}

/**
 * En qué escalón de intensidad cae un día, de 0 a 4.
 *
 * Cinco escalones y no un degradado continuo porque **hay que distinguirlos de
 * un vistazo**: entre un 61 % y un 64 % nadie ve diferencia, y fingir que la
 * hay sólo añade ruido. El 100 % tiene su propio escalón a propósito: cerrar el
 * día completo es lo que se persigue y merece verse distinto de casi cerrarlo.
 *
 * `null` —sin hábitos ese día— no es un cero: devuelve `null` para que la
 * casilla se pinte como ausencia y no como fracaso.
 */
export function intensityOf(value: number | null): number | null {
  if (value === null) return null
  if (value <= 0) return 0
  if (value >= 100) return 4
  if (value < 34) return 1
  if (value < 67) return 2

  return 3
}
