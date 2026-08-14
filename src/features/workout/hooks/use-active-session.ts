import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { useAuth } from '@/core/auth'
import type { AppError } from '@/core/error'

import type { PastSessionValues } from '../schemas/workout.schema'
import { workoutService } from '../services/workout.service'
import type { LastPerformance, SessionDetail } from '../types/workout.types'
import { requireUserId } from './require-user-id'
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

/**
 * Qué se hizo la última vez en cada ejercicio.
 *
 * Se pide una sola vez para toda la sesión, no por ejercicio: con cinco
 * ejercicios en pantalla serían cinco viajes para responder la misma pregunta.
 */
export function useLastPerformances() {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery<readonly LastPerformance[], AppError>({
    queryKey: workoutKeys.lastPerformances(userId),
    queryFn: () => (userId ? workoutService.getLastPerformances(userId) : []),
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

/** Abre un entrenamiento que ya se hizo, para apuntarlo después. */
export function useStartPastSession() {
  const { user } = useAuth()
  const refreshSessions = useRefreshSessions()

  return useMutation<SessionDetail, AppError, PastSessionValues>({
    mutationFn: (values) => workoutService.startPastSession(requireUserId(user?.id), values),
    onSuccess: refreshSessions,
  })
}

/** Inicia un entrenamiento siguiendo un día de rutina. */
export function useStartSessionFromRoutineDay() {
  const { user } = useAuth()
  const refreshSessions = useRefreshSessions()

  return useMutation<SessionDetail, AppError, string>({
    mutationFn: (routineDayId) =>
      workoutService.startSessionFromRoutineDay(requireUserId(user?.id), routineDayId),
    onSuccess: refreshSessions,
  })
}

/** Lo que hace falta para cerrar: el fin ya puesto se respeta. */
interface FinishSessionInput {
  readonly sessionId: string
  /** Fin que la sesión ya traía; `null` en un entrenamiento en directo. */
  readonly endedAt: string | null
}

/** Cierra el entrenamiento: pasa al historial. */
export function useFinishSession() {
  const refreshSessions = useRefreshSessions()

  return useMutation<void, AppError, FinishSessionInput>({
    mutationFn: ({ sessionId, endedAt }) => workoutService.finishSession(sessionId, endedAt),
    onSuccess: refreshSessions,
  })
}

/** Vuelve a abrir un entrenamiento del historial para corregirlo. */
export function useReopenSession() {
  const { user } = useAuth()
  const refreshSessions = useRefreshSessions()

  return useMutation<void, AppError, string>({
    mutationFn: (sessionId) => workoutService.reopenSession(requireUserId(user?.id), sessionId),
    onSuccess: refreshSessions,
  })
}

/** Quita un entrenamiento del historial. */
export function useRemoveSession() {
  const refreshSessions = useRefreshSessions()

  return useMutation<void, AppError, string>({
    mutationFn: (sessionId) => workoutService.removeSession(sessionId),
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
