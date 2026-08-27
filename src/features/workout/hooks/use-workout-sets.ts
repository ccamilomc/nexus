import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { useAuth } from '@/core/auth'
import type { AppError } from '@/core/error'
import { OFFLINE_MUTATIONS } from '@/core/offline'
import { useNow } from '@/core/time'

import { workoutService } from '../services/workout.service'
import type { Exercise, LogSetInput, SessionDetail } from '../types/workout.types'
import { addSetToSession, findExerciseRef, nextSetNumber } from '../utils/add-set'
import { requireUserId } from './require-user-id'
import { useRefreshSessions } from './use-active-session'
import { workoutKeys } from './workout.keys'

/**
 * Lo que se pide registrar: qué serie y en qué ejercicio.
 *
 * No es `LogSetValues` del esquema, que es sólo lo que el formulario valida
 * (repeticiones y peso); aquí van además la sesión y el ejercicio.
 */
export interface LogSetRequest {
  readonly sessionId: string
  readonly exerciseId: string
  readonly reps: number
  readonly weightKg: number
  /** Si fue de calentamiento: no cuenta para el volumen ni para el progreso. */
  readonly isWarmup: boolean
  /** El esfuerzo en RPE, o `null` si no se contestó. */
  readonly rpe: number | null
}

/** Lo que el componente necesita de la mutación, sin sus variables internas. */
interface LogSetMutation {
  readonly isPending: boolean
  readonly error: AppError | null
  readonly mutate: (values: LogSetRequest, options?: { readonly onSuccess?: () => void }) => void
}

/**
 * Registra una serie (repeticiones y peso) en el entrenamiento en curso.
 *
 * **Se apunta en el gimnasio, que es donde peor va la señal**, así que sobrevive
 * a quedarse sin red (ADR-0011): la serie se ve en el acto, espera guardada y
 * sale sola al recuperar la conexión.
 *
 * El número de serie y el id se resuelven aquí, con la sesión que ya está en
 * pantalla, en vez de preguntárselos a la base antes de cada inserción.
 */
export function useLogSet(): LogSetMutation {
  const { user } = useAuth()
  const now = useNow()
  const queryClient = useQueryClient()
  const refreshSessions = useRefreshSessions()
  const activeKey = workoutKeys.activeSession(user?.id)

  const mutation = useMutation<void, AppError, LogSetInput>({
    mutationKey: OFFLINE_MUTATIONS.logSet,
    mutationFn: (input) => workoutService.logSet(input),

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: activeKey })
      const previous = queryClient.getQueryData<SessionDetail | null>(activeKey)
      const catalogue = queryClient.getQueryData<Exercise[]>(workoutKeys.exercises())
      const exercise = findExerciseRef(previous ?? null, catalogue, input.exerciseId)

      if (previous && exercise) {
        queryClient.setQueryData<SessionDetail | null>(
          activeKey,
          addSetToSession(previous, input, exercise),
        )
      }

      return { previous }
    },

    // Si falla de verdad (sin red se pausa, no falla) se deshace: una serie en
    // pantalla que no existe se acaba repitiendo, y eso sí estropea el registro.
    onError: (_error, _input, context) => {
      const previous = (context as { previous?: SessionDetail | null } | undefined)?.previous
      if (previous !== undefined) queryClient.setQueryData(activeKey, previous)
    },

    onSettled: refreshSessions,
  })

  const { mutate } = mutation

  return {
    // Pausada no es «en marcha»: sin red la serie ya está guardada, y bloquear
    // el formulario impediría apuntar la siguiente en pleno entrenamiento.
    isPending: mutation.isPending && !mutation.isPaused,
    error: mutation.error,

    mutate: useCallback(
      (values, options) => {
        const session = queryClient.getQueryData<SessionDetail | null>(activeKey) ?? null

        mutate(
          {
            ...values,
            id: crypto.randomUUID(),
            userId: requireUserId(user?.id),
            setNumber: nextSetNumber(session, values.exerciseId),
            loggedAt: now.toISOString(),
          },
          options,
        )
      },
      [mutate, queryClient, activeKey, user?.id, now],
    ),
  }
}

/** Elimina una serie registrada por error. */
export function useRemoveSet() {
  const refreshSessions = useRefreshSessions()

  return useMutation<void, AppError, string>({
    mutationFn: (setId) => workoutService.removeSet(setId),
    onSuccess: refreshSessions,
  })
}
