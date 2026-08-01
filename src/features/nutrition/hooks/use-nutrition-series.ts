import { type SeriesQuery, useSeriesQuery } from '@/shared/hooks'
import { dateRangeKey, type DayRange } from '@/shared/utils'

import { nutritionService } from '../services/nutrition.service'
import type { NutritionPeriodSeries } from '../types/nutrition.types'
import { nutritionKeys } from './nutrition.keys'

/** Lo que Analytics necesita saber de la nutrición en un periodo. */
export type NutritionSeries = SeriesQuery<NutritionPeriodSeries>

/**
 * La serie de nutrición de un periodo.
 *
 * Tercer contrato del dominio, junto a `useNutritionSummary` (frases, para el
 * dashboard) y `useNutritionContext` (datos del día, para el motor).
 */
export function useNutritionSeries(
  range: DayRange,
  previousRange: DayRange,
  days: readonly Date[],
  previousDays: readonly Date[],
): NutritionSeries {
  return useSeriesQuery({
    queryKey: (userId) =>
      nutritionKeys.series(userId, dateRangeKey(days), dateRangeKey(previousDays)),
    fetch: (userId) => nutritionService.getSeries(userId, range, previousRange, days, previousDays),
  })
}
