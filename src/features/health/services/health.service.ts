import { toAppError } from '@/core/error'
import type { DayRange } from '@/shared/utils'

import { METRIC_TYPES_IN_ORDER, METRIC_UNITS } from '../constants/health.constants'
import { healthRepository } from '../repositories/health.repository'
import type { LogMetricValues } from '../schemas/health.schema'
import type {
  Bmi,
  BodyMetric,
  BodyMetricType,
  MetricSummary,
  WeightPeriodSeries,
} from '../types/health.types'
import { calculateBmi } from '../utils/bmi'
import { buildMetricSummaries } from '../utils/metric-summary'
import { buildWeightSeries } from '../utils/weight-series'

/**
 * Mediciones que se traen para componer el resumen.
 *
 * Con ocho medidas posibles, cuarenta cubren de sobra la última y la anterior de
 * cada una, que es lo que el resumen necesita.
 */
const RECENT_LIMIT = 40

/** Mediciones que se muestran en el histórico de una medida. */
export const HISTORY_LIMIT = 20

/** Lo que la pantalla de salud necesita saber de una vez. */
export interface HealthOverview {
  readonly metrics: readonly MetricSummary[]
  /** IMC del último peso; `null` si falta el peso o la altura. */
  readonly bmi: Bmi | null
  readonly heightCm: number | null
}

/** Reglas de negocio de salud. Traduce errores técnicos a `AppError`. */
export const healthService = {
  /**
   * El estado actual: última lectura de cada medida y el IMC.
   *
   * El IMC se **calcula** con la altura del perfil; si no está, no se muestra
   * (ver docs/04-modelo-de-datos.md).
   */
  async getOverview(userId: string): Promise<HealthOverview> {
    try {
      const [metrics, heightCm] = await Promise.all([
        healthRepository.listRecentMetrics(userId, RECENT_LIMIT),
        healthRepository.findHeightCm(userId),
      ])

      const summaries = buildMetricSummaries(metrics, METRIC_TYPES_IN_ORDER)
      const weight = summaries.find(({ type }) => type === 'weight')

      return {
        metrics: summaries,
        bmi: weight ? calculateBmi(weight.latest.value, heightCm) : null,
        heightCm,
      }
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** El histórico de una medida, de la más reciente a la más antigua. */
  async getHistory(userId: string, metricType: BodyMetricType): Promise<BodyMetric[]> {
    try {
      return await healthRepository.listMetricHistory(userId, metricType, HISTORY_LIMIT)
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
   * Registra una medición.
   *
   * La unidad la pone el sistema y **se guarda en la fila**: una medición vieja
   * conserva la unidad con la que se tomó aunque mañana cambie la convención.
   */
  async logMetric(userId: string, values: LogMetricValues): Promise<void> {
    try {
      await healthRepository.insertMetric({
        user_id: userId,
        metric_type: values.metricType,
        value: values.value,
        unit: METRIC_UNITS[values.metricType],
        measured_at: new Date().toISOString(),
      })
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
