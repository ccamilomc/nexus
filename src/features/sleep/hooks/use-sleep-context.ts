import { useToday } from '@/core/time'
import type { DailyContext } from '@/decision-engine'

import { useLastNight, useSleepGoal } from './use-sleep'

/** Parte del contexto diario que aporta el sueño. */
export interface SleepContext {
  readonly isPending: boolean
  readonly sleep: DailyContext['sleep']
  /** Cuánto quiere dormir; `undefined` si no lo ha fijado. */
  readonly targetMinutes: number | undefined
}

/**
 * Lo que el Decision Engine necesita saber del sueño.
 *
 * Devuelve **datos**, no frases: el motor razona con ellos. Es el contrato
 * hermano de `useSleepSummary`, que devuelve texto para el dashboard.
 *
 * **El objetivo viaja aparte del sueño de anoche** porque son cosas distintas:
 * uno es lo que pasó y el otro lo que el usuario persigue. El motor los junta
 * en `goals`, igual que hace con los de nutrición y estudio.
 */
export function useSleepContext(): SleepContext {
  const today = useToday()
  const { data, isPending } = useLastNight(today)
  const goal = useSleepGoal()

  return {
    isPending: isPending || goal.isPending,
    sleep: {
      ...(data ? { lastNightMinutes: data.duration_minutes } : {}),
    },
    targetMinutes: goal.data?.target_minutes,
  }
}
