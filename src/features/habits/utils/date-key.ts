/**
 * Claves de fecha para los hábitos.
 *
 * `habit_logs.date` es una columna `date` (no `timestamptz`): un hábito se
 * cumple «el martes», no «a las 21:04 del martes». Se usa la fecha **local**
 * para que marcar a las 23:50 cuente en el día que el usuario está viviendo.
 */

/** Fecha local en formato `YYYY-MM-DD`, el que entiende Postgres. */
export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/** El día anterior a `date`, sin tocar el original. */
export function previousDay(date: Date): Date {
  const previous = new Date(date)
  previous.setDate(previous.getDate() - 1)

  return previous
}

/** Los últimos `days` días, del más antiguo al más reciente (incluye hoy). */
export function lastDays(today: Date, days: number): readonly Date[] {
  const result: Date[] = []

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(today)
    day.setDate(day.getDate() - offset)
    result.push(day)
  }

  return result
}
