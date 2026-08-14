/**
 * A qué instante corresponde un día que se apunta.
 *
 * **Si es hoy, ahora**; si es un día pasado, **su mediodía**. Uno recuerda que
 * cenó «el domingo», no que fueron las 21:47, así que inventar una hora exacta
 * sería fingir una precisión que no se tiene. El mediodía además deja el
 * registro dentro del día elegido en cualquier huso, cosa que la medianoche no
 * garantiza.
 *
 * Lo usan salud (una medición fechada atrás) y nutrición (una comida que se
 * apunta al día siguiente). `now` se recibe para que la función siga siendo
 * pura.
 */
export function toLoggedAt(day: Date, now: Date): string {
  const isToday =
    now.getFullYear() === day.getFullYear() &&
    now.getMonth() === day.getMonth() &&
    now.getDate() === day.getDate()

  if (isToday) return now.toISOString()

  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), 12, 0, 0, 0).toISOString()
}
