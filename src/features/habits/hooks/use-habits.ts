import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { useAuth } from '@/core/auth'
import { type AppError, createAppError } from '@/core/error'
import { OFFLINE_MUTATIONS } from '@/core/offline'
import { toDateKey } from '@/shared/utils'

import type { CreateHabitValues } from '../schemas/habits.schema'
import type { ToggleHabitInput } from '../services/habits.service'
import { habitsService } from '../services/habits.service'
import type { Habit, HabitToday } from '../types/habits.types'
import { toggleHabitDay } from '../utils/toggle-today'

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

interface UpdateHabitVariables {
  readonly habitId: string
  readonly values: CreateHabitValues
}

/** Cambia el nombre o la nota de un hábito, sin tocar su historial. */
export function useUpdateHabit() {
  const refresh = useRefreshHabits()

  return useMutation<Habit, AppError, UpdateHabitVariables>({
    mutationFn: ({ habitId, values }) => habitsService.updateHabit(habitId, values),
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

/** Lo que el componente necesita de la mutación, sin sus variables internas. */
interface ToggleHabitMutation {
  readonly isPending: boolean
  readonly error: AppError | null
  readonly mutate: (variables: ToggleHabitVariables) => void
}

/**
 * Marca o desmarca un hábito en un día.
 *
 * **Es el gesto más repetido de la aplicación y el más rápido**, así que
 * sobrevive a quedarse sin red (ADR-0011): el cuadrito cambia en el acto,
 * espera guardado y sale solo al recuperar la conexión.
 */
export function useToggleHabit(todayKey: string): ToggleHabitMutation {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const refresh = useRefreshHabits()
  const cacheKey = habitsKeys.today(user?.id, todayKey)

  const mutation = useMutation<void, AppError, ToggleHabitInput>({
    mutationKey: OFFLINE_MUTATIONS.toggleHabit,
    mutationFn: (input) => habitsService.toggleHabit(input),

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: cacheKey })
      const previous = queryClient.getQueryData<readonly HabitToday[]>(cacheKey)

      queryClient.setQueryData<readonly HabitToday[]>(cacheKey, (current) =>
        current?.map((entry) =>
          entry.habit.id === input.habitId
            ? toggleHabitDay(entry, input.dateKey, input.isDone)
            : entry,
        ),
      )

      return { previous }
    },

    // Si falla de verdad (sin red se pausa, no falla) se deshace: un hábito que
    // parece hecho y no lo está estropea la racha, que es lo que se mira.
    onError: (_error, _input, context) => {
      const previous = (context as { previous?: readonly HabitToday[] } | undefined)?.previous
      if (previous !== undefined) queryClient.setQueryData(cacheKey, previous)
    },

    onSettled: refresh,
  })

  const { mutate } = mutation

  return {
    // Pausada no es «en marcha»: sin red el día ya está guardado, y bloquear
    // impediría marcar el resto de hábitos de la mañana.
    isPending: mutation.isPending && !mutation.isPaused,
    error: mutation.error,

    mutate: useCallback(
      (variables) => {
        mutate({ ...variables, id: crypto.randomUUID(), userId: requireUserId(user?.id) })
      },
      [mutate, user?.id],
    ),
  }
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

/** Borra del todo un hábito que nunca se llegó a marcar. */
export function useDeleteHabit() {
  const refresh = useRefreshHabits()

  return useMutation<void, AppError, string>({
    mutationFn: (habitId) => habitsService.deleteHabit(habitId),
    onSuccess: refresh,
  })
}
