import { createAppError } from '@/core/error'
import { parseDateKey, toLoggedAt } from '@/shared/utils'

import type { LogStudyValues } from '../schemas/study.schema'
import type { LogStudyInput } from '../types/study.types'

const MS_PER_MINUTE = 60_000

/**
 * Arma una sesión de estudio lista para enviarse **o para esperar a que haya red**.
 *
 * Se pide la duración, no las horas: quien registra después de estudiar recuerda
 * «hora y media», no el minuto exacto en que empezó. La sesión se coloca **hacia
 * atrás desde el final del día elegido**: si es hoy, desde ahora; si ya pasó,
 * desde su mediodía, la misma regla que usan salud, nutrición y sueño para lo
 * que se apunta tarde.
 *
 * **Antes se colgaba siempre de `new Date()`**, así que una tarde de estudio sin
 * registrar no había forma de recuperarla: al apuntarla al día siguiente se
 * sumaba al día equivocado.
 *
 * El id entra por parámetro para que la función sea pura: lo genera quien llama.
 */
export function buildLogStudyInput(params: {
  readonly id: string
  readonly userId: string
  readonly values: LogStudyValues
  readonly now: Date
}): LogStudyInput {
  const { id, userId, values, now } = params

  const day = parseDateKey(values.date)
  if (Number.isNaN(day.getTime())) {
    throw createAppError('validation', 'Revisa el día: no se entiende.')
  }

  const endedAt = new Date(toLoggedAt(day, now))
  const startedAt = new Date(endedAt.getTime() - values.minutes * MS_PER_MINUTE)

  return {
    id,
    userId,
    subjectId: values.subjectId,
    minutes: values.minutes,
    startedAt: startedAt.toISOString(),
    endedAt: endedAt.toISOString(),
    focusRating: values.focusRating,
  }
}
