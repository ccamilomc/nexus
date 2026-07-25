import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { useAuth } from '@/core/auth'
import { type AppError, createAppError } from '@/core/error'

import type { CreateFoodValues } from '../schemas/nutrition.schema'
import type { AddFoodInput } from '../services/nutrition.service'
import { nutritionService } from '../services/nutrition.service'
import type { DayNutrition, Food, MealType } from '../types/nutrition.types'
import { nutritionKeys } from './nutrition.keys'

/** Las escrituras necesitan usuario; sin él, la sesión caducó. */
function requireUserId(userId: string | undefined): string {
  if (!userId) throw createAppError('auth')
  return userId
}

/** Clave estable del día (local), para no depender de la hora. */
function toDayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

/** Catálogo de alimentos (globales + propios). */
export function useFoods() {
  return useQuery<Food[], AppError>({
    queryKey: nutritionKeys.foods(),
    queryFn: () => nutritionService.getFoods(),
  })
}

/** Invalida el catálogo tras crear, editar o borrar un alimento. */
function useRefreshFoods() {
  const queryClient = useQueryClient()

  return useCallback(() => {
    // También lo consumido: un alimento editado cambia los macros del día.
    void queryClient.invalidateQueries({ queryKey: nutritionKeys.days() })
    return queryClient.invalidateQueries({ queryKey: nutritionKeys.foods() })
  }, [queryClient])
}

/** Crea un alimento propio. */
export function useCreateFood() {
  const { user } = useAuth()
  const refresh = useRefreshFoods()

  return useMutation<Food, AppError, CreateFoodValues>({
    mutationFn: (values) => nutritionService.createFood(requireUserId(user?.id), values),
    onSuccess: refresh,
  })
}

interface UpdateFoodVariables {
  readonly foodId: string
  readonly values: CreateFoodValues
}

/** Edita un alimento propio. */
export function useUpdateFood() {
  const refresh = useRefreshFoods()

  return useMutation<Food, AppError, UpdateFoodVariables>({
    mutationFn: ({ foodId, values }) => nutritionService.updateFood(foodId, values),
    onSuccess: refresh,
  })
}

/** Borra un alimento propio. */
export function useDeleteFood() {
  const refresh = useRefreshFoods()

  return useMutation<void, AppError, string>({
    mutationFn: (foodId) => nutritionService.deleteFood(foodId),
    onSuccess: refresh,
  })
}

/** Lo consumido en un día, con macros por comida y total. */
export function useDayNutrition(date: Date) {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery<DayNutrition | null, AppError>({
    queryKey: nutritionKeys.day(userId, toDayKey(date)),
    queryFn: () => (userId ? nutritionService.getDayNutrition(userId, date) : null),
  })
}

/** Refresca lo consumido tras cualquier cambio. */
function useRefreshDays() {
  const queryClient = useQueryClient()

  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: nutritionKeys.days() }),
    [queryClient],
  )
}

interface AddFoodVariables {
  readonly mealType: MealType
  readonly foodId: string
  readonly servings: number
}

/** Registra un alimento en una comida del día indicado. */
export function useAddFoodToMeal(date: Date) {
  const { user } = useAuth()
  const refresh = useRefreshDays()

  return useMutation<void, AppError, AddFoodVariables>({
    mutationFn: ({ mealType, foodId, servings }) =>
      nutritionService.addFoodToMeal({
        userId: requireUserId(user?.id),
        date,
        mealType,
        foodId,
        servings,
      } satisfies AddFoodInput),
    onSuccess: refresh,
  })
}

/** Quita un alimento registrado por error. */
export function useRemoveMealItem() {
  const refresh = useRefreshDays()

  return useMutation<void, AppError, string>({
    mutationFn: (itemId) => nutritionService.removeMealItem(itemId),
    onSuccess: refresh,
  })
}
