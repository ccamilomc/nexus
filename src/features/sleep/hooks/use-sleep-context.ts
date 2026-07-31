import { useToday } from '@/core/time'
import type { DailyContext } from '@/decision-engine'

import { useLastNight } from './use-sleep'

/** Parte del contexto diario que aporta el sueño. */
export interface SleepContext {
  readonly isPending: boolean
  readonly sleep: DailyContext['sleep']
}

/**
 * Lo que el Decision Engine necesita saber del sueño.
 *
 * Devuelve **datos**, no frases: el motor razona con ellos. Es el contrato
 * hermano de `useSleepSummary`, que devuelve texto para el dashboard.
 */
export function useSleepContext(): SleepContext {
  const today = useToday()
  const { data, isPending } = useLastNight(today)

  return {
    isPending,
    sleep: {
      ...(data ? { lastNightMinutes: data.duration_minutes } : {}),
      ...(data?.quality_rating === null || data?.quality_rating === undefined
        ? {}
        : { quality: data.quality_rating }),
    },
  }
}
