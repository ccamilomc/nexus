import type { DayRange } from './day-range'

/**
 * Semana local que contiene `date`, **de lunes a domingo**.
 *
 * En Colombia (y en casi toda Latinoamérica) la semana empieza el lunes, así
 * que el presupuesto semanal se corta ahí. Como en el día, se acota por hora
 * local: usar UTC desplazaría las comidas de la noche.
 */
export function weekRange(date: Date): DayRange {
  const start = mondayOf(date)

  const end = new Date(start)
  end.setDate(end.getDate() + 7)

  return { fromIso: start.toISOString(), toIso: end.toISOString() }
}

/**
 * Los siete días de esa semana, de lunes a domingo.
 *
 * El rango sirve para consultar; esto, para repartir por días lo que vuelve.
 * Comparten el mismo lunes para que no puedan discrepar.
 */
export function weekDays(date: Date): readonly Date[] {
  const start = mondayOf(date)

  return Array.from({ length: 7 }, (_unused, offset) => {
    const day = new Date(start)
    day.setDate(day.getDate() + offset)

    return day
  })
}

/** El lunes de la semana de `date`, a medianoche local. */
function mondayOf(date: Date): Date {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  // getDay(): 0 = domingo. Se convierte a «días transcurridos desde el lunes».
  const daysSinceMonday = (start.getDay() + 6) % 7
  start.setDate(start.getDate() - daysSinceMonday)

  return start
}
