import { useToday } from '@/core/time'
import type { DomainSummaryData } from '@/shared/types'
import { formatMinutes, toDateKey, toDateKeyFromIso } from '@/shared/utils'

import { useSessionHistory } from './use-session-history'

/**
 * Resumen de entrenamiento para otras pantallas (el dashboard).
 *
 * Devuelve frases ya formadas, no datos crudos: el módulo decide **cómo se
 * cuenta lo suyo** y quien lo muestra sólo lo coloca. Mismo contrato que
 * nutrición, hábitos y estudio.
 */
export type WorkoutSummary = DomainSummaryData

export function useWorkoutSummary(): WorkoutSummary {
  const today = useToday()
  const { data, isPending } = useSessionHistory()

  const todayKey = toDateKey(today)
  const todaySessions = (data ?? []).filter(
    ({ session }) => toDateKeyFromIso(session.started_at) === todayKey,
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

  // Sin barra: entrenar no tiene una meta diaria contra la que avanzar. Un día
  // sin gimnasio puede ser justo lo que tocaba.
  return { isPending, isEmpty: !isPending && todaySessions.length === 0, lines, progress: [] }
}
