import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/core/auth'
import type { AppError } from '@/core/error'
import { dateRangeKey, type DayRange } from '@/shared/utils'

import { workoutService } from '../services/workout.service'
import type { WorkoutPeriodSeries } from '../types/workout.types'
import { workoutKeys } from './workout.keys'

/** Lo que Analytics necesita saber del entrenamiento en un periodo. */
export interface WorkoutSeries {
  readonly isPending: boolean
  readonly isError: boolean
  readonly errorMessage: string | null
  readonly retry: () => void
  readonly data: WorkoutPeriodSeries | null
}

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
  const { user } = useAuth()
  const userId = user?.id

  const query = useQuery<WorkoutPeriodSeries | null, AppError>({
    queryKey: workoutKeys.series(userId, dateRangeKey(days), dateRangeKey(previousDays)),
    queryFn: () =>
      userId ? workoutService.getSeries(userId, range, previousRange, days, previousDays) : null,
  })

  return {
    isPending: query.isPending,
    isError: query.isError,
    errorMessage: query.error?.message ?? null,
    retry: () => void query.refetch(),
    data: query.data ?? null,
  }
}
