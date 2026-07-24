import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { useAuth } from '@/core/auth'
import { type AppError, createAppError } from '@/core/error'

import { workoutService } from '../services/workout.service'
import type { SessionDetail } from '../types/workout.types'
import { workoutKeys } from './workout.keys'

/**
 * Invalida sesión en curso e historial tras cualquier cambio.
 *
 * El servidor es la única fuente de verdad del entrenamiento: tras escribir se
 * vuelve a leer en lugar de mantener una copia en memoria.
 */
export function useRefreshSessions() {
  const queryClient = useQueryClient()

  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: workoutKeys.sessions() }),
    [queryClient],
  )
}

/** Entrenamiento en curso del usuario, o `null` si no hay ninguno. */
export function useActiveSession() {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery<SessionDetail | null, AppError>({
    queryKey: workoutKeys.activeSession(userId),
    queryFn: () => (userId ? workoutService.getActiveSession(userId) : null),
  })
}

/** Inicia un entrenamiento (o recupera el que ya estuviera en curso). */
export function useStartSession() {
  const { user } = useAuth()
  const refreshSessions = useRefreshSessions()

  return useMutation<SessionDetail, AppError, void>({
    mutationFn: () => workoutService.startSession(requireUserId(user?.id)),
    onSuccess: refreshSessions,
  })
}

/** Cierra el entrenamiento: pasa al historial. */
export function useFinishSession() {
  const refreshSessions = useRefreshSessions()

  return useMutation<void, AppError, string>({
    mutationFn: (sessionId) => workoutService.finishSession(sessionId),
    onSuccess: refreshSessions,
  })
}

/** Descarta el entrenamiento: no queda registrado. */
export function useDiscardSession() {
  const refreshSessions = useRefreshSessions()

  return useMutation<void, AppError, string>({
    mutationFn: (sessionId) => workoutService.discardSession(sessionId),
    onSuccess: refreshSessions,
  })
}

/**
 * Las escrituras necesitan un usuario. Las rutas ya están protegidas, así que
 * llegar aquí sin sesión sólo puede significar que caducó.
 */
function requireUserId(userId: string | undefined): string {
  if (!userId) throw createAppError('auth')
  return userId
}
