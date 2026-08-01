import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/core/auth'
import type { AppError } from '@/core/error'
import { dateRangeKey, type DayRange } from '@/shared/utils'

import { studyService } from '../services/study.service'
import type { StudyPeriodSeries } from '../types/study.types'
import { studyKeys } from './study.keys'

/** Lo que Analytics necesita saber del estudio en un periodo. */
export interface StudySeries {
  readonly isPending: boolean
  readonly isError: boolean
  readonly errorMessage: string | null
  readonly retry: () => void
  readonly data: StudyPeriodSeries | null
}

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
  const { user } = useAuth()
  const userId = user?.id

  const query = useQuery<StudyPeriodSeries | null, AppError>({
    queryKey: studyKeys.series(userId, dateRangeKey(days), dateRangeKey(previousDays)),
    queryFn: () =>
      userId ? studyService.getSeries(userId, range, previousRange, days, previousDays) : null,
  })

  return {
    isPending: query.isPending,
    isError: query.isError,
    errorMessage: query.error?.message ?? null,
    retry: () => void query.refetch(),
    data: query.data ?? null,
  }
}
