import { type SeriesQuery, useSeriesQuery } from '@/shared/hooks'
import { dateRangeKey, type DayRange } from '@/shared/utils'

import { healthService } from '../services/health.service'
import type { WeightPeriodSeries } from '../types/health.types'
import { healthKeys } from './use-health'

/** Lo que Analytics necesita saber del peso en un periodo. */
export type WeightSeries = SeriesQuery<WeightPeriodSeries>

/**
 * La serie de peso de un periodo.
 *
 * A diferencia del resto de dominios no recibe tramo anterior: aquí no hay
 * comparativa que hacer, porque Salud no opina sobre el peso.
 */
export function useWeightSeries(range: DayRange, days: readonly Date[]): WeightSeries {
  return useSeriesQuery({
    queryKey: (userId) => healthKeys.weightSeries(userId, dateRangeKey(days)),
    fetch: (userId) => healthService.getWeightSeries(userId, range, days),
  })
}
