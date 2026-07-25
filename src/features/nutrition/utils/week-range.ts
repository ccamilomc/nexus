import type { DayRange } from './day-range'

/**
 * Semana local que contiene `date`, **de lunes a domingo**.
 *
 * En Colombia (y en casi toda Latinoamérica) la semana empieza el lunes, así
 * que el presupuesto semanal se corta ahí. Como en el día, se acota por hora
 * local: usar UTC desplazaría las comidas de la noche.
 */
export function weekRange(date: Date): DayRange {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  // getDay(): 0 = domingo. Se convierte a «días transcurridos desde el lunes».
  const daysSinceMonday = (start.getDay() + 6) % 7
  start.setDate(start.getDate() - daysSinceMonday)

  const end = new Date(start)
  end.setDate(end.getDate() + 7)

  return { fromIso: start.toISOString(), toIso: end.toISOString() }
}
