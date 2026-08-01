import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/core/auth'
import type { AppError } from '@/core/error'
import { dateRangeKey } from '@/shared/utils'

import { habitsService } from '../services/habits.service'
import type { HabitsPeriodSeries } from '../types/habits.types'
import { habitsKeys } from './use-habits'

/** Lo que Analytics necesita saber de los hábitos en un periodo. */
export interface HabitsSeries {
  readonly isPending: boolean
  readonly isError: boolean
  readonly errorMessage: string | null
  readonly retry: () => void
  readonly data: HabitsPeriodSeries | null
}

/**
 * La serie de hábitos de un periodo.
 *
 * Tercer contrato del dominio, junto a `useHabitsSummary` (frases, para el
 * dashboard) y `useHabitsContext` (datos del día, para el motor).
 */
export function useHabitsSeries(
  days: readonly Date[],
  previousDays: readonly Date[],
): HabitsSeries {
  const { user } = useAuth()
  const userId = user?.id

  const query = useQuery<HabitsPeriodSeries | null, AppError>({
    queryKey: habitsKeys.series(userId, dateRangeKey(days), dateRangeKey(previousDays)),
    queryFn: () => (userId ? habitsService.getSeries(userId, days, previousDays) : null),
  })

  return {
    isPending: query.isPending,
    isError: query.isError,
    errorMessage: query.error?.message ?? null,
    retry: () => void query.refetch(),
    data: query.data ?? null,
  }
}
