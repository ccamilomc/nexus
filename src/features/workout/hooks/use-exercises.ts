import { useQuery } from '@tanstack/react-query'

import type { AppError } from '@/core/error'

import { workoutService } from '../services/workout.service'
import type { Exercise } from '../types/workout.types'
import { workoutKeys } from './workout.keys'

/** Catálogo de ejercicios (globales + propios). Server state vía TanStack Query. */
export function useExercises() {
  return useQuery<Exercise[], AppError>({
    queryKey: workoutKeys.exercises(),
    queryFn: () => workoutService.getExercises(),
  })
}
