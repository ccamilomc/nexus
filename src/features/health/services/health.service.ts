import { createAppError, toAppError } from '@/core/error'
import { profileService } from '@/features/profile'
import {
  type Baseline,
  baselineOf,
  type DayRange,
  minusDays,
  toDateKey,
  toDateKeyFromIso,
} from '@/shared/utils'

import { METRIC_TYPES_IN_ORDER, METRIC_UNITS } from '../constants/health.constants'
import { healthRepository } from '../repositories/health.repository'
import type { LogMeasurementsValues } from '../schemas/health.schema'
import type {
  Bmi,
  BodyMetric,
  BodyMetricType,
  MetricHistory,
  MetricSummary,
  WeightPeriodSeries,
  WeightTrend,
} from '../types/health.types'
import { calculateBmi } from '../utils/bmi'
import { toMeasuredAt } from '../utils/measured-at'
import { buildMetricHistory } from '../utils/metric-history'
import { buildMetricSummaries } from '../utils/metric-summary'
import { buildWeightSeries } from '../utils/weight-series'
import { buildWeightTrend } from '../utils/weight-trend'

/**
 * Mediciones que se traen para componer el resumen.
 *
 * Con ocho medidas posibles, cuarenta cubren de sobra la última y la anterior de
 * cada una, que es lo que el resumen necesita.
 */
const RECENT_LIMIT = 40

/**
 * Cuántas lecturas se traen al abrir una medida.
 *
 * Veinte cubren de sobra lo que se mira: con el peso, dos meses y medio pesándose
 * cada cuatro días; con la cinta métrica, casi dos años. Más allá, la pregunta
 * deja de ser «cómo voy» y pasa a ser un histórico, que no es lo que hace esta
 * pantalla.
 */
const HISTORY_LIMIT = 20

/** Lo que la pantalla de salud necesita saber de una vez. */
export interface HealthOverview {
  readonly metrics: readonly MetricSummary[]
  /** IMC del último peso; `null` si falta el peso o la altura. */
  readonly bmi: Bmi | null
  readonly heightCm: number | null
  /** Hacia dónde va el peso; `null` sin pesadas suficientes. */
  readonly weightTrend: WeightTrend | null
  /** Cuánto pesas normalmente y cuánto se mueve; `null` sin pesadas bastantes. */
  readonly weightTypical: Baseline | null
}

/**
 * Días que se miran para saber cuánto pesas normalmente.
 *
 * Treinta, como el sueño: lo bastante para que una semana rara no mande, y lo
 * bastante poco para que un cambio real se note.
 */
const TYPICAL_DAYS = 30

/**
 * Días que se miran para saber **cuánto se mueve** tu peso.
 *
 * Noventa, y son más que los treinta de arriba a propósito. Son dos preguntas
 * distintas: cuánto pesas ahora cambia con las semanas, pero cuánto oscila la
 * báscula —el agua, la comida, la hora— es una propiedad tuya que no cambia.
 *
 * **Está medido, no elegido a ojo.** Sobre los mismos datos, treinta días daban
 * un vaivén de 0,20 kg y el histórico completo, 0,80. Con 0,20 la aplicación
 * habría llamado rara casi cualquier pesada normal.
 */
const SPREAD_DAYS = 90

/** Pesadas mínimas para hablar de costumbre, y para hablar de vaivén. */
const MIN_TYPICAL = 4
const MIN_SPREAD = 8

/**
 * Cuánto pesas normalmente y cuánto se mueve, en una sola cifra.
 *
 * Junta las dos ventanas: **lo normal de las últimas semanas y el vaivén de
 * siempre**. Sin la segunda, una racha de pesadas muy juntas encogería el
 * vaivén hasta hacer rara cualquier cosa.
 *
 * `null` sin pesadas suficientes: es mejor no comparar que comparar contra una
 * costumbre inventada.
 */
function weightTypical(weights: readonly BodyMetric[], today: Date): Baseline | null {
  const desde = toDateKey(minusDays(today, TYPICAL_DAYS - 1))
  const recientes = weights
    .filter((metric) => toDateKeyFromIso(metric.measured_at) >= desde)
    .map((metric) => metric.value)

  const cercano = baselineOf(recientes, MIN_TYPICAL)
  if (cercano === null) return null

  const amplio = baselineOf(
    weights.map((metric) => metric.value),
    MIN_SPREAD,
  )
  // Sin historia bastante **no se hereda el vaivén del tramo corto**: una racha
  // de pesadas muy juntas lo encogería hasta hacer rara cualquier cosa, que es
  // justo el defecto contra el que existen las dos ventanas.
  if (amplio === null) return null

  return { ...cercano, spread: amplio.spread }
}

/** Reglas de negocio de salud. Traduce errores técnicos a `AppError`. */
export const healthService = {
  /**
   * El estado actual: última lectura de cada medida y el IMC.
   *
   * El IMC se **calcula** con la altura del perfil; si no está, no se muestra
   * (ver docs/04-modelo-de-datos.md).
   */
  async getOverview(userId: string, today: Date): Promise<HealthOverview> {
    try {
      // Las pesadas van aparte: el resumen trae unas pocas de cada medida y para
      // la tendencia hacen falta todas las de cuatro semanas, sólo de peso.
      const [metrics, profile, weights] = await Promise.all([
        healthRepository.listRecentMetrics(userId, RECENT_LIMIT),
        profileService.get(userId),
        healthRepository.listMetricsBetween(
          userId,
          'weight',
          // Noventa días y no veintiocho: de esta misma consulta salen la
          // tendencia —que sólo mira las cuatro últimas semanas— y el vaivén,
          // que necesita historia para no encogerse.
          minusDays(today, SPREAD_DAYS - 1).toISOString(),
          // Mañana: el extremo es exclusivo y hoy tiene que entrar.
          minusDays(today, -1).toISOString(),
        ),
      ])

      const heightCm = profile?.height_cm ?? null

      const summaries = buildMetricSummaries(metrics, METRIC_TYPES_IN_ORDER)
      const weight = summaries.find(({ type }) => type === 'weight')

      return {
        metrics: summaries,
        bmi: weight ? calculateBmi(weight.latest.value, heightCm) : null,
        heightCm,
        weightTrend: buildWeightTrend(weights, today),
        weightTypical: weightTypical(weights, today),
      }
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * Cómo ha ido una medida.
   *
   * Se pide sólo cuando alguien abre una: son ocho medidas y traerlas todas al
   * cargar la pantalla sería pagar ocho consultas para enseñar una.
   */
  async getHistory(userId: string, metricType: BodyMetricType): Promise<MetricHistory> {
    try {
      const metrics = await healthRepository.listMetricHistory(userId, metricType, HISTORY_LIMIT)

      return buildMetricHistory(metricType, metrics)
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * El peso de un periodo, para Analytics.
   *
   * Sólo el peso: es la única medida que se registra con frecuencia suficiente
   * para dibujar una línea. Las de cinta métrica se toman de mes en mes y una
   * gráfica de tres puntos aparentaría una tendencia que no existe.
   *
   * No lleva tramo anterior. En el resto de dominios la comparación empuja a
   * mejorar; aquí sería una nota sobre el cuerpo de alguien, y Salud no opina.
   */
  async getWeightSeries(
    userId: string,
    range: DayRange,
    days: readonly Date[],
  ): Promise<WeightPeriodSeries> {
    try {
      const metrics = await healthRepository.listMetricsBetween(
        userId,
        'weight',
        range.fromIso,
        range.toIso,
      )

      return buildWeightSeries(metrics, days)
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * Registra una vuelta de medidas: las que se hayan tomado, con su día.
   *
   * Una sola escritura para todas. Se ignoran las que se dejaron en blanco:
   * vacío es «no me lo medí», no cero.
   */
  async logMeasurements(
    userId: string,
    values: LogMeasurementsValues,
    now: Date,
  ): Promise<BodyMetric[]> {
    try {
      const measuredAt = toMeasuredAt(values.date, now)
      if (!measuredAt) throw createAppError('validation', 'Revisa el día: no se entiende.')

      const rows = METRIC_TYPES_IN_ORDER.flatMap((type) => {
        const value = values.values[type]
        if (value === undefined) return []

        return [
          {
            user_id: userId,
            metric_type: type,
            value,
            // La unidad se guarda en la fila: una medición vieja conserva la
            // suya aunque mañana cambie la convención.
            unit: METRIC_UNITS[type],
            measured_at: measuredAt,
          },
        ]
      })

      return await healthRepository.insertMetrics(rows)
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Quita una medición apuntada por error. */
  async removeMetric(metricId: string): Promise<void> {
    try {
      await healthRepository.softDeleteMetric(metricId, new Date().toISOString())
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Guarda la altura, que sólo sirve para calcular el IMC. */
  async saveHeight(userId: string, heightCm: number): Promise<void> {
    try {
      await profileService.save(userId, { heightCm })
    } catch (error) {
      throw toAppError(error)
    }
  },
}
