/**
 * Claves de fecha locales, en `YYYY-MM-DD`.
 *
 * Hay columnas que son `date` y no `timestamptz` (`habit_logs.date`,
 * `sleep_logs.date`): un hábito se cumple «el martes», no «a las 21:04 del
 * martes». Se usa la fecha **local** para que marcar a las 23:50 cuente en el
 * día que el usuario está viviendo, y no en el siguiente por culpa de UTC.
 *
 * Sirven además para agrupar por día registros que sí son `timestamptz`
 * (entrenamientos, comidas) y para las claves de caché de TanStack Query.
 */

/** Fecha local en formato `YYYY-MM-DD`, el que entiende Postgres. */
export function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/**
 * Clave de día local de un instante ISO (`timestamptz`).
 *
 * Es la forma de agrupar por día lo que se guarda con hora: un entrenamiento
 * de las 22:30 pertenece a ese día, no al siguiente.
 */
export function toDateKeyFromIso(iso: string): string {
  return toDateKey(new Date(iso))
}

/** La fecha `days` días antes de `date`, sin tocar el original. */
export function minusDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() - days)

  return result
}

/** El día anterior a `date`, sin tocar el original. */
export function previousDay(date: Date): Date {
  return minusDays(date, 1)
}

/**
 * Identifica un tramo de días por sus extremos, para claves de caché.
 *
 * Los días de un tramo son consecutivos, así que el primero y el último lo
 * determinan por completo; meter los del medio sólo alargaría la clave.
 */
export function dateRangeKey(days: readonly Date[]): string {
  const first = days[0]
  const last = days[days.length - 1]

  return first && last ? `${toDateKey(first)}_${toDateKey(last)}` : 'empty'
}

/** Los últimos `days` días, del más antiguo al más reciente (incluye hoy). */
export function lastDays(today: Date, days: number): readonly Date[] {
  const result: Date[] = []

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    result.push(minusDays(today, offset))
  }

  return result
}
