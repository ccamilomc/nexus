const MINUTES_PER_HOUR = 60

/**
 * Duración en lenguaje humano: «45 min», «1 h», «2 h 30 min».
 *
 * Se pasa a horas en cuanto llega a una, porque «135 min» obliga a hacer la
 * cuenta mentalmente y «2 h 15 min» no.
 */
export function formatMinutes(minutes: number): string {
  if (minutes < MINUTES_PER_HOUR) return `${minutes} min`

  const hours = Math.floor(minutes / MINUTES_PER_HOUR)
  const rest = minutes % MINUTES_PER_HOUR

  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`
}
