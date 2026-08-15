import type { HabitToday } from '../types/habits.types'

/**
 * El hábito con el día ya marcado (o desmarcado), para verlo antes de que salga.
 *
 * **La racha sólo se ajusta cuando se toca hoy**, y ahí es exacta: si hoy aún no
 * estaba marcado, la racha venía contada hasta ayer, así que marcarlo la alarga
 * justo en uno. Desmarcarlo la acorta en uno por el mismo motivo.
 *
 * Tocando **un día pasado** se cambia el cuadrito y nada más: marcar un hueco
 * puede unir dos rachas de golpe, y eso no se sabe sin mirar más atrás de lo que
 * hay en pantalla. Preferimos que la cifra llegue tarde a que llegue mal; se
 * pone al día en cuanto vuelve la conexión.
 *
 * La constancia tampoco se toca: se mide sobre treinta días y la ventana que se
 * ve es más corta.
 */
export function toggleHabitDay(entry: HabitToday, dateKey: string, wasDone: boolean): HabitToday {
  const isDone = !wasDone
  const isToday = entry.recentDays.find((day) => day.dateKey === dateKey)?.isToday === true

  return {
    ...entry,
    isDoneToday: isToday ? isDone : entry.isDoneToday,
    streak: isToday ? Math.max(0, entry.streak + (isDone ? 1 : -1)) : entry.streak,
    recentDays: entry.recentDays.map((day) => (day.dateKey === dateKey ? { ...day, isDone } : day)),
  }
}
