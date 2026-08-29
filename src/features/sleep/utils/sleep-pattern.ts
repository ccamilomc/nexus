import type { SleepLog } from '../types/sleep.types'
import { nightsOnly } from './daily-sleep'
import { minutesOfDay } from './sleep-time'

const MINUTES_PER_DAY = 24 * 60
const MINUTES_PER_HOUR = 60

/**
 * Noches que hacen falta para hablar de un patrón.
 *
 * Con una o dos, «lo de siempre» es lo de anteayer. Tres ya distinguen una
 * costumbre de una casualidad, y es el mismo mínimo que Analytics exige para
 * dibujar una tendencia.
 */
const MIN_NIGHTS_FOR_PATTERN = 3

/** A qué hora sueles acostarte y despertarte. */
export interface SleepPattern {
  /** `HH:MM`, listo para un `<input type="time">`. */
  readonly bedtime: string
  readonly wakeTime: string
}

/**
 * Tu horario habitual de sueño, sacado de las últimas noches.
 *
 * **Mediana y no media, a propósito.** Una noche de fiesta a las 4:00 arrastra
 * la media casi una hora y el horario propuesto dejaría de parecerse a ninguna
 * noche real. La mediana la ignora sola.
 *
 * **Las horas de acostarse se miden desde el mediodía**, no desde medianoche.
 * Alguien que se acuesta a las 23:30 y a las 00:30 tiene dos valores casi
 * pegados (1410 y 30 en minutos del día) que, promediados tal cual, darían las
 * 12:00 del mediodía. Corriendo el origen a las 12:00, las dos caen juntas y la
 * mediana sale donde tiene que salir.
 *
 * Devuelve `null` sin noches suficientes: proponer un horario inventado sería
 * peor que no proponer ninguno.
 */
export function sleepPattern(logs: readonly SleepLog[]): SleepPattern | null {
  const bedtimes: number[] = []
  const wakeTimes: number[] = []

  // **Sólo las noches.** Una siesta a las tres de la tarde no dice nada de a
  // qué hora te acuestas, y metida en esta media la movería hacia una hora a la
  // que nadie se acuesta.
  for (const log of nightsOnly(logs)) {
    const bed = log.bedtime === null ? null : minutesOfDay(isoToTime(log.bedtime))
    const wake = log.wake_time === null ? null : minutesOfDay(isoToTime(log.wake_time))
    // Una noche a medias no aporta patrón: se salta entera para que las dos
    // listas sigan hablando de las mismas noches.
    if (bed === null || wake === null) continue

    bedtimes.push(fromNoon(bed))
    wakeTimes.push(wake)
  }

  if (bedtimes.length < MIN_NIGHTS_FOR_PATTERN) return null

  return {
    bedtime: toTime((median(bedtimes) + MINUTES_PER_DAY / 2) % MINUTES_PER_DAY),
    wakeTime: toTime(median(wakeTimes)),
  }
}

/** Minutos desde el mediodía, para que las horas nocturnas queden contiguas. */
function fromNoon(minutes: number): number {
  return (minutes + MINUTES_PER_DAY / 2) % MINUTES_PER_DAY
}

/** El valor central. Con un número par de noches, la media de las dos de enmedio. */
function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 1) return sorted[middle] ?? 0

  return Math.round(((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2)
}

/** `2026-08-07T23:30:00Z` → `23:30`, en hora local. */
function isoToTime(iso: string): string {
  const date = new Date(iso)

  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function toTime(minutes: number): string {
  const rounded = Math.round(minutes) % MINUTES_PER_DAY

  return `${pad(Math.floor(rounded / MINUTES_PER_HOUR))}:${pad(rounded % MINUTES_PER_HOUR)}`
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}
