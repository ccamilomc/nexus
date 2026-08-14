/**
 * A qué instante corresponde el día que se eligió.
 *
 * **Si es hoy, ahora**; si es un día pasado, **su mediodía**. Uno recuerda que
 * se midió «el domingo», no que fueron las 8:47, así que inventar una hora
 * exacta sería fingir precisión. El mediodía además deja el registro dentro del
 * día elegido en cualquier huso, cosa que la medianoche no garantiza.
 *
 * `now` se recibe para que la función siga siendo pura.
 */
export function toMeasuredAt(date: string, now: Date): string | null {
  const [year, month, day] = date.split('-').map(Number)

  if (year === undefined || month === undefined || day === undefined) return null
  if ([year, month, day].some(Number.isNaN)) return null

  const isToday =
    now.getFullYear() === year && now.getMonth() + 1 === month && now.getDate() === day

  if (isToday) return now.toISOString()

  const noon = new Date(year, month - 1, day, 12, 0, 0, 0)
  return Number.isNaN(noon.getTime()) ? null : noon.toISOString()
}
