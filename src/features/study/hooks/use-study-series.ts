import { type SeriesQuery, useSeriesQuery } from '@/shared/hooks'
import { dateRangeKey, type DayRange } from '@/shared/utils'

import { studyService } from '../services/study.service'
import type { StudyPeriodSeries } from '../types/study.types'
import { studyKeys } from './study.keys'

/** Lo que Analytics necesita saber del estudio en un periodo. */
export type StudySeries = SeriesQuery<StudyPeriodSeries>

/**
 * La serie de estudio de un periodo.
 *
 * Tercer contrato del dominio, junto a `useStudySummary` (frases, para el
 * dashboard) y `useStudyContext` (datos del día, para el motor).
 */
export function useStudySeries(
  range: DayRange,
  previousRange: DayRange,
  days: readonly Date[],
  previousDays: readonly Date[],
): StudySeries {
  return useSeriesQuery({
    queryKey: (userId) => studyKeys.series(userId, dateRangeKey(days), dateRangeKey(previousDays)),
    fetch: (userId) => studyService.getSeries(userId, range, previousRange, days, previousDays),
  })
}
