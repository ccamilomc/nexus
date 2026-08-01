import { lastDays, toDateKey } from '@/shared/utils'

import type { HabitConsistency } from '../types/habits.types'

/**
 * Constancia de un hábito: cuántos de los últimos días se cumplió.
 *
 * La ventana **no empieza antes de que el hábito existiera**. Un hábito creado
 * anteayer con dos días cumplidos vale «2 de 2 · 100 %», no «2 de 30 · 7 %»:
 * penalizar días en los que el hábito no existía sería falso y desmotivaría
 * justo al empezar, que es cuando más cuesta.
 *
 * Las claves `YYYY-MM-DD` se comparan como texto, que en ese formato equivale
 * a compararlas como fechas.
 */
export function calculateConsistency(
  completedDates: ReadonlySet<string>,
  today: Date,
  windowDays: number,
  createdAt: Date,
): HabitConsistency {
  const startKey = toDateKey(createdAt)
  const days = lastDays(today, windowDays)
    .map(toDateKey)
    .filter((dateKey) => dateKey >= startKey)

  const doneDays = days.filter((dateKey) => completedDates.has(dateKey)).length
  const totalDays = days.length

  return {
    doneDays,
    totalDays,
    percent: totalDays === 0 ? 0 : Math.round((doneDays / totalDays) * 100),
  }
}
