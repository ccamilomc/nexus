import { type SeriesQuery, useSeriesQuery } from '@/shared/hooks'
import { dateRangeKey } from '@/shared/utils'

import { financeService } from '../services/finance.service'
import type { FinancePeriodSeries } from '../types/finance.types'
import { financeKeys } from './finance.keys'

/** Lo que Analytics necesita saber de las finanzas en un periodo. */
export type FinanceSeries = SeriesQuery<FinancePeriodSeries>

/**
 * La serie de finanzas de un periodo.
 *
 * Tercer contrato del dominio, junto a `useFinanceSummary` (frases, para el
 * panel) y `useMonth` (el mes, para su propia pantalla). Con esto finanzas
 * completa el patrón que ya seguían los otros seis.
 */
export function useFinanceSeries(
  days: readonly Date[],
  previousDays: readonly Date[],
): FinanceSeries {
  return useSeriesQuery({
    queryKey: (userId) =>
      financeKeys.series(userId, dateRangeKey(days), dateRangeKey(previousDays)),
    fetch: (userId) => financeService.getSeries(userId, days, previousDays),
  })
}
