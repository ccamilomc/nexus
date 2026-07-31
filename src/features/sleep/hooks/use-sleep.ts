import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { useAuth } from '@/core/auth'
import { type AppError, createAppError } from '@/core/error'

import type { LogSleepValues } from '../schemas/sleep.schema'
import { sleepService } from '../services/sleep.service'
import type { SleepHistory, SleepLog } from '../types/sleep.types'

export const sleepKeys = {
  all: ['sleep'] as const,
  lastNight: (userId: string | undefined, dayKey: string) =>
    [...sleepKeys.all, 'last-night', userId, dayKey] as const,
  history: (userId: string | undefined) => [...sleepKeys.all, 'history', userId] as const,
}

/** Las escrituras necesitan usuario; sin él, la sesión caducó. */
function requireUserId(userId: string | undefined): string {
  if (!userId) throw createAppError('auth')
  return userId
}

/** Clave estable del día (local), para no depender de la hora. */
function toDayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

/** Lo dormido anoche. */
export function useLastNight(today: Date) {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery<SleepLog | null, AppError>({
    queryKey: sleepKeys.lastNight(userId, toDayKey(today)),
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

/** Refresca el módulo entero tras cualquier cambio. */
function useRefreshSleep() {
  const queryClient = useQueryClient()

  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: sleepKeys.all }),
    [queryClient],
  )
}

/** Registra o corrige la noche. */
export function useLogSleep(today: Date) {
  const { user } = useAuth()
  const refresh = useRefreshSleep()

  return useMutation<void, AppError, LogSleepValues>({
    mutationFn: (values) => sleepService.logSleep(requireUserId(user?.id), today, values),
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
