/**
 * Horas de sueño. Funciones puras.
 *
 * La hora se maneja como `HH:MM` —lo que da un `<input type="time">` y lo que
 * guarda la columna `time` de Postgres— y no como instante: «me acosté a las
 * 23:30» no necesita fecha ni zona horaria.
 */

const MINUTES_PER_DAY = 24 * 60
const MINUTES_PER_HOUR = 60

/** Minutos desde medianoche; `null` si la hora no es válida. */
export function minutesOfDay(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(time)
  if (!match) return null

  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null

  return hours * MINUTES_PER_HOUR + minutes
}

/**
 * Minutos dormidos entre acostarse y despertar.
 *
 * **Cruza la medianoche**: de 23:30 a 07:00 son siete horas y media, no menos
 * dieciséis. Es el caso normal, no el borde: casi nadie se acuesta después de
 * medianoche… y quien lo hace (02:00 → 09:00) también sale bien, porque el
 * cálculo sólo suma un día cuando el despertar es anterior a la acostada.
 */
export function sleepMinutes(bedtime: string, wakeTime: string): number | null {
  const from = minutesOfDay(bedtime)
  const to = minutesOfDay(wakeTime)
  if (from === null || to === null) return null

  const elapsed = to - from

  return elapsed > 0 ? elapsed : elapsed + MINUTES_PER_DAY
}

/** Los dos instantes de una noche, listos para guardar. */
export interface SleepInstants {
  readonly bedtimeIso: string
  readonly wakeTimeIso: string
}

/**
 * Convierte las horas escritas en los **instantes** que guarda la base.
 *
 * `bedtime` y `wake_time` son `timestamptz`, no horas sueltas: el esquema quiere
 * saber *cuándo* se durmió, no sólo qué marcaba el reloj. La fecha se deduce de
 * la noche: uno despierta el día del registro, y se acostó **el día anterior**
 * si la hora de acostarse es posterior a la de despertar (23:30 → 06:45).
 */
export function sleepInstants(
  wakeDate: Date,
  bedtime: string,
  wakeTime: string,
): SleepInstants | null {
  const bedMinutes = minutesOfDay(bedtime)
  const wakeMinutes = minutesOfDay(wakeTime)
  if (bedMinutes === null || wakeMinutes === null) return null

  const wake = atMinutes(wakeDate, wakeMinutes)
  const bed = atMinutes(wakeDate, bedMinutes)
  if (bedMinutes >= wakeMinutes) bed.setDate(bed.getDate() - 1)

  return { bedtimeIso: bed.toISOString(), wakeTimeIso: wake.toISOString() }
}

/** El día de `date` a `minutes` desde medianoche, en hora local. */
function atMinutes(date: Date, minutes: number): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    Math.floor(minutes / MINUTES_PER_HOUR),
    minutes % MINUTES_PER_HOUR,
  )
}
