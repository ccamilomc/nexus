import type { SleepHistory, SleepLog } from '../types/sleep.types'
import { totalMinutesByDate } from './daily-sleep'

/** Media redondeada de una lista de números; `null` si está vacía. */
function average(values: readonly number[]): number | null {
  if (values.length === 0) return null

  return Math.round(values.reduce((total, value) => total + value, 0) / values.length)
}

/**
 * Compone el historial de sueño con sus medias.
 *
 * **La media es por día, no por registro**, y desde que existen las siestas eso
 * no es un matiz: un día de seis horas de noche más tres de siesta son dos
 * filas, y promediarlas daría 4 h 30 min para un día en el que se durmieron
 * nueve. La media se saca de lo dormido cada día.
 *
 * La media de calidad sólo cuenta lo valorado: puntuar es opcional, y tratar
 * «no lo valoré» como un cero hundiría la media de quien simplemente no
 * respondió.
 */
export function buildSleepHistory(logs: readonly SleepLog[]): SleepHistory {
  const qualities = logs
    .map((log) => log.quality_rating)
    .filter((quality): quality is number => quality !== null)

  return {
    logs,
    averageMinutes: average([...totalMinutesByDate(logs).values()]),
    averageQuality: average(qualities),
  }
}
