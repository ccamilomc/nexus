import { useToday } from '@/core/time'
import { formatMinutes } from '@/shared/utils'

import { useSessionHistory } from './use-session-history'

/**
 * Resumen de entrenamiento para otras pantallas (el dashboard).
 *
 * Devuelve frases ya formadas, no datos crudos: el módulo decide **cómo se
 * cuenta lo suyo** y quien lo muestra sólo lo coloca. Mismo contrato que
 * nutrición, hábitos y estudio.
 */
export interface WorkoutSummary {
  readonly isPending: boolean
  /** No se ha entrenado hoy. */
  readonly isEmpty: boolean
  readonly lines: readonly string[]
}

/** Clave de día local (`YYYY-MM-DD`) de un instante ISO. */
function toDateKey(iso: string): string {
  const date = new Date(iso)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${date.getFullYear()}-${month}-${day}`
}

export function useWorkoutSummary(): WorkoutSummary {
  const today = useToday()
  const { data, isPending } = useSessionHistory()

  const todayKey = toDateKey(today.toISOString())
  const todaySessions = (data ?? []).filter(
    ({ session }) => toDateKey(session.started_at) === todayKey,
  )

  const setCount = todaySessions.reduce((total, { stats }) => total + stats.setCount, 0)
  const minutes = todaySessions.reduce(
    (total, { stats }) => total + (stats.durationMinutes ?? 0),
    0,
  )

  const lines =
    todaySessions.length === 0
      ? []
      : [
          `${todaySessions.length} ${todaySessions.length === 1 ? 'entrenamiento' : 'entrenamientos'} hoy`,
          `${setCount} ${setCount === 1 ? 'serie' : 'series'} · ${formatMinutes(minutes)}`,
        ]

  return { isPending, isEmpty: !isPending && todaySessions.length === 0, lines }
}
