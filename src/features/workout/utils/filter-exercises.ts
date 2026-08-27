import { matchesQuery } from '@/shared/utils'

import type { Exercise } from '../types/workout.types'

/** Lo que se puede acotar del catálogo. Vacío significa «todos». */
export interface ExerciseFilters {
  readonly query: string
  readonly muscleGroup: Exercise['muscle_group'] | ''
  readonly equipment: Exercise['equipment'] | ''
}

export const NO_FILTERS: ExerciseFilters = { query: '', muscleGroup: '', equipment: '' }

/**
 * El catálogo acotado a lo que se está buscando.
 *
 * Hace falta desde que el catálogo pasó de trece ejercicios a setenta: la
 * pantalla medía más de cinco mil píxeles y encontrar uno era bajar hasta verlo.
 *
 * **El equipo importa tanto como el músculo**, y por eso se filtra por los dos:
 * quien entrena en un gimnasio sin poleas, o en casa con mancuernas, necesita
 * ver lo que puede hacer hoy, no todo lo que existe.
 */
export function filterExercises(
  exercises: readonly Exercise[],
  { query, muscleGroup, equipment }: ExerciseFilters,
): Exercise[] {
  return exercises.filter(
    (exercise) =>
      matchesQuery(exercise.name, query) &&
      (muscleGroup === '' || exercise.muscle_group === muscleGroup) &&
      (equipment === '' || exercise.equipment === equipment),
  )
}
