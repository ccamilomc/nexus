import { createAppError } from '@/core/error'
import { parseDateKey } from '@/shared/utils'

import type { LogSleepValues } from '../schemas/sleep.schema'
import type { LogSleepInput } from '../types/sleep.types'
import { sleepInstants, sleepMinutes } from './sleep-time'

/**
 * Arma la noche lista para guardarse **o para esperar a que haya red**.
 *
 * Se piden las horas y no la duración, porque nadie sabe cuántos minutos
 * durmió pero todo el mundo recuerda cuándo se acostó y cuándo sonó el
 * despertador. Aquí se convierten a instantes y minutos, que es lo que guarda
 * la base, y así el registro queda **completo y serializable** antes de salir
 * (ADR-0011).
 *
 * El id entra por parámetro para que la función sea pura: lo genera quien
 * llama, y sólo se usa si la noche todavía no existía.
 */
export function buildLogSleepInput(params: {
  readonly id: string
  readonly userId: string
  readonly values: LogSleepValues
}): LogSleepInput {
  const { id, userId, values } = params

  const date = parseDateKey(values.date)
  if (Number.isNaN(date.getTime())) {
    throw createAppError('validation', 'Revisa el día: no se entiende.')
  }

  const minutes = sleepMinutes(values.bedtime, values.wakeTime)
  const instants = sleepInstants(date, values.bedtime, values.wakeTime)
  if (minutes === null || instants === null) {
    throw createAppError('validation', 'Revisa las horas: no son válidas.')
  }

  return {
    id,
    userId,
    dateKey: values.date,
    kind: values.kind,
    bedtimeIso: instants.bedtimeIso,
    wakeTimeIso: instants.wakeTimeIso,
    minutes,
    qualityRating: values.qualityRating ?? null,
  }
}
