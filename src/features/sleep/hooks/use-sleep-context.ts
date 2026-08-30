import { useToday } from '@/core/time'
import type { DailyContext } from '@/decision-engine'

import { useLastNight, useSleepGoal, useTypicalSleep } from './use-sleep'

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
  const typical = useTypicalSleep(today)

  return {
    isPending: isPending || goal.isPending || typical.isPending,
    sleep: {
      ...(data ? { lastNightMinutes: data.duration_minutes } : {}),
      // Lo normal en él, para que el motor compare contra la persona y no
      // contra una constante. Va sin envolver: el motor recibe el resultado,
      // no la estadística.
      ...(typical.data
        ? { typicalMinutes: { value: Math.round(typical.data.typical), days: typical.data.days } }
        : {}),
    },
    targetMinutes: goal.data?.target_minutes,
  }
}
