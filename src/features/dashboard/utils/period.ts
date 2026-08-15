import { type DayRange, dayRange, lastDays, minusDays, toDateKey } from '@/shared/utils'

import type { AnalyticsPeriod, PeriodWindow } from '../types/dashboard.types'
import { formatChartDate } from './format'

/**
 * Resuelve un periodo en fechas concretas, con su tramo anterior.
 *
 * `offset` son **cuántos periodos hacia atrás** se mira: `0` es el que termina
 * hoy, `1` el inmediatamente anterior, y así. Retroceder mueve el tramo entero,
 * también el de comparación, para que la pregunta siga siendo la misma —«¿cómo
 * fue esto frente a lo de antes?»— aunque se mire un mes viejo.
 *
 * Los rangos se acotan por **hora local** (mismo criterio que `dayRange`): los
 * registros son `timestamptz`, así que comparar por fecha suelta desplazaría al
 * día siguiente todo lo que ocurre de noche.
 */
export function periodWindow(today: Date, period: AnalyticsPeriod, offset = 0): PeriodWindow {
  const { days: length } = period
  const end = minusDays(today, length * offset)
  const previousEnd = minusDays(end, length)
  const days = lastDays(end, length)

  return {
    period,
    offset,
    description: describe(period, days, offset),
    days,
    range: spanEndingAt(end, length),
    previousDays: lastDays(previousEnd, length),
    previousRange: spanEndingAt(previousEnd, length),
  }
}

/**
 * Cómo se llama el tramo que se está mirando.
 *
 * Sin retroceder vale la frase de siempre («en los últimos 30 días»). En cuanto
 * se mira hacia atrás **deja de ser cierta**, así que se dicen las fechas: un
 * gráfico titulado «los últimos 30 días» mostrando junio sería mentira.
 */
function describe(period: AnalyticsPeriod, days: readonly Date[], offset: number): string {
  if (offset === 0) return period.description

  const first = days[0]
  const last = days[days.length - 1]
  if (!first || !last) return period.description

  return `del ${formatChartDate(toDateKey(first))} al ${formatChartDate(toDateKey(last))}`
}

/** Rango de `length` días que termina al acabar `lastDay`, ambos inclusive. */
function spanEndingAt(lastDay: Date, length: number): DayRange {
  return {
    fromIso: dayRange(minusDays(lastDay, length - 1)).fromIso,
    toIso: dayRange(lastDay).toIso,
  }
}
