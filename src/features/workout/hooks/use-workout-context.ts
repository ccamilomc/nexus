import type { DailyContext } from '@/decision-engine'

import { useSessionHistory } from './use-session-history'

/** Parte del contexto diario que aporta entrenamiento. */
export interface WorkoutContext {
  readonly isPending: boolean
  readonly workout: DailyContext['workout']
}

/** Clave de día local (`YYYY-MM-DD`) de un instante ISO. */
function toDateKey(iso: string): string {
  const date = new Date(iso)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${date.getFullYear()}-${month}-${day}`
}

/**
 * Lo que el Decision Engine necesita saber de entrenamiento.
 *
 * Devuelve **datos**, no frases: el motor razona con ellos (ver
 * docs/06-decision-engine-e-ia.md). Es el contrato hermano de
 * `useWorkoutSummary`, que sí devuelve texto porque lo consume una pantalla.
 */
export function useWorkoutContext(): WorkoutContext {
  const { data, isPending } = useSessionHistory()

  return {
    isPending,
    workout: {
      recentSessions: (data ?? []).map(({ session, stats }) => ({
        id: session.id,
        date: toDateKey(session.started_at),
        durationMinutes: stats.durationMinutes ?? 0,
        ...(session.perceived_effort === null ? {} : { perceivedEffort: session.perceived_effort }),
      })),
    },
  }
}
