import { buildDailySeries, countDaysWithData, toDateKey, toDateKeyFromIso } from '@/shared/utils'

import type { BodyMetric, WeightPeriodSeries } from '../types/health.types'

/**
 * Arma la serie de peso de un periodo.
 *
 * Los días sin pesarse son **huecos**, no ceros: nadie pesa cero kilos, y la
 * línea debe cortarse donde no hubo medición en vez de desplomarse.
 *
 * No devuelve nada que se parezca a un juicio. `change` es una resta, igual que
 * en `buildMetricSummaries`: subir o bajar de peso no es bueno ni malo sin
 * saber qué persigue quien lo mide. Por eso tampoco hay «objetivo» ni
 * «tendencia esperada» aquí.
 */
export function buildWeightSeries(
  metrics: readonly BodyMetric[],
  days: readonly Date[],
): WeightPeriodSeries {
  // Si hay varias medidas el mismo día se queda la última: pesarse dos veces
  // no son dos días de datos, y la más reciente es la que uno recuerda.
  const byDate = new Map<string, BodyMetric>()
  for (const metric of metrics) {
    const dateKey = toDateKeyFromIso(metric.measured_at)
    const current = byDate.get(dateKey)

    if (!current || metric.measured_at > current.measured_at) byDate.set(dateKey, metric)
  }

  const valueByDate = new Map([...byDate].map(([dateKey, metric]) => [dateKey, metric.value]))
  const points = buildDailySeries(days, valueByDate, toDateKey)

  const measured = points.filter(
    (point): point is (typeof points)[number] & { value: number } => point.value !== null,
  )
  const first = measured[0]
  const last = measured[measured.length - 1]

  return {
    points,
    measurements: countDaysWithData(points),
    latestKg: last?.value ?? null,
    // El cambio se mide entre la primera y la última medición **dentro del
    // periodo**: comparar con una báscula de hace meses no diría nada de él.
    changeKg: first && last && first !== last ? round(last.value - first.value) : null,
    unit: metrics[0]?.unit ?? 'kg',
  }
}

/** Dos decimales, los mismos que guarda la columna. */
function round(value: number): number {
  return Math.round(value * 100) / 100
}
