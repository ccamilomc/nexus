import { toDateKey } from '@/shared/utils'

import type { Habit, HabitLog, HabitsPeriodSeries, StreakRun } from '../types/habits.types'
import { appliesOn } from './applies-on'

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
 * Qué días cuentan para cada hábito lo decide `appliesOn`, igual que en la
 * pantalla de hábitos: ni antes de crearlo ni los días que no le tocan.
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

  return {
    points: current.points,
    completionPercent: current.percent,
    previousCompletionPercent: previous.percent,
    perfectDays: current.perfectDays,
    previousPerfectDays: previous.perfectDays,
    hardest: hardestOf(habits, completed, days),
    bestStreak: longestRunOf(habits, completed, days),
  }
}

/**
 * La racha mas larga del periodo, con los dias en que fue.
 *
 * **La mas larga del tramo, no la que siguiera viva al acabar.** Esta pantalla
 * cuenta como fue el periodo: quien encadeno ocho dias a principios de mes y
 * luego lo dejo, encadeno ocho, y decir «3» porque son los que quedaban en pie
 * el ultimo dia borra lo unico que habia que contar. En «Hoy» la racha si es la
 * viva, porque alli la pregunta es como va la cosa ahora mismo.
 *
 * Se devuelven las fechas porque **saber cuando se fue bien es lo accionable**:
 * el numero solo felicita, el tramo invita a mirar que tenia de distinto esa
 * semana. Ademas distingue de un vistazo esta cifra de la de «Hoy».
 *
 * Cada habito lleva su propia cuenta: una racha es de un habito, no del
 * conjunto —eso ya lo cuentan los dias perfectos—.
 */
function longestRunOf(
  habits: readonly Habit[],
  completed: ReadonlyMap<string, ReadonlySet<string>>,
  days: readonly Date[],
): StreakRun | null {
  const dateKeys = days.map(toDateKey)
  let longest: StreakRun | null = null

  for (const habit of habits) {
    const dates = completed.get(habit.id)
    let start: string | null = null
    let length = 0

    for (const [index, dateKey] of dateKeys.entries()) {
      const day = days[index]
      // Un día que no toca ni suma ni corta: la racha de un hábito de lunes,
      // miércoles y viernes sobrevive al martes.
      if (day && !appliesOn(habit, day)) continue

      if (dates?.has(dateKey)) {
        start ??= dateKey
        length += 1
        if (!longest || length > longest.days) {
          longest = { days: length, from: start, to: dateKey }
        }
      } else {
        start = null
        length = 0
      }
    }
  }

  return longest
}

/**
 * El habito con menos cumplimiento del periodo, y cuanto.
 *
 * Es la pregunta que la constancia global no contesta: un 63 % puede ser tres
 * habitos a medias o dos perfectos y uno abandonado, y **lo que se hace con esa
 * informacion es distinto**. Simetrico con la materia mas estudiada.
 *
 * Se dice el dato y no se juzga —«40 % de los dias», no «el que mas fallas»—,
 * que es como habla el resto de la aplicacion.
 *
 * Cuenta sólo los días que le tocan a cada hábito, como el resto de cifras, y
 * devuelve `null` con menos de dos hábitos: con uno solo, «el que menos» sería
 * la constancia global dicha dos veces.
 */
function hardestOf(
  habits: readonly Habit[],
  completed: ReadonlyMap<string, ReadonlySet<string>>,
  days: readonly Date[],
): { readonly name: string; readonly percent: number } | null {
  if (habits.length < 2) return null

  let hardest: { name: string; percent: number } | null = null

  for (const habit of habits) {
    const due = days.filter((day) => appliesOn(habit, day)).map(toDateKey)
    if (due.length === 0) continue

    const done = due.filter((dateKey) => completed.get(habit.id)?.has(dateKey)).length
    const percent = Math.round((done / due.length) * 100)

    if (!hardest || percent < hardest.percent) hardest = { name: habit.name, percent }
  }

  return hardest
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
      if (!appliesOn(habit, day)) continue

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
