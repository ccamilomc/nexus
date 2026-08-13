import type { PastSessionValues } from '../schemas/workout.schema'

/** Un entrenamiento pasado, situado en el tiempo. */
export interface PastSessionRange {
  readonly startedAt: string
  readonly endedAt: string
}

/**
 * Traduce «el día 12, a las 19:30, hora y cuarto» a dos instantes.
 *
 * **El fin se calcula, no se pide.** Quien apunta por la noche lo que hizo por
 * la mañana recuerda cuánto duró, no la hora exacta a la que salió del gimnasio.
 *
 * Se construye con el constructor de fecha local y no juntando cadenas: así la
 * hora que se teclea es la del reloj de quien la escribe, y no la de un huso
 * que la aplicación decida por su cuenta.
 *
 * Devuelve `null` si la fecha o la hora no se entienden, en vez de inventar un
 * instante: apuntar un entrenamiento en 1970 sería peor que no apuntarlo.
 */
export function toPastSessionRange(values: PastSessionValues): PastSessionRange | null {
  const [year, month, day] = values.date.split('-').map(Number)
  const [hours, minutes] = values.startTime.split(':').map(Number)

  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    hours === undefined ||
    minutes === undefined ||
    [year, month, day, hours, minutes].some(Number.isNaN)
  ) {
    return null
  }

  const started = new Date(year, month - 1, day, hours, minutes, 0, 0)
  if (Number.isNaN(started.getTime())) return null

  const ended = new Date(started.getTime() + values.durationMinutes * 60_000)

  return { startedAt: started.toISOString(), endedAt: ended.toISOString() }
}
