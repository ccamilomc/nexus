import { useQuery } from '@tanstack/react-query'

import { workoutService } from '../services/workout.service'

export const workoutKeys = {
  all: ['workout'] as const,
  exercises: ['workout', 'exercises'] as const,
}

/** Catálogo de ejercicios (globales + propios). Server state vía TanStack Query. */
export function useExercises() {
  return useQuery({
    queryKey: workoutKeys.exercises,
    queryFn: () => workoutService.getExercises(),
  })
}
