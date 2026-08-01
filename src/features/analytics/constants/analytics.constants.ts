import type { AnalyticsPeriod, AnalyticsPeriodId } from '../types/analytics.types'

/**
 * Periodos que se pueden mirar, indexados por su id.
 *
 * Tres bastan: la semana para el detalle, el mes para la tendencia y el
 * trimestre para el fondo. Más opciones sólo añaden decisiones que tomar.
 *
 * Van en un `Record` y no en una lista para que buscar uno sea **total**: con
 * un array haría falta un caso imposible de «no lo encontré».
 */
export const ANALYTICS_PERIODS: Readonly<Record<AnalyticsPeriodId, AnalyticsPeriod>> = {
  '7d': { id: '7d', label: '7 días', description: 'en los últimos 7 días', days: 7 },
  '30d': { id: '30d', label: '30 días', description: 'en los últimos 30 días', days: 30 },
  '90d': { id: '90d', label: '90 días', description: 'en los últimos 90 días', days: 90 },
}

/** Los periodos en el orden en que se ofrecen. */
export const ANALYTICS_PERIOD_LIST: readonly AnalyticsPeriod[] = [
  ANALYTICS_PERIODS['7d'],
  ANALYTICS_PERIODS['30d'],
  ANALYTICS_PERIODS['90d'],
]

/** El mes: suficiente para ver una tendencia sin depender de una sola semana. */
export const DEFAULT_PERIOD_ID: AnalyticsPeriodId = '30d'

/**
 * Lo que se dice cuando el tramo anterior está vacío.
 *
 * Va aquí y no suelto en cada sección porque lo dicen cinco dominios: escrito
 * cinco veces, acabarían divergiendo y la pantalla dejaría de sonar a una sola
 * voz. La comparación calla en vez de inventar un porcentaje (ver
 * `compareValues`).
 */
export const NO_PREVIOUS_PERIOD_HINT = 'Sin periodo anterior con que comparar'

/**
 * Días con registro que hacen falta para dibujar una tendencia.
 *
 * Con dos puntos siempre sale una recta, y una recta parece una tendencia. Con
 * tres empieza a verse la forma real. Por debajo, la gráfica cede su sitio a un
 * aviso de que aún falta registro.
 */
export const MIN_DAYS_FOR_TREND = 3
