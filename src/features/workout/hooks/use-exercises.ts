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

/** Invalida el catálogo tras crear, editar o borrar un ejercicio. */
function useRefreshExercises() {
  const queryClient = useQueryClient()

  return () => queryClient.invalidateQueries({ queryKey: workoutKeys.exercises() })
}

/** Crea un ejercicio propio y refresca el catálogo. */
export function useCreateExercise() {
  const { user } = useAuth()
  const refresh = useRefreshExercises()

  return useMutation<Exercise, AppError, CreateExerciseValues>({
    mutationFn: (values) => workoutService.createExercise(requireUserId(user?.id), values),
    onSuccess: refresh,
  })
}

interface UpdateExerciseInput {
  readonly exerciseId: string
  readonly values: CreateExerciseValues
}

/** Edita un ejercicio propio y refresca el catálogo. */
export function useUpdateExercise() {
  const refresh = useRefreshExercises()

  return useMutation<Exercise, AppError, UpdateExerciseInput>({
    mutationFn: ({ exerciseId, values }) => workoutService.updateExercise(exerciseId, values),
    onSuccess: refresh,
  })
}

/** Borra un ejercicio propio y refresca el catálogo. */
export function useDeleteExercise() {
  const refresh = useRefreshExercises()

  return useMutation<void, AppError, string>({
    mutationFn: (exerciseId) => workoutService.deleteExercise(exerciseId),
    onSuccess: refresh,
  })
}
