import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { useAuth } from '@/core/auth'
import { type AppError, createAppError } from '@/core/error'
import { OFFLINE_MUTATIONS } from '@/core/offline'
import { toDateKey } from '@/shared/utils'

import type { LogSleepValues, SleepGoalValues } from '../schemas/sleep.schema'
import { sleepService } from '../services/sleep.service'
import type { LogSleepInput, SleepGoal, SleepHistory, SleepLog } from '../types/sleep.types'
import { buildLogSleepInput } from '../utils/sleep-input'

export const sleepKeys = {
  all: ['sleep'] as const,
  lastNight: (userId: string | undefined, dayKey: string) =>
    [...sleepKeys.all, 'last-night', userId, dayKey] as const,
  history: (userId: string | undefined) => [...sleepKeys.all, 'history', userId] as const,
  goal: (userId: string | undefined) => [...sleepKeys.all, 'goal', userId] as const,
  series: (userId: string | undefined, rangeKey: string, previousKey: string) =>
    [...sleepKeys.all, 'series', userId, rangeKey, previousKey] as const,
}

/** Las escrituras necesitan usuario; sin él, la sesión caducó. */
function requireUserId(userId: string | undefined): string {
  if (!userId) throw createAppError('auth')
  return userId
}

/** Lo dormido anoche. */
export function useLastNight(today: Date) {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery<SleepLog | null, AppError>({
    queryKey: sleepKeys.lastNight(userId, toDateKey(today)),
    queryFn: () => (userId ? sleepService.getLastNight(userId, today) : null),
  })
}

/** Las últimas noches, con sus medias. */
export function useSleepHistory() {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery<SleepHistory | null, AppError>({
    queryKey: sleepKeys.history(userId),
    queryFn: () => (userId ? sleepService.getHistory(userId) : null),
  })
}

/** Cuánto quiere dormir el usuario. `null` si no lo ha fijado. */
export function useSleepGoal() {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery<SleepGoal | null, AppError>({
    queryKey: sleepKeys.goal(userId),
    queryFn: () => (userId ? sleepService.getActiveGoal(userId) : null),
  })
}

/** Refresca el módulo entero tras cualquier cambio. */
function useRefreshSleep() {
  const queryClient = useQueryClient()

  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: sleepKeys.all }),
    [queryClient],
  )
}

/** Lo que el formulario necesita, sin las variables internas de la mutación. */
interface LogSleepMutation {
  readonly isPending: boolean
  readonly error: AppError | null
  /**
   * `onApuntado` corre **en cuanto la noche queda a salvo**, esté enviada o
   * esperando red. No es `onSuccess`: una mutación pausada nunca lo llamaría.
   */
  readonly mutate: (values: LogSleepValues, options?: { readonly onApuntado?: () => void }) => void
}

/**
 * Registra o corrige una noche; cuál es va en los propios valores.
 *
 * Sobrevive a quedarse sin red (ADR-0011). Es el registro **menos** probable
 * fuera de casa —se apunta al despertar, con el wifi al lado—, pero cuesta lo
 * mismo que los demás y la regla es que registrar nunca dependa de la conexión.
 */
export function useLogSleep(today: Date): LogSleepMutation {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const refresh = useRefreshSleep()
  const lastNightKey = sleepKeys.lastNight(user?.id, toDateKey(today))

  const mutation = useMutation<void, AppError, LogSleepInput>({
    mutationKey: OFFLINE_MUTATIONS.logSleep,
    mutationFn: (input) => sleepService.logSleep(input),

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: lastNightKey })
      const previous = queryClient.getQueryData<SleepLog | null>(lastNightKey)

      // Sólo la tarjeta de anoche, y sólo si es esa noche: corrigiendo una
      // pasada, lo que cambia está en el historial y ahí no hay nada que
      // adelantar sin recolocar la lista entera.
      if (previous?.date === input.dateKey || (previous === null && isTodayKey(input, today))) {
        queryClient.setQueryData<SleepLog | null>(lastNightKey, (current) =>
          toOptimisticLog(current ?? null, input),
        )
      }

      return { previous }
    },

    // Si falla de verdad (sin red se pausa, no falla) se deshace: una noche que
    // no existe descuadra la media y el avance hacia el objetivo.
    onError: (_error, _input, context) => {
      const previous = (context as { previous?: SleepLog | null } | undefined)?.previous
      if (previous !== undefined) queryClient.setQueryData(lastNightKey, previous)
    },

    onSettled: refresh,
  })

  const { mutate } = mutation

  return {
    isPending: mutation.isPending && !mutation.isPaused,
    error: mutation.error,

    mutate: useCallback(
      (values, options) => {
        mutate(
          buildLogSleepInput({
            id: crypto.randomUUID(),
            userId: requireUserId(user?.id),
            values,
          }),
        )
        options?.onApuntado?.()
      },
      [mutate, user?.id],
    ),
  }
}

/** Si lo que se apunta es la noche que enseña la tarjeta de anoche. */
function isTodayKey(input: LogSleepInput, today: Date): boolean {
  return input.dateKey === toDateKey(today)
}

/** La noche con lo recién apuntado, conservando lo que ya tuviera. */
function toOptimisticLog(current: SleepLog | null, input: LogSleepInput): SleepLog {
  const now = new Date().toISOString()

  return {
    ...(current ?? {
      id: input.id,
      user_id: input.userId,
      date: input.dateKey,
      kind: input.kind,
      interruptions: 0,
      notes: null,
      deleted_at: null,
      created_at: now,
    }),
    bedtime: input.bedtimeIso,
    wake_time: input.wakeTimeIso,
    duration_minutes: input.minutes,
    quality_rating: input.qualityRating,
    updated_at: now,
  }
}

/** Fija cuánto quieres dormir. Jubila el objetivo anterior. */
export function useSaveSleepGoal() {
  const { user } = useAuth()
  const refresh = useRefreshSleep()

  return useMutation<SleepGoal, AppError, SleepGoalValues>({
    mutationFn: (values) => sleepService.saveGoal(requireUserId(user?.id), values),
    onSuccess: refresh,
  })
}

/** Quita una noche apuntada por error. */
export function useRemoveSleepLog() {
  const refresh = useRefreshSleep()

  return useMutation<void, AppError, string>({
    mutationFn: (logId) => sleepService.removeLog(logId),
    onSuccess: refresh,
  })
}
