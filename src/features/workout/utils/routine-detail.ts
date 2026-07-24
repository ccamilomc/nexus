import type {
  Routine,
  RoutineDay,
  RoutineDetail,
  RoutineExerciseWithExercise,
} from '../types/workout.types'

/**
 * Compone una rutina con sus días y, dentro de cada día, sus ejercicios.
 *
 * Se asume que `days` y `exercises` llegan ya ordenados (por `order_index`): el
 * agrupado conserva ese orden. Un día sin ejercicios aparece con lista vacía.
 */
export function buildRoutineDetail(
  routine: Routine,
  days: readonly RoutineDay[],
  exercises: readonly RoutineExerciseWithExercise[],
): RoutineDetail {
  const byDay = new Map<string, RoutineExerciseWithExercise[]>()
  for (const exercise of exercises) {
    const current = byDay.get(exercise.routine_day_id)
    if (current) current.push(exercise)
    else byDay.set(exercise.routine_day_id, [exercise])
  }

  return {
    routine,
    days: days.map((day) => ({ day, exercises: byDay.get(day.id) ?? [] })),
  }
}
