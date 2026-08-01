import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/core/auth'
import type { AppError } from '@/core/error'
import { dateRangeKey } from '@/shared/utils'

import { sleepService } from '../services/sleep.service'
import type { SleepPeriodSeries } from '../types/sleep.types'
import { sleepKeys } from './use-sleep'

/** Lo que Analytics necesita saber del sueño en un periodo. */
export interface SleepSeries {
  readonly isPending: boolean
  readonly isError: boolean
  readonly errorMessage: string | null
  readonly retry: () => void
  readonly data: SleepPeriodSeries | null
}

/**
 * La serie de sueño de un periodo.
 *
 * Tercer contrato del dominio, junto a `useSleepSummary` (frases, para el
 * dashboard) y `useSleepContext` (datos del día, para el motor). Éste devuelve
 * la **historia** del periodo, que es lo que Analytics dibuja.
 */
export function useSleepSeries(days: readonly Date[], previousDays: readonly Date[]): SleepSeries {
  const { user } = useAuth()
  const userId = user?.id

  const query = useQuery<SleepPeriodSeries | null, AppError>({
    queryKey: sleepKeys.series(userId, dateRangeKey(days), dateRangeKey(previousDays)),
    queryFn: () => (userId ? sleepService.getSeries(userId, days, previousDays) : null),
  })

  return {
    isPending: query.isPending,
    isError: query.isError,
    errorMessage: query.error?.message ?? null,
    retry: () => void query.refetch(),
    data: query.data ?? null,
  }
}
