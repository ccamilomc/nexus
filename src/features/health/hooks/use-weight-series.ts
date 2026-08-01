import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/core/auth'
import type { AppError } from '@/core/error'
import { dateRangeKey, type DayRange } from '@/shared/utils'

import { healthService } from '../services/health.service'
import type { WeightPeriodSeries } from '../types/health.types'
import { healthKeys } from './use-health'

/** Lo que Analytics necesita saber del peso en un periodo. */
export interface WeightSeries {
  readonly isPending: boolean
  readonly isError: boolean
  readonly errorMessage: string | null
  readonly retry: () => void
  readonly data: WeightPeriodSeries | null
}

/**
 * La serie de peso de un periodo.
 *
 * A diferencia del resto de dominios no recibe tramo anterior: aquí no hay
 * comparativa que hacer, porque Salud no opina sobre el peso.
 */
export function useWeightSeries(range: DayRange, days: readonly Date[]): WeightSeries {
  const { user } = useAuth()
  const userId = user?.id

  const query = useQuery<WeightPeriodSeries | null, AppError>({
    queryKey: healthKeys.weightSeries(userId, dateRangeKey(days)),
    queryFn: () => (userId ? healthService.getWeightSeries(userId, range, days) : null),
  })

  return {
    isPending: query.isPending,
    isError: query.isError,
    errorMessage: query.error?.message ?? null,
    retry: () => void query.refetch(),
    data: query.data ?? null,
  }
}
