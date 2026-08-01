import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/core/auth'
import type { AppError } from '@/core/error'
import { dateRangeKey, type DayRange } from '@/shared/utils'

import { nutritionService } from '../services/nutrition.service'
import type { NutritionPeriodSeries } from '../types/nutrition.types'
import { nutritionKeys } from './nutrition.keys'

/** Lo que Analytics necesita saber de la nutrición en un periodo. */
export interface NutritionSeries {
  readonly isPending: boolean
  readonly isError: boolean
  readonly errorMessage: string | null
  readonly retry: () => void
  readonly data: NutritionPeriodSeries | null
}

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
  const { user } = useAuth()
  const userId = user?.id

  const query = useQuery<NutritionPeriodSeries | null, AppError>({
    queryKey: nutritionKeys.series(userId, dateRangeKey(days), dateRangeKey(previousDays)),
    queryFn: () =>
      userId ? nutritionService.getSeries(userId, range, previousRange, days, previousDays) : null,
  })

  return {
    isPending: query.isPending,
    isError: query.isError,
    errorMessage: query.error?.message ?? null,
    retry: () => void query.refetch(),
    data: query.data ?? null,
  }
}
