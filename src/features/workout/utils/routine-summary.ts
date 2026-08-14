import type {
  Routine,
  RoutineDay,
  RoutineDayUsage,
  RoutineExerciseWithExercise,
  RoutineSummary,
} from '../types/workout.types'

/**
 * Cada rutina con cuánta es y cuándo se usó por última vez.
 *
 * La lista sólo decía el nombre, y un nombre no responde a lo que uno se
 * pregunta al mirarla: **cuánta es** —días y ejercicios— y **si la sigue
 * usando**. Al lado, el historial cuenta hasta el volumen de cada sesión.
 *
 * Los ejercicios se cuentan **sumando los de todos sus días**, repetidos
 * incluidos: si el press de banca sale en dos días, son dos cosas que hacer en
 * la semana, no una.
 */
export function buildRoutineSummaries(
  routines: readonly Routine[],
  days: readonly RoutineDay[],
  exercises: readonly RoutineExerciseWithExercise[],
  usage: readonly RoutineDayUsage[],
): RoutineSummary[] {
  const exercisesByDay = new Map<string, number>()
  for (const exercise of exercises) {
    exercisesByDay.set(
      exercise.routine_day_id,
      (exercisesByDay.get(exercise.routine_day_id) ?? 0) + 1,
    )
  }

  // El uso llega de lo más reciente a lo más antiguo, así que el primero que
  // aparece de cada día es su última vez.
  const lastUseByDay = new Map<string, string>()
  for (const session of usage) {
    if (!session.routine_day_id || lastUseByDay.has(session.routine_day_id)) continue
    lastUseByDay.set(session.routine_day_id, session.ended_at ?? session.started_at)
  }

  return routines.map((routine) => {
    const ownDays = days.filter(({ routine_id }) => routine_id === routine.id)

    let exerciseCount = 0
    let lastUsedAt: string | null = null

    for (const day of ownDays) {
      exerciseCount += exercisesByDay.get(day.id) ?? 0

      const used = lastUseByDay.get(day.id)
      // La rutina se usó cuando se usó **cualquiera** de sus días.
      if (used && (!lastUsedAt || used > lastUsedAt)) lastUsedAt = used
    }

    return { routine, dayCount: ownDays.length, exerciseCount, lastUsedAt }
  })
}
