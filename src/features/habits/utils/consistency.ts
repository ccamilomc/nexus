import { lastDays, toDateKey } from '@/shared/utils'

import type { HabitConsistency } from '../types/habits.types'

/**
 * Constancia de un hábito: cuántos de los últimos días se cumplió.
 *
 * **Sólo cuentan los días que tocaban**, y eso incluye dos cosas: que el hábito
 * ya existiera y que ese día fuera de los suyos. Un hábito creado anteayer con
 * dos días cumplidos vale «2 de 2 · 100 %», no «2 de 30 · 7 %»; y uno de lunes,
 * miércoles y viernes no falla los martes.
 *
 * Quién decide eso no es asunto de esta función: llega como `applies`, ya atado
 * a su hábito (ver `appliesOn`).
 */
export function calculateConsistency(
  completedDates: ReadonlySet<string>,
  today: Date,
  windowDays: number,
  applies: (date: Date) => boolean,
): HabitConsistency {
  const days = lastDays(today, windowDays).filter(applies).map(toDateKey)

  const doneDays = days.filter((dateKey) => completedDates.has(dateKey)).length
  const totalDays = days.length

  return {
    doneDays,
    totalDays,
    percent: totalDays === 0 ? 0 : Math.round((doneDays / totalDays) * 100),
  }
}
