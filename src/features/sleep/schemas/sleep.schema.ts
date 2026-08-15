import { z } from 'zod'

/** `HH:MM`, que es lo que da un `<input type="time">`. */
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

const time = z.string().regex(TIME_PATTERN, 'Usa una hora como 23:30.')

/**
 * La noche que se registra.
 *
 * Se piden las horas y no la duración: uno recuerda a qué hora se acostó y a
 * qué hora sonó el despertador, no cuántos minutos durmió. La duración la
 * calcula el servicio.
 *
 * La calidad es opcional a propósito: obligar a puntuar el sueño cada mañana
 * añade fricción a un registro que ya se hace medio dormido.
 */
export const logSleepSchema = z.object({
  /**
   * La mañana en que se despertó, en `YYYY-MM-DD`.
   *
   * Va en el formulario para poder apuntar una noche que se pasó por alto: el
   * sueño se registra al levantarse y olvidarse un par de días es lo normal.
   * Por defecto es hoy, que es el caso de casi siempre.
   */
  date: z.string().min(1, 'Elige la noche.'),
  bedtime: time,
  wakeTime: time,
  qualityRating: z.number().int().min(1).max(5).optional(),
})

export type LogSleepValues = z.infer<typeof logSleepSchema>

/** Por debajo de tres horas no es un objetivo de sueño, es un error al teclear. */
const MIN_TARGET_HOURS = 3
const MAX_TARGET_HOURS = 14

/**
 * Cuánto quieres dormir.
 *
 * **Se pide en horas y con decimales** («7,5»), porque así es como se piensa el
 * sueño; la base guarda minutos, que es su unidad. La conversión la hace el
 * servicio, igual que con el objetivo semanal de estudio.
 */
export const sleepGoalSchema = z.object({
  targetHours: z
    .number({ message: 'Escribe cuántas horas.' })
    .min(MIN_TARGET_HOURS, 'Muy poco: revisa el número.')
    .max(MAX_TARGET_HOURS, 'Eso es más de lo que cabe en una noche.'),
})

export type SleepGoalValues = z.infer<typeof sleepGoalSchema>
