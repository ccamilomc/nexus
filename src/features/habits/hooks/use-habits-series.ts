import { type SeriesQuery, useSeriesQuery } from '@/shared/hooks'
import { dateRangeKey } from '@/shared/utils'

import { habitsService } from '../services/habits.service'
import type { HabitsPeriodSeries } from '../types/habits.types'
import { habitsKeys } from './use-habits'

/** Lo que Analytics necesita saber de los hábitos en un periodo. */
export type HabitsSeries = SeriesQuery<HabitsPeriodSeries>

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
  return useSeriesQuery({
    queryKey: (userId) => habitsKeys.series(userId, dateRangeKey(days), dateRangeKey(previousDays)),
    fetch: (userId) => habitsService.getSeries(userId, days, previousDays),
  })
}
