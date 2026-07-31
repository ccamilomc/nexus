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
  bedtime: time,
  wakeTime: time,
  qualityRating: z.number().int().min(1).max(5).optional(),
})

export type LogSleepValues = z.infer<typeof logSleepSchema>
