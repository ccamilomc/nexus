import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/core/auth'
import type { AppError } from '@/core/error'

import type { CreateExerciseValues } from '../schemas/workout.schema'
import { workoutService } from '../services/workout.service'
import type { Exercise } from '../types/workout.types'
import { requireUserId } from './require-user-id'
import { workoutKeys } from './workout.keys'

/** Catálogo de ejercicios (globales + propios). Server state vía TanStack Query. */
export function useExercises() {
  return useQuery<Exercise[], AppError>({
    queryKey: workoutKeys.exercises(),
    queryFn: () => workoutService.getExercises(),
  })
}

/** Crea un ejercicio propio y refresca el catálogo. */
export function useCreateExercise() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation<Exercise, AppError, CreateExerciseValues>({
    mutationFn: (values) => workoutService.createExercise(requireUserId(user?.id), values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workoutKeys.exercises() }),
  })
}
