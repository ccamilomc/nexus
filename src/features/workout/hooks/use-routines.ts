import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/core/auth'
import type { AppError } from '@/core/error'

import type { CreateRoutineValues } from '../schemas/workout.schema'
import { workoutService } from '../services/workout.service'
import type { Routine } from '../types/workout.types'
import { requireUserId } from './require-user-id'
import { workoutKeys } from './workout.keys'

/** Rutinas del usuario. Server state vía TanStack Query. */
export function useRoutines() {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery<Routine[], AppError>({
    queryKey: workoutKeys.routines(userId),
    queryFn: () => (userId ? workoutService.getRoutines(userId) : []),
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
