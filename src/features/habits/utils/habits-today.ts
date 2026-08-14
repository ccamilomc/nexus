import { lastDays, toDateKey } from '@/shared/utils'

import type { Habit, HabitLog, HabitToday } from '../types/habits.types'
import { calculateConsistency } from './consistency'
import { daysSinceDone } from './days-since'
import { calculateStreak } from './streak'

/**
 * Compone cada hábito con su estado de hoy, su racha y sus últimos días.
 *
 * Sólo cuentan los registros marcados como cumplidos: un registro con
 * `completed: false` es «lo intenté y no salió», que no suma racha.
 */
export function buildHabitsToday(
  habits: readonly Habit[],
  logs: readonly HabitLog[],
  today: Date,
  recentDayCount: number,
  consistencyDayCount: number,
): readonly HabitToday[] {
  const completedByHabit = new Map<string, Set<string>>()
  for (const log of logs) {
    if (!log.completed) continue

    const dates = completedByHabit.get(log.habit_id)
    if (dates) dates.add(log.date)
    else completedByHabit.set(log.habit_id, new Set([log.date]))
  }

  const todayKey = toDateKey(today)
  const window = lastDays(today, recentDayCount).map(toDateKey)

  return habits.map((habit) => {
    const completed = completedByHabit.get(habit.id) ?? new Set<string>()
    // Las claves `YYYY-MM-DD` se comparan como texto, que en ese formato
    // equivale a compararlas como fechas.
    const startKey = toDateKey(new Date(habit.created_at))

    return {
      habit,
      isDoneToday: completed.has(todayKey),
      streak: calculateStreak(completed, today),
      daysSinceDone: daysSinceDone(completed, today, new Date(habit.created_at)),
      recentDays: window.map((dateKey) => ({
        dateKey,
        isDone: completed.has(dateKey),
        isEditable: dateKey >= startKey,
      })),
      consistency: calculateConsistency(
        completed,
        today,
        consistencyDayCount,
        new Date(habit.created_at),
      ),
    }
  })
}
