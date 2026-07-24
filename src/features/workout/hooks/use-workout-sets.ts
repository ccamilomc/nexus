import { useMutation } from '@tanstack/react-query'

import type { AppError } from '@/core/error'

import { workoutService } from '../services/workout.service'
import type { LogSetInput } from '../types/workout.types'
import { useRefreshSessions } from './use-active-session'

/** Registra una serie (repeticiones y peso) en el entrenamiento en curso. */
export function useLogSet() {
  const refreshSessions = useRefreshSessions()

  return useMutation<void, AppError, LogSetInput>({
    mutationFn: (input) => workoutService.logSet(input),
    onSuccess: refreshSessions,
  })
}

/** Elimina una serie registrada por error. */
export function useRemoveSet() {
  const refreshSessions = useRefreshSessions()

  return useMutation<void, AppError, string>({
    mutationFn: (setId) => workoutService.removeSet(setId),
    onSuccess: refreshSessions,
  })
}
