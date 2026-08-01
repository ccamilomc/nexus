/**
 * Series diarias: la forma en que los dominios entregan su historia a Analytics.
 *
 * La regla que gobierna todo este archivo: **un hueco no es un cero**. Un día sin
 * registro de sueño no significa que se durmiera cero minutos, significa que no
 * se sabe. Confundirlos hace que las medias mientan —treinta días con cinco
 * noches apuntadas darían una media de sueño ridícula— y Nexus no muestra
 * números que no puede sostener.
 */

/** Un día de una serie. `value` es `null` cuando ese día no hubo registro. */
export interface SeriesPoint {
  /** Día local en `YYYY-MM-DD`. */
  readonly dateKey: string
  readonly value: number | null
}

/**
 * Serie continua para `days`, tomando los valores de `valueByDateKey`.
 *
 * Continua a propósito: los días sin dato entran como `null` en lugar de
 * desaparecer. Si se omitieran, una gráfica uniría el lunes con el viernes en
 * una línea recta y aparentaría constancia donde hubo un hueco de cuatro días.
 */
export function buildDailySeries(
  days: readonly Date[],
  valueByDateKey: ReadonlyMap<string, number>,
  toKey: (date: Date) => string,
): readonly SeriesPoint[] {
  return days.map((day) => {
    const dateKey = toKey(day)
    const value = valueByDateKey.get(dateKey)

    return { dateKey, value: value === undefined ? null : value }
  })
}

/**
 * Suma de la serie.
 *
 * Aquí los huecos sí valen cero: para «cuánto entrenaste este mes» un día sin
 * entrenar no suma, y eso es exactamente lo que se quiere contar.
 */
export function seriesTotal(points: readonly SeriesPoint[]): number {
  return points.reduce((total, { value }) => total + (value ?? 0), 0)
}

/**
 * Media **sobre los días con registro**; `null` si no hay ninguno.
 *
 * El denominador son los días con dato, no los del periodo: es la respuesta a
 * «cuánto dormiste las noches que apuntaste», que es lo único que los datos
 * permiten afirmar.
 */
export function seriesAverage(points: readonly SeriesPoint[]): number | null {
  const logged = points.filter(
    (point): point is SeriesPoint & { value: number } => point.value !== null,
  )
  if (logged.length === 0) return null

  return logged.reduce((total, { value }) => total + value, 0) / logged.length
}

/** Cuántos días del periodo tienen registro. */
export function countDaysWithData(points: readonly SeriesPoint[]): number {
  return points.reduce((count, { value }) => (value === null ? count : count + 1), 0)
}
