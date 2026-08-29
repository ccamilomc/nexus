import type { SleepDaySample, SleepLog } from '../types/sleep.types'

/**
 * Cuánto se durmió cada día, sumando la noche y las siestas.
 *
 * **Suma, no sustituye**, y ahí estaba el fallo: antes esto era un `Map` armado
 * con `samples.map(...)`, que ante dos registros del mismo día se quedaba
 * callado con el último. Seis horas de noche más tres de siesta se guardaban
 * como tres.
 *
 * Es la cifra contra la que se mide el objetivo: nueve horas son nueve horas,
 * las hayas dormido de una vez o de dos.
 */
export function totalMinutesByDate(samples: readonly SleepDaySample[]): Map<string, number> {
  const porFecha = new Map<string, number>()

  for (const { date, duration_minutes } of samples) {
    porFecha.set(date, (porFecha.get(date) ?? 0) + duration_minutes)
  }

  return porFecha
}

/**
 * Sólo el sueño principal de cada día.
 *
 * **El patrón de horarios se saca de aquí y no del total.** Una siesta a las
 * tres de la tarde no dice nada de a qué hora te acuestas, y metida en esa media
 * la movería hacia una hora a la que nadie se acuesta.
 */
export function nightsOnly<T extends { readonly kind: SleepLog['kind'] }>(
  logs: readonly T[],
): readonly T[] {
  return logs.filter((log) => log.kind === 'night')
}

/** Las siestas de un día, de la más temprana a la más tardía. */
export function napsOn(logs: readonly SleepLog[], dateKey: string): readonly SleepLog[] {
  return logs
    .filter((log) => log.kind === 'nap' && log.date === dateKey)
    .sort((a, b) => (a.bedtime ?? '').localeCompare(b.bedtime ?? ''))
}
