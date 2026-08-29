import { buildDailySeries, countDaysWithData, seriesAverage, toDateKey } from '@/shared/utils'

import type { SleepDaySample, SleepPeriodSeries } from '../types/sleep.types'
import { totalMinutesByDate } from './daily-sleep'

/**
 * Arma la serie de sueño de un periodo y la media del tramo anterior.
 *
 * Recibe las noches de **los dos tramos juntos** —se piden en una sola consulta,
 * porque son contiguos— y las reparte por su fecha.
 */
export function buildSleepSeries(
  samples: readonly SleepDaySample[],
  days: readonly Date[],
  previousDays: readonly Date[],
  /** El objetivo vigente, para poder dibujar contra qué se compara. */
  targetMinutes: number | null,
): SleepPeriodSeries {
  // Suma la noche y las siestas de cada día: el objetivo se mide contra el
  // total, no contra el registro que llegara de último.
  const minutesByDate = totalMinutesByDate(samples)

  const points = buildDailySeries(days, minutesByDate, toDateKey)
  const previousPoints = buildDailySeries(previousDays, minutesByDate, toDateKey)

  return {
    points,
    nightsLogged: countDaysWithData(points),
    averageMinutes: roundOrNull(seriesAverage(points)),
    averageQuality: averageQualityOf(samples, days),
    previousAverageMinutes: roundOrNull(seriesAverage(previousPoints)),
    targetMinutes,
  }
}

/**
 * Media de calidad de las noches **valoradas** dentro del periodo.
 *
 * La calidad es opcional al registrar, así que su denominador no es el de los
 * minutos: se puede haber dormido siete noches y puntuado sólo dos.
 */
function averageQualityOf(
  samples: readonly SleepDaySample[],
  days: readonly Date[],
): number | null {
  const inPeriod = new Set(days.map(toDateKey))
  const ratings = samples.reduce<number[]>((collected, { date, quality_rating }) => {
    if (quality_rating !== null && inPeriod.has(date)) collected.push(quality_rating)

    return collected
  }, [])

  if (ratings.length === 0) return null

  const average = ratings.reduce((total, rating) => total + rating, 0) / ratings.length

  return Math.round(average * 10) / 10
}

/** Los minutos se muestran enteros: medio minuto de media no significa nada. */
function roundOrNull(value: number | null): number | null {
  return value === null ? null : Math.round(value)
}
