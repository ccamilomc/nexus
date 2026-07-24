import { useQuery } from '@tanstack/react-query'

import { useAuth } from '@/core/auth'
import type { AppError } from '@/core/error'

import { SESSION_HISTORY_LIMIT } from '../constants/workout.constants'
import { workoutService } from '../services/workout.service'
import type { SessionDetail } from '../types/workout.types'
import { workoutKeys } from './workout.keys'

/** Entrenamientos terminados, del más reciente al más antiguo. */
export function useSessionHistory() {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery<SessionDetail[], AppError>({
    queryKey: workoutKeys.history(userId),
    queryFn: () => (userId ? workoutService.getSessionHistory(userId, SESSION_HISTORY_LIMIT) : []),
  })
}
