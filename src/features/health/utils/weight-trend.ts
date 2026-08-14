import { minusDays, toDateKey, toDateKeyFromIso } from '@/shared/utils'

import type { BodyMetric, WeightTrend } from '../types/health.types'

/**
 * Días que abarca cada ventana.
 *
 * Dos semanas contra las dos anteriores. Con menos, una sola pesada rara
 * arrastra la media; con más, la tendencia tarda semanas en enterarse de un
 * cambio real.
 */
const WINDOW_DAYS = 14

/**
 * Pesadas mínimas en cada ventana para que la media promedie algo.
 *
 * Con una sola a cada lado esto volvería a ser una resta entre dos pesadas,
 * que es justo el ruido del que se huye.
 */
const MIN_PER_WINDOW = 2

/** Por debajo de esto no hay tendencia que contar, sólo ruido. */
const STABLE_KG_PER_WEEK = 0.1

/**
 * Hacia dónde va el peso, promediando para quitarle el ruido del día a día.
 *
 * El peso oscila un kilo largo entre una pesada y otra por el agua, la comida y
 * la hora a la que uno se sube a la báscula. Por eso restar la última medición
 * de la anterior no dice nada: en estos mismos datos, dos pesadas separadas por
 * dos días se llevan 1,1 kg mientras el peso baja de forma sostenida. Ese número
 * es más grande que el cambio real y con el signo contrario.
 *
 * Se compara la **media de las dos últimas semanas con la de las dos previas**.
 * Promediar cancela el ruido, y como los centros de ambas ventanas distan
 * catorce días, la diferencia entre las medias es directamente el cambio de esos
 * catorce días.
 *
 * Ventanas de tiempo y no de conteo: así sale lo mismo para quien se pesa a
 * diario que para quien se pesa dos veces por semana.
 *
 * Devuelve `null` cuando no hay pesadas suficientes. Es información que todavía
 * no se tiene, y rellenarla con la resta de dos pesadas sería inventarla.
 */
export function buildWeightTrend(metrics: readonly BodyMetric[], now: Date): WeightTrend | null {
  const recentFrom = toDateKey(minusDays(now, WINDOW_DAYS - 1))
  const previousFrom = toDateKey(minusDays(now, WINDOW_DAYS * 2 - 1))

  const recent: number[] = []
  const previous: number[] = []

  for (const metric of metrics) {
    const day = toDateKeyFromIso(metric.measured_at)

    if (day >= recentFrom) recent.push(metric.value)
    else if (day >= previousFrom) previous.push(metric.value)
  }

  if (recent.length < MIN_PER_WINDOW || previous.length < MIN_PER_WINDOW) return null

  const recentAverage = average(recent)
  const previousAverage = average(previous)
  const perWeek = round((recentAverage - previousAverage) / 2)

  return {
    direction: Math.abs(perWeek) < STABLE_KG_PER_WEEK ? 'stable' : perWeek > 0 ? 'up' : 'down',
    kgPerWeek: perWeek,
    recentAverage: round(recentAverage),
    previousAverage: round(previousAverage),
    recentCount: recent.length,
    previousCount: previous.length,
    windowDays: WINDOW_DAYS,
  }
}

function average(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0) / values.length
}

/** Dos decimales, los mismos que guarda la columna. */
function round(value: number): number {
  return Math.round(value * 100) / 100
}
