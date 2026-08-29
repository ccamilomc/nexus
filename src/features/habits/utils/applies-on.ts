import { toDateKey } from '@/shared/utils'

import type { Habit } from '../types/habits.types'

/**
 * Días de la semana como los guarda la base: **1 es lunes y 7 es domingo**.
 *
 * Es la numeración ISO, la misma que ya usa `week_starts_on` en las
 * preferencias. `Date.getDay()` cuenta distinto —0 es domingo—, así que se
 * traduce aquí y en un solo sitio.
 */

/** El día de la semana de una fecha, de 1 (lunes) a 7 (domingo). */
export function weekdayOf(date: Date): number {
  return ((date.getDay() + 6) % 7) + 1
}

/**
 * Si un hábito toca ese día.
 *
 * **Es la única respuesta a «¿este día cuenta?»**, y la usan las cuatro cifras
 * de hábitos: la constancia, la racha, los días perfectos y lo que queda por
 * hacer hoy. Antes cada una lo resolvía por su cuenta mirando sólo la fecha de
 * creación, y al llegar los días de la semana habrían tenido que aprenderlo
 * las cuatro por separado — que es como se acaba con una diciendo 60 % y otra
 * 43 % del mismo hábito.
 *
 * Dos condiciones, y las dos importan:
 *
 * - **No cuenta antes de existir.** Un hábito creado anteayer con dos días
 *   cumplidos vale «2 de 2», no «2 de 30»: penalizar los días en que no existía
 *   sería falso y desmotiva justo al empezar.
 * - **No cuenta si ese día no toca.** Sin esto, «ir al gimnasio lunes,
 *   miércoles y viernes» sale fallado cuatro días de cada siete.
 *
 * Sin días marcados (`target_weekdays` en blanco) el hábito es diario, que es
 * como se comportaban todos hasta ahora.
 */
export function appliesOn(habit: Habit, date: Date): boolean {
  if (toDateKey(date) < toDateKey(new Date(habit.created_at))) return false

  const weekdays = habit.target_weekdays
  if (!weekdays || weekdays.length === 0) return true

  return weekdays.includes(weekdayOf(date))
}
