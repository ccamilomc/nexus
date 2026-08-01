import type { RoutineDaySnapshot } from '@/decision-engine'

import type { Routine, RoutineDay, RoutineExerciseWithExercise } from '../types/workout.types'

/** Series que se suponen cuando la rutina no las prescribe. */
const DEFAULT_SETS = 3

/**
 * Traduce las rutinas del usuario al contrato que entiende el motor.
 *
 * El motor no conoce las tablas de entrenamiento: recibe lo justo para elegir
 * un día y calcular cuánto duraría (ver docs/06). Se conserva **el orden** de
 * los ejercicios, porque de él depende que la versión corta se quede con los
 * básicos y no con los accesorios.
 */
export function buildRoutineDaySnapshots(
  routines: readonly Routine[],
  days: readonly RoutineDay[],
  exercises: readonly RoutineExerciseWithExercise[],
): readonly RoutineDaySnapshot[] {
  const routineNames = new Map(routines.map(({ id, name }) => [id, name]))

  const byDay = new Map<string, RoutineExerciseWithExercise[]>()
  for (const exercise of exercises) {
    const current = byDay.get(exercise.routine_day_id)
    if (current) current.push(exercise)
    else byDay.set(exercise.routine_day_id, [exercise])
  }

  return days
    .map((day) => ({
      id: day.id,
      routineName: routineNames.get(day.routine_id) ?? '',
      dayName: day.name,
      exercises: (byDay.get(day.id) ?? [])
        .slice()
        .sort((a, b) => a.order_index - b.order_index)
        .map((exercise) => ({
          name: exercise.exercise.name,
          sets: exercise.target_sets ?? DEFAULT_SETS,
        })),
    }))
    .filter(({ exercises: list }) => list.length > 0)
}
