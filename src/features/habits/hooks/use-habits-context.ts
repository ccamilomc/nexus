import { useToday } from '@/core/time'
import type { DailyContext } from '@/decision-engine'

import { useHabitsToday } from './use-habits'

/** Parte del contexto diario que aportan los hábitos. */
export interface HabitsContext {
  readonly isPending: boolean
  readonly habits: DailyContext['habits']
}

/**
 * Lo que el Decision Engine necesita saber de hábitos.
 *
 * Devuelve **datos**, no frases: el motor razona con ellos. Es el contrato
 * hermano de `useHabitsSummary`, que devuelve texto para el dashboard.
 */
export function useHabitsContext(): HabitsContext {
  const today = useToday()
  const { data, isPending } = useHabitsToday(today)

  const habits = data ?? []

  return {
    isPending,
    habits: {
      total: habits.length,
      done: habits.filter((entry) => entry.isDoneToday).length,
    },
  }
}
