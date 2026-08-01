import { type SeriesQuery, useSeriesQuery } from '@/shared/hooks'
import { dateRangeKey } from '@/shared/utils'

import { sleepService } from '../services/sleep.service'
import type { SleepPeriodSeries } from '../types/sleep.types'
import { sleepKeys } from './use-sleep'

/** Lo que Analytics necesita saber del sueño en un periodo. */
export type SleepSeries = SeriesQuery<SleepPeriodSeries>

/**
 * La serie de sueño de un periodo.
 *
 * Tercer contrato del dominio, junto a `useSleepSummary` (frases, para el
 * dashboard) y `useSleepContext` (datos del día, para el motor). Éste devuelve
 * la **historia** del periodo, que es lo que Analytics dibuja.
 */
export function useSleepSeries(days: readonly Date[], previousDays: readonly Date[]): SleepSeries {
  return useSeriesQuery({
    queryKey: (userId) => sleepKeys.series(userId, dateRangeKey(days), dateRangeKey(previousDays)),
    fetch: (userId) => sleepService.getSeries(userId, days, previousDays),
  })
}
