/**
 * Formato de duraciones. Lo usan varios módulos (entrenamiento, estudio), por
 * eso vive aquí: dos criterios distintos para lo mismo se notan en pantalla.
 */

const SECONDS_PER_MINUTE = 60
const MINUTES_PER_HOUR = 60

/**
 * Duración en lenguaje humano: «45 min», «1 h», «2 h 15 min».
 *
 * Se pasa a horas en cuanto llega a una, porque «135 min» obliga a hacer la
 * cuenta mentalmente y «2 h 15 min» no. `null` es una duración que no se conoce
 * —una sesión aún en curso—, no un cero.
 */
export function formatMinutes(minutes: number | null): string {
  if (minutes === null || minutes < 0) return '—'
  if (minutes < MINUTES_PER_HOUR) return `${minutes} min`

  const hours = Math.floor(minutes / MINUTES_PER_HOUR)
  const rest = minutes % MINUTES_PER_HOUR

  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`
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
