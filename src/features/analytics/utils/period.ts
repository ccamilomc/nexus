import { type DayRange, dayRange, lastDays, minusDays } from '@/shared/utils'

import type { AnalyticsPeriod, PeriodWindow } from '../types/analytics.types'

/**
 * Resuelve un periodo en fechas concretas, con su tramo anterior.
 *
 * Los rangos se acotan por **hora local** (mismo criterio que `dayRange`): los
 * registros son `timestamptz`, así que comparar por fecha suelta desplazaría al
 * día siguiente todo lo que ocurre de noche.
 */
export function periodWindow(today: Date, period: AnalyticsPeriod): PeriodWindow {
  const { days: length } = period
  const previousEnd = minusDays(today, length)

  return {
    period,
    days: lastDays(today, length),
    range: spanEndingAt(today, length),
    previousDays: lastDays(previousEnd, length),
    previousRange: spanEndingAt(previousEnd, length),
  }
}

/** Rango de `length` días que termina al acabar `lastDay`, ambos inclusive. */
function spanEndingAt(lastDay: Date, length: number): DayRange {
  return {
    fromIso: dayRange(minusDays(lastDay, length - 1)).fromIso,
    toIso: dayRange(lastDay).toIso,
  }
}
