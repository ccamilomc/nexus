import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { useAuth } from '@/core/auth'
import { type AppError, createAppError } from '@/core/error'
import { useNow } from '@/core/time'
import { toDateKey } from '@/shared/utils'

import type { CreateFoodValues, NutritionGoalValues } from '../schemas/nutrition.schema'
import type { AddFoodsInput } from '../services/nutrition.service'
import { nutritionService } from '../services/nutrition.service'
import type {
  DayNutrition,
  DayWater,
  Food,
  FoodPurchase,
  MealType,
  NutritionGoal,
  RepeatableMeals,
  RepricedFood,
  WeekNutrition,
} from '../types/nutrition.types'
import { nutritionKeys } from './nutrition.keys'

/** Las escrituras necesitan usuario; sin él, la sesión caducó. */
function requireUserId(userId: string | undefined): string {
  if (!userId) throw createAppError('auth')
  return userId
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

/**
 * Pone al día el precio de varios alimentos a partir de lo que se pagó.
 *
 * Es lo que finanzas invoca al apuntar el mercado. Refresca también lo comido,
 * porque un precio nuevo cambia lo que costó el día.
 */
export function useRepriceFoods() {
  const refresh = useRefreshFoods()

  return useMutation<RepricedFood[], AppError, readonly FoodPurchase[]>({
    mutationFn: (purchases) => nutritionService.repriceFoods(purchases),
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
    queryKey: nutritionKeys.day(userId, toDateKey(date)),
    queryFn: () => (userId ? nutritionService.getDayNutrition(userId, date) : null),
  })
}

/**
 * Cómo va la semana, en medias por día.
 *
 * `null` cuando aún no hay días suficientes que promediar: con uno solo, la
 * media sería el día que ya está encima en la pantalla.
 */
export function useWeekNutrition(date: Date) {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery<WeekNutrition | null, AppError>({
    queryKey: nutritionKeys.week(userId, toDateKey(date)),
    queryFn: () => (userId ? nutritionService.getWeekNutrition(userId, date) : null),
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

interface AddFoodsVariables {
  readonly mealType: MealType
  readonly items: readonly { readonly foodId: string; readonly servings: number }[]
}

/** Registra los alimentos elegidos en una comida del día indicado. */
export function useAddFoodsToMeal(date: Date) {
  const { user } = useAuth()
  const now = useNow()
  const refresh = useRefreshDays()

  return useMutation<void, AppError, AddFoodsVariables>({
    mutationFn: ({ mealType, items }) =>
      nutritionService.addFoodsToMeal({
        userId: requireUserId(user?.id),
        date,
        mealType,
        items,
        now,
      } satisfies AddFoodsInput),
    onSuccess: refresh,
  })
}

/** Objetivos vigentes, o `null` si aún no se han fijado. */
export function useActiveGoal() {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery<NutritionGoal | null, AppError>({
    queryKey: nutritionKeys.goal(userId),
    queryFn: () => (userId ? nutritionService.getActiveGoal(userId) : null),
  })
}

/** Guarda los objetivos (jubila los anteriores). */
export function useSaveGoal() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation<NutritionGoal, AppError, NutritionGoalValues>({
    mutationFn: (values) => nutritionService.saveGoal(requireUserId(user?.id), values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: nutritionKeys.goal(user?.id) }),
  })
}

/** El agua bebida en un día, con cada registro y el total. */
export function useDayWater(date: Date) {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery<DayWater | null, AppError>({
    queryKey: nutritionKeys.water(userId, toDateKey(date)),
    queryFn: () => (userId ? nutritionService.getDayWater(userId, date) : null),
  })
}

/** Lo que se puede repetir en cada comida del día (una sola consulta). */
export function useRepeatableMeals(date: Date) {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery<RepeatableMeals, AppError>({
    queryKey: nutritionKeys.repeatable(userId, toDateKey(date)),
    queryFn: () => (userId ? nutritionService.getRepeatableMeals(userId, date) : {}),
  })
}

/** Registra agua en el día indicado, que no tiene por qué ser hoy. */
export function useAddWater(date: Date) {
  const { user } = useAuth()
  const now = useNow()
  const refresh = useRefreshDays()

  return useMutation<void, AppError, number>({
    mutationFn: (amountMl) =>
      nutritionService.addWater(requireUserId(user?.id), amountMl, date, now),
    onSuccess: refresh,
  })
}

/** Quita un registro de agua hecho por error. */
export function useRemoveWater() {
  const refresh = useRefreshDays()

  return useMutation<void, AppError, string>({
    mutationFn: (waterLogId) => nutritionService.removeWater(waterLogId),
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
