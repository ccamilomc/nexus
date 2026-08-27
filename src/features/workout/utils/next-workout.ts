import type { RoutineDaySnapshot } from '@/decision-engine'

import type { SessionDetail } from '../types/workout.types'

/** Con qué se recibe a quien abre la pestaña de entrenar. */
export interface NextWorkout {
  /** Cuándo fue el último entrenamiento; `null` si no hay ninguno. */
  readonly lastTrainedAt: string | null
  /** Días completos desde el último. `null` sin historial. */
  readonly daysSince: number | null
  /** El día de rutina que toca, si se puede saber. */
  readonly suggestedDay: RoutineDaySnapshot | null
}

const MS_PER_DAY = 86_400_000

/** Días completos entre dos instantes, contando por fecha y no por horas. */
function daysBetween(from: string, to: Date): number {
  const start = new Date(from)
  if (Number.isNaN(start.getTime())) return 0

  const a = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate())

  return Math.max(0, Math.round((b - a) / MS_PER_DAY))
}

/**
 * Con qué recibir a quien va a entrenar.
 *
 * La pantalla abría con «¿Listo para entrenar?» y nada más, teniendo guardado
 * cuándo fue la última vez y qué rutina se sigue. Las dos preguntas que uno trae
 * al llegar al gimnasio son **cuánto hace que no vengo** y **qué me toca hoy**.
 *
 * **El día que toca es el siguiente al último que se hizo**, girando la lista:
 * tras Empuje viene Tirón, y tras el último, el primero otra vez. Si el último
 * entrenamiento fue libre —sin rutina detrás— se propone el primer día, que es
 * por donde se empieza.
 *
 * No se propone nada si no hay rutinas: inventarse un plan que el usuario no ha
 * escrito sería decidir por él, y aquí Nexus sólo recuerda.
 */
export function buildNextWorkout(
  history: readonly SessionDetail[],
  routineDays: readonly RoutineDaySnapshot[],
  now: Date,
): NextWorkout {
  const last = history[0]
  const lastTrainedAt = last?.session.ended_at ?? last?.session.started_at ?? null

  if (routineDays.length === 0) {
    return {
      lastTrainedAt,
      daysSince: lastTrainedAt ? daysBetween(lastTrainedAt, now) : null,
      suggestedDay: null,
    }
  }

  // El último día de rutina que se llegó a usar, que no tiene por qué ser el del
  // último entrenamiento: entre medias puede haber sesiones libres.
  const lastRoutineDayId = history.find(({ session }) => session.routine_day_id !== null)?.session
    .routine_day_id

  const lastIndex = lastRoutineDayId
    ? routineDays.findIndex(({ id }) => id === lastRoutineDayId)
    : -1

  // Con `-1` —nunca se usó una rutina, o la que se usó ya no existe— el módulo
  // devuelve 0 y sale el primer día, que es justo lo que se quiere.
  const nextIndex = (lastIndex + 1) % routineDays.length

  return {
    lastTrainedAt,
    daysSince: lastTrainedAt ? daysBetween(lastTrainedAt, now) : null,
    suggestedDay: routineDays[nextIndex] ?? null,
  }
}
