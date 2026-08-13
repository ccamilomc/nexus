import { METRIC_UNITS } from '../constants/health.constants'
import type { BodyMetric, BodyMetricType, MetricHistory } from '../types/health.types'

/**
 * Cómo ha ido una medida, a partir de sus lecturas.
 *
 * Llegan de la más reciente a la más antigua, que es como se leen, y se
 * devuelven igual. El cambio de cada una es **respecto a la anterior en el
 * tiempo** —la siguiente de la lista, que es más vieja—, así que la última no
 * tiene con qué compararse.
 *
 * La unidad sale de la lectura, no de la tabla de unidades: una medición vieja
 * conserva la unidad con la que se tomó aunque hoy se use otra.
 */
export function buildMetricHistory(
  type: BodyMetricType,
  metrics: readonly BodyMetric[],
): MetricHistory {
  const unit = metrics[0]?.unit ?? METRIC_UNITS[type]

  const readings = metrics.map((metric, index) => {
    const older = metrics[index + 1]

    return {
      id: metric.id,
      value: metric.value,
      unit: metric.unit,
      measuredAt: metric.measured_at,
      change: older ? metric.value - older.value : null,
    }
  })

  const newest = metrics[0]
  const oldest = metrics[metrics.length - 1]

  return {
    type,
    readings,
    // Con una sola lectura no hay recorrido que contar, y `newest === oldest`
    // daría un cero que se leería como «no has cambiado».
    totalChange: newest && oldest && newest !== oldest ? newest.value - oldest.value : null,
    unit,
  }
}
