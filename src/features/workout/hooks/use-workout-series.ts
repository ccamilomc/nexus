import { type SeriesQuery, useSeriesQuery } from '@/shared/hooks'
import { dateRangeKey, type DayRange } from '@/shared/utils'

import { workoutService } from '../services/workout.service'
import type { WorkoutPeriodSeries } from '../types/workout.types'
import { workoutKeys } from './workout.keys'

/** Lo que Analytics necesita saber del entrenamiento en un periodo. */
export type WorkoutSeries = SeriesQuery<WorkoutPeriodSeries>

/**
 * La serie de entrenamiento de un periodo.
 *
 * Tercer contrato del dominio, junto a `useWorkoutSummary` (frases, para el
 * dashboard) y `useWorkoutContext` (datos del día, para el motor).
 */
export function useWorkoutSeries(
  range: DayRange,
  previousRange: DayRange,
  days: readonly Date[],
  previousDays: readonly Date[],
): WorkoutSeries {
  return useSeriesQuery({
    queryKey: (userId) =>
      workoutKeys.series(userId, dateRangeKey(days), dateRangeKey(previousDays)),
    fetch: (userId) => workoutService.getSeries(userId, range, previousRange, days, previousDays),
  })
}
