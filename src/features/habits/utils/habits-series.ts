import { toDateKey } from '@/shared/utils'

import type { Habit, HabitLog, HabitsPeriodSeries } from '../types/habits.types'
import { calculateStreak } from './streak'

/** Un día con su recuento de hábitos cumplidos frente a los que tocaban. */
interface DayTally {
  readonly done: number
  readonly due: number
}

/**
 * Arma la serie de hábitos de un periodo y las cifras del tramo anterior.
 *
 * El valor de cada día es el **porcentaje de hábitos cumplidos de los que
 * tocaban ese día**, no el número absoluto: pasar de tres a cinco hábitos
 * hundiría una gráfica de cuenta absoluta justo cuando el usuario se propone
 * más cosas, que es lo contrario de lo que ocurrió.
 *
 * Un hábito sólo cuenta desde el día en que se creó. Es la misma regla que ya
 * aplica `calculateConsistency`: penalizar días en los que el hábito no existía
 * sería falso y castigaría precisamente al empezar.
 *
 * Los días **sin ningún hábito vigente** quedan como hueco, no como cero: no se
 * incumplió nada, es que no había nada que cumplir.
 */
export function buildHabitsSeries(
  habits: readonly Habit[],
  logs: readonly HabitLog[],
  days: readonly Date[],
  previousDays: readonly Date[],
): HabitsPeriodSeries {
  const completed = completedByHabit(logs)

  const current = summarize(habits, completed, days)
  const previous = summarize(habits, completed, previousDays)

  const streaks = habits.map((habit) =>
    calculateStreak(completed.get(habit.id) ?? new Set(), lastDayOf(days)),
  )

  return {
    points: current.points,
    completionPercent: current.percent,
    previousCompletionPercent: previous.percent,
    perfectDays: current.perfectDays,
    previousPerfectDays: previous.perfectDays,
    trackedHabits: habits.length,
    bestStreak: streaks.length === 0 ? 0 : Math.max(...streaks),
  }
}

/** Fechas cumplidas de cada hábito, que es lo que consultan los cálculos. */
function completedByHabit(logs: readonly HabitLog[]): Map<string, Set<string>> {
  const byHabit = new Map<string, Set<string>>()

  for (const log of logs) {
    if (!log.completed) continue

    const dates = byHabit.get(log.habit_id)
    if (dates) dates.add(log.date)
    else byHabit.set(log.habit_id, new Set([log.date]))
  }

  return byHabit
}

function summarize(
  habits: readonly Habit[],
  completed: ReadonlyMap<string, ReadonlySet<string>>,
  days: readonly Date[],
) {
  const tallies = days.map<DayTally>((day) => {
    const dateKey = toDateKey(day)

    let done = 0
    let due = 0
    for (const habit of habits) {
      // Las claves `YYYY-MM-DD` se comparan como texto, que en ese formato
      // equivale a compararlas como fechas.
      if (dateKey < toDateKey(new Date(habit.created_at))) continue

      due += 1
      if (completed.get(habit.id)?.has(dateKey)) done += 1
    }

    return { done, due }
  })

  const points = days.map((day, index) => {
    const tally = tallies[index]
    const dateKey = toDateKey(day)

    return {
      dateKey,
      value: !tally || tally.due === 0 ? null : Math.round((tally.done / tally.due) * 100),
    }
  })

  const withHabits = tallies.filter(({ due }) => due > 0)
  const totalDone = withHabits.reduce((total, { done }) => total + done, 0)
  const totalDue = withHabits.reduce((total, { due }) => total + due, 0)

  return {
    points,
    percent: totalDue === 0 ? null : Math.round((totalDone / totalDue) * 100),
    perfectDays: withHabits.filter(({ done, due }) => done === due).length,
  }
}

/** El último día del tramo; las rachas se miran desde ahí, no desde hoy. */
function lastDayOf(days: readonly Date[]): Date {
  return days[days.length - 1] ?? new Date(0)
}
