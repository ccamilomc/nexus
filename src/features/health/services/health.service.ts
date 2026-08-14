import { createAppError, toAppError } from '@/core/error'
import { type DayRange, minusDays } from '@/shared/utils'

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

/**
 * Días de pesadas que se traen para la tendencia.
 *
 * Cuatro semanas: las dos que se comparan y las dos con las que se comparan.
 */
const TREND_DAYS = 28

/** Lo que la pantalla de salud necesita saber de una vez. */
export interface HealthOverview {
  readonly metrics: readonly MetricSummary[]
  /** IMC del último peso; `null` si falta el peso o la altura. */
  readonly bmi: Bmi | null
  readonly heightCm: number | null
  /** Hacia dónde va el peso; `null` sin pesadas suficientes. */
  readonly weightTrend: WeightTrend | null
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
      const [metrics, heightCm, weights] = await Promise.all([
        healthRepository.listRecentMetrics(userId, RECENT_LIMIT),
        healthRepository.findHeightCm(userId),
        healthRepository.listMetricsBetween(
          userId,
          'weight',
          minusDays(today, TREND_DAYS - 1).toISOString(),
          // Mañana: el extremo es exclusivo y hoy tiene que entrar.
          minusDays(today, -1).toISOString(),
        ),
      ])

      const summaries = buildMetricSummaries(metrics, METRIC_TYPES_IN_ORDER)
      const weight = summaries.find(({ type }) => type === 'weight')

      return {
        metrics: summaries,
        bmi: weight ? calculateBmi(weight.latest.value, heightCm) : null,
        heightCm,
        weightTrend: buildWeightTrend(weights, today),
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
      await healthRepository.updateHeightCm(userId, heightCm)
    } catch (error) {
      throw toAppError(error)
    }
  },
}
