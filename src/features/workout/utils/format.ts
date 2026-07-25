/** Formato de los números que muestra el módulo de entrenamiento. Funciones puras. */

const SECONDS_PER_MINUTE = 60
const MINUTES_PER_HOUR = 60

/** Sin decimales innecesarios: `62,5 kg` pero `60 kg`. */
const decimalFormatter = new Intl.NumberFormat('es', { maximumFractionDigits: 2 })

/** Duración en minutos como texto corto: `45 min`, `1 h 05 min`. */
export function formatMinutes(minutes: number | null): string {
  if (minutes === null || minutes < 0) return '—'

  const hours = Math.floor(minutes / MINUTES_PER_HOUR)
  const rest = minutes % MINUTES_PER_HOUR

  if (hours === 0) return `${rest} min`
  return `${hours} h ${String(rest).padStart(2, '0')} min`
}

/** Cronómetro en curso: `07:42`, `1:05:09` a partir de una hora. */
export function formatElapsed(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safeSeconds / (SECONDS_PER_MINUTE * MINUTES_PER_HOUR))
  const minutes = Math.floor(safeSeconds / SECONDS_PER_MINUTE) % MINUTES_PER_HOUR
  const seconds = safeSeconds % SECONDS_PER_MINUTE

  const mmss = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  return hours > 0 ? `${hours}:${mmss}` : mmss
}

/**
 * Carga de una serie. Un peso de cero no es un dato que falte: significa que el
 * ejercicio se hizo con el propio cuerpo.
 */
export function formatWeight(weightKg: number | null): string {
  if (weightKg === null) return '—'
  if (weightKg === 0) return 'peso corporal'
  return `${decimalFormatter.format(weightKg)} kg`
}

/** Volumen acumulado de una sesión: `2.450 kg`. */
export function formatVolume(volumeKg: number): string {
  return `${decimalFormatter.format(volumeKg)} kg`
}

/**
 * Objetivos de un ejercicio prescrito: `3×10 · 60 kg`.
 *
 * Cada objetivo es opcional; se muestra sólo lo que hay. Sin ninguno, la rutina
 * sólo indica «haz este ejercicio».
 */
export function formatTargets(
  sets: number | null,
  reps: number | null,
  weightKg: number | null,
): string {
  return formatOptionalTargets(sets, reps, weightKg) ?? 'Sin objetivos'
}

/**
 * Como `formatTargets`, pero `null` cuando no hay ningún objetivo fijado.
 *
 * Sirve para omitir la pista durante el entrenamiento: «Objetivo: Sin
 * objetivos» sería ruido; ahí, o hay una cifra que perseguir, o no se dice nada.
 */
export function formatOptionalTargets(
  sets: number | null,
  reps: number | null,
  weightKg: number | null,
): string | null {
  const parts: string[] = []

  if (sets !== null && reps !== null) parts.push(`${sets}×${reps}`)
  else if (sets !== null) parts.push(`${sets} ${sets === 1 ? 'serie' : 'series'}`)
  else if (reps !== null) parts.push(`${reps} reps`)

  if (weightKg !== null) parts.push(formatWeight(weightKg))

  return parts.length > 0 ? parts.join(' · ') : null
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

const MS_PER_DAY = 86_400_000

/**
 * Cuándo ocurrió un entrenamiento: `Hoy · 18:30`, `Ayer · 07:15`,
 * `Mié 22 jul · 19:00`.
 *
 * Los días recientes se nombran en lugar de fecharse: es como los recuerda el
 * usuario. `now` se recibe para que la función siga siendo pura.
 */
export function formatSessionDate(isoDate: string, now: Date): string {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return '—'

  const time = date.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const yesterday = new Date(now.getTime() - MS_PER_DAY)
  const day = isSameDay(date, now)
    ? 'Hoy'
    : isSameDay(date, yesterday)
      ? 'Ayer'
      : date.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })

  return `${day.charAt(0).toUpperCase()}${day.slice(1)} · ${time}`
}
