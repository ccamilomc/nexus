import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/core/auth'
import type { AppError } from '@/core/error'
import type { RoutineDaySnapshot } from '@/decision-engine'

import { workoutService } from '../services/workout.service'
import { workoutKeys } from './workout.keys'

/**
 * Los días de rutina del usuario, en el contrato que entiende el motor.
 *
 * Lo consume `useWorkoutContext` para que `alternative-routine` pueda proponer
 * una versión corta de lo que estaba planeado.
 */
export function useRoutineDays() {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery<readonly RoutineDaySnapshot[], AppError>({
    queryKey: workoutKeys.routineDays(userId),
    queryFn: () => (userId ? workoutService.getRoutineDays(userId) : []),
  })
}
