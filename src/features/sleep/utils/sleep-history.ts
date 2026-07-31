import type { SleepHistory, SleepLog } from '../types/sleep.types'

/** Media redondeada de una lista de números; `null` si está vacía. */
function average(values: readonly number[]): number | null {
  if (values.length === 0) return null

  return Math.round(values.reduce((total, value) => total + value, 0) / values.length)
}

/**
 * Compone el historial de sueño con sus medias.
 *
 * La media de calidad sólo cuenta las noches valoradas: puntuar es opcional, y
 * tratar «no lo valoré» como un cero hundiría la media de quien simplemente no
 * respondió.
 */
export function buildSleepHistory(logs: readonly SleepLog[]): SleepHistory {
  const qualities = logs
    .map((log) => log.quality_rating)
    .filter((quality): quality is number => quality !== null)

  return {
    logs,
    averageMinutes: average(logs.map((log) => log.duration_minutes)),
    averageQuality: average(qualities),
  }
}
