import { toLoggedAt } from '@/shared/utils'

/**
 * A qué instante corresponde el día que se eligió en el formulario.
 *
 * Valida lo que llega del campo de fecha —un `YYYY-MM-DD` que puede venir vacío
 * o a medio escribir— y deja el resto a `toLoggedAt`, que es la misma regla que
 * usa nutrición al apuntar una comida de ayer: hoy va con su hora, un día
 * pasado a su mediodía.
 *
 * Devuelve `null` cuando la fecha no se entiende, en vez de inventar una.
 */
export function toMeasuredAt(date: string, now: Date): string | null {
  const [year, month, day] = date.split('-').map(Number)

  if (year === undefined || month === undefined || day === undefined) return null
  if ([year, month, day].some(Number.isNaN)) return null

  const chosen = new Date(year, month - 1, day)
  if (Number.isNaN(chosen.getTime())) return null

  return toLoggedAt(chosen, now)
}
