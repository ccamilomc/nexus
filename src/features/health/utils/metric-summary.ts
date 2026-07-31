import type { BodyMetric, MetricSummary } from '../types/health.types'

/**
 * La última lectura de cada medida y cuánto ha cambiado.
 *
 * Los registros llegan del más reciente al más antiguo, así que el primero de
 * cada tipo es el actual y el segundo, aquel con el que se compara.
 *
 * El cambio se da **sin juicio**: es una resta, no una valoración. Subir o
 * bajar de peso no es bueno ni malo sin saber qué persigue quien lo mide.
 */
export function buildMetricSummaries(
  metrics: readonly BodyMetric[],
  order: readonly BodyMetric['metric_type'][],
): readonly MetricSummary[] {
  const byType = new Map<BodyMetric['metric_type'], BodyMetric[]>()

  for (const metric of metrics) {
    const current = byType.get(metric.metric_type)
    if (current) current.push(metric)
    else byType.set(metric.metric_type, [metric])
  }

  return order
    .filter((type) => byType.has(type))
    .map((type) => {
      const [latest, previous] = byType.get(type) ?? []
      if (!latest) throw new Error('Tipo sin mediciones tras filtrar')

      return {
        type,
        latest,
        previous: previous ?? null,
        change: previous ? round(latest.value - previous.value) : null,
      }
    })
}

/** Dos decimales, los mismos que guarda la columna. */
function round(value: number): number {
  return Math.round(value * 100) / 100
}
