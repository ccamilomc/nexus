import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { useAuth } from '@/core/auth'
import { type AppError, createAppError } from '@/core/error'
import { toDateKey } from '@/shared/utils'

import type { LogSleepValues, SleepGoalValues } from '../schemas/sleep.schema'
import { sleepService } from '../services/sleep.service'
import type { SleepGoal, SleepHistory, SleepLog } from '../types/sleep.types'

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

/** Registra o corrige una noche; cuál es va en los propios valores. */
export function useLogSleep() {
  const { user } = useAuth()
  const refresh = useRefreshSleep()

  return useMutation<void, AppError, LogSleepValues>({
    mutationFn: (values) => sleepService.logSleep(requireUserId(user?.id), values),
    onSuccess: refresh,
  })
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
