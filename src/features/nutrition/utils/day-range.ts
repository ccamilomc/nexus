/**
 * Rango de un día **en la hora local del usuario**.
 *
 * Los registros guardan `timestamptz`, así que para "lo de hoy" no basta con
 * comparar fechas: hay que acotar entre el inicio y el fin del día local y
 * dejar que la base compare instantes. Si se usara UTC, quien come a las 20:00
 * en Colombia vería su cena caer en el día siguiente.
 */
export interface DayRange {
  /** Inicio del día local, inclusive (ISO). */
  readonly fromIso: string
  /** Inicio del día siguiente, exclusivo (ISO). */
  readonly toIso: string
}

export function dayRange(date: Date): DayRange {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  return { fromIso: start.toISOString(), toIso: end.toISOString() }
}
