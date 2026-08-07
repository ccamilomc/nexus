import type { FinanceRecurrence } from '../types/finance.types'

/** Cuántos días quedan para una fecha. Negativo si ya pasó. */
export function daysUntil(dateKey: string, todayKey: string): number {
  const [year = 0, month = 0, day = 0] = dateKey.split('-').map(Number)
  const [todayYear = 0, todayMonth = 0, todayDay = 0] = todayKey.split('-').map(Number)

  // A mediodía las dos, para que ningún cambio de horario mueva la cuenta.
  const target = new Date(year, month - 1, day, 12)
  const today = new Date(todayYear, todayMonth - 1, todayDay, 12)

  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

/**
 * La siguiente fecha de un pago fijo, tras confirmar el actual.
 *
 * **`anchorDay` es el día acordado, no el de la última vez.** Sin él, un
 * arriendo del 31 se recortaba al 28 en febrero y se quedaba en el 28 para
 * siempre, porque cada mes se avanzaba desde la fecha ya recortada. Con el día
 * acordado aparte, febrero lo recorta una vez y marzo vuelve al 31.
 *
 * En la frecuencia semanal no aplica: siete días son siete días.
 */
export function nextDueDate(
  currentKey: string,
  frequency: FinanceRecurrence,
  anchorDay: number,
): string {
  const [year = 0, month = 0, day = 0] = currentKey.split('-').map(Number)

  if (frequency === 'weekly') return toKey(new Date(year, month - 1, day + 7, 12))

  const monthsAhead = frequency === 'yearly' ? 12 : 1
  const targetMonth = month - 1 + monthsAhead
  // Día 0 del mes siguiente es el último del mes objetivo: así se sabe cuántos
  // días tiene sin listarlos ni acordarse de los bisiestos.
  const lastDay = new Date(year, targetMonth + 1, 0, 12).getDate()

  return toKey(new Date(year, targetMonth, Math.min(anchorDay, lastDay), 12))
}

function toKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}
