import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { useAuth } from '@/core/auth'
import { type AppError, createAppError } from '@/core/error'
import { toDateKey } from '@/shared/utils'

import type { CreateHabitValues } from '../schemas/habits.schema'
import { habitsService } from '../services/habits.service'
import type { Habit, HabitToday } from '../types/habits.types'

export const habitsKeys = {
  all: ['habits'] as const,
  today: (userId: string | undefined, dateKey: string) =>
    [...habitsKeys.all, 'today', userId, dateKey] as const,
  archived: (userId: string | undefined) => [...habitsKeys.all, 'archived', userId] as const,
  series: (userId: string | undefined, rangeKey: string, previousKey: string) =>
    [...habitsKeys.all, 'series', userId, rangeKey, previousKey] as const,
}

/** Las escrituras necesitan usuario; sin él, la sesión caducó. */
function requireUserId(userId: string | undefined): string {
  if (!userId) throw createAppError('auth')
  return userId
}

/** Hábitos activos con su estado de hoy. */
export function useHabitsToday(today: Date) {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery<readonly HabitToday[], AppError>({
    queryKey: habitsKeys.today(userId, toDateKey(today)),
    queryFn: () => (userId ? habitsService.getHabitsToday(userId, today) : []),
  })
}

/** Refresca los hábitos tras cualquier cambio. */
function useRefreshHabits() {
  const queryClient = useQueryClient()

  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: habitsKeys.all }),
    [queryClient],
  )
}

/** Crea un hábito. */
export function useCreateHabit() {
  const { user } = useAuth()
  const refresh = useRefreshHabits()

  return useMutation<Habit, AppError, CreateHabitValues>({
    mutationFn: (values) => habitsService.createHabit(requireUserId(user?.id), values),
    onSuccess: refresh,
  })
}

interface ToggleHabitVariables {
  readonly habitId: string
  /** Día a marcar, en `YYYY-MM-DD`: puede ser hoy o uno ya pasado. */
  readonly dateKey: string
  /** Estado **actual**: el servicio lo invierte. */
  readonly isDone: boolean
}

/** Marca o desmarca un hábito en un día. */
export function useToggleHabit() {
  const { user } = useAuth()
  const refresh = useRefreshHabits()

  return useMutation<void, AppError, ToggleHabitVariables>({
    mutationFn: ({ habitId, dateKey, isDone }) =>
      habitsService.toggleHabit(requireUserId(user?.id), habitId, dateKey, isDone),
    onSuccess: refresh,
  })
}

/** Archiva un hábito. */
export function useArchiveHabit() {
  const refresh = useRefreshHabits()

  return useMutation<void, AppError, string>({
    mutationFn: (habitId) => habitsService.archiveHabit(habitId),
    onSuccess: refresh,
  })
}

/**
 * Hábitos archivados.
 *
 * Sólo se consultan cuando alguien los pide (`enabled`): la pantalla de cada
 * día no tiene por qué pagar una consulta por algo que casi nunca se mira.
 */
export function useArchivedHabits(enabled: boolean) {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery<readonly Habit[], AppError>({
    queryKey: habitsKeys.archived(userId),
    queryFn: () => (userId ? habitsService.getArchivedHabits(userId) : []),
    enabled,
  })
}

/** Devuelve un hábito archivado a la lista. */
export function useRestoreHabit() {
  const refresh = useRefreshHabits()

  return useMutation<void, AppError, string>({
    mutationFn: (habitId) => habitsService.restoreHabit(habitId),
    onSuccess: refresh,
  })
}
