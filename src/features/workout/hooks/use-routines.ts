import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/core/auth'
import type { AppError } from '@/core/error'

import type { CreateRoutineValues } from '../schemas/workout.schema'
import { workoutService } from '../services/workout.service'
import type { Routine, RoutineSummary } from '../types/workout.types'
import { requireUserId } from './require-user-id'
import { workoutKeys } from './workout.keys'

/**
 * Las rutinas con cuánta es cada una y cuándo se usó.
 *
 * Su clave cuelga de `sessions()` además de las rutinas: terminar un
 * entrenamiento cambia el «última vez», aunque la rutina no se haya tocado.
 */
export function useRoutineSummaries() {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery<RoutineSummary[], AppError>({
    queryKey: workoutKeys.routineSummaries(userId),
    queryFn: () => (userId ? workoutService.getRoutineSummaries(userId) : []),
  })
}

/** Crea una rutina y refresca la lista. */
export function useCreateRoutine() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation<Routine, AppError, CreateRoutineValues>({
    mutationFn: (values) => workoutService.createRoutine(requireUserId(user?.id), values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workoutKeys.routines(user?.id) }),
  })
}

/** Borra una rutina y refresca la lista. */
export function useDeleteRoutine() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation<void, AppError, string>({
    mutationFn: (routineId) => workoutService.deleteRoutine(routineId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workoutKeys.routines(user?.id) }),
  })
}
