import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import type { AppError } from '@/core/error'

import type { RoutineExerciseTargetsValues } from '../schemas/workout.schema'
import { workoutService } from '../services/workout.service'
import type { RoutineDetail } from '../types/workout.types'
import { workoutKeys } from './workout.keys'

/** Detalle de una rutina: sus días y ejercicios prescritos. */
export function useRoutineDetail(routineId: string) {
  return useQuery<RoutineDetail | null, AppError>({
    queryKey: workoutKeys.routine(routineId),
    queryFn: () => workoutService.getRoutineDetail(routineId),
  })
}

/**
 * Refresca el detalle de una rutina tras editarla.
 *
 * El servidor es la única fuente de verdad: tras escribir se vuelve a leer.
 */
function useRefreshRoutine(routineId: string) {
  const queryClient = useQueryClient()

  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: workoutKeys.routine(routineId) }),
    [queryClient, routineId],
  )
}

/** Añade un día a la rutina. */
export function useAddRoutineDay(routineId: string) {
  const refresh = useRefreshRoutine(routineId)

  return useMutation<void, AppError, string>({
    mutationFn: (name) => workoutService.addRoutineDay(routineId, name),
    onSuccess: refresh,
  })
}

/** Elimina un día (y, en cascada, sus ejercicios prescritos). */
export function useRemoveRoutineDay(routineId: string) {
  const refresh = useRefreshRoutine(routineId)

  return useMutation<void, AppError, string>({
    mutationFn: (dayId) => workoutService.removeRoutineDay(dayId),
    onSuccess: refresh,
  })
}

interface AddRoutineExerciseInput {
  readonly dayId: string
  readonly exerciseId: string
  readonly targets: RoutineExerciseTargetsValues
}

/** Prescribe un ejercicio en un día de la rutina. */
export function useAddRoutineExercise(routineId: string) {
  const refresh = useRefreshRoutine(routineId)

  return useMutation<void, AppError, AddRoutineExerciseInput>({
    mutationFn: ({ dayId, exerciseId, targets }) =>
      workoutService.addRoutineExercise(dayId, exerciseId, targets),
    onSuccess: refresh,
  })
}

/** Quita un ejercicio prescrito de un día. */
export function useRemoveRoutineExercise(routineId: string) {
  const refresh = useRefreshRoutine(routineId)

  return useMutation<void, AppError, string>({
    mutationFn: (routineExerciseId) => workoutService.removeRoutineExercise(routineExerciseId),
    onSuccess: refresh,
  })
}
