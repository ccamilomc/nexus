import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { useAuth } from '@/core/auth'
import { type AppError, createAppError } from '@/core/error'
import { OFFLINE_MUTATIONS } from '@/core/offline'
import { useNow } from '@/core/time'
import { toDateKey, toLoggedAt } from '@/shared/utils'

import type { CreateFoodValues, NutritionGoalValues } from '../schemas/nutrition.schema'
import type { AddFoodsInput, AddWaterInput } from '../services/nutrition.service'
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
  WaterLog,
  WeekNutrition,
} from '../types/nutrition.types'
import { addFoodsToDay, knownFoods } from '../utils/add-foods'
import { buildAddWaterInput } from '../utils/water-input'
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

/** Lo que el formulario necesita, sin las variables internas de la mutación. */
interface AddFoodsMutation {
  readonly isPending: boolean
  readonly error: AppError | null
  /**
   * `onApuntado` corre **en cuanto la comida queda a salvo**, esté enviada o
   * esperando red. No es `onSuccess`: una mutación pausada nunca lo llamaría, y
   * el formulario se quedaría abierto como si no hubiera guardado.
   */
  readonly mutate: (
    variables: AddFoodsVariables,
    options?: { readonly onApuntado?: () => void },
  ) => void
}

/**
 * Registra los alimentos elegidos en una comida del día indicado.
 *
 * Sobrevive a quedarse sin red (ADR-0011): los alimentos aparecen en su comida
 * al momento, esperan guardados y salen solos al recuperar la conexión.
 *
 * Es el único registro que crea **dos filas encadenadas** —la comida y sus
 * alimentos—, y la de arriba la sigue creando el servidor: cuando esto se
 * reanuda ya hay red, así que puede mirar si el almuerzo existía. Lo que sí
 * lleva id de cliente es cada alimento, para que reenviar la lista no apunte
 * el desayuno dos veces.
 */
export function useAddFoodsToMeal(date: Date): AddFoodsMutation {
  const { user } = useAuth()
  const now = useNow()
  const queryClient = useQueryClient()
  const refresh = useRefreshDays()
  const dayKey = nutritionKeys.day(user?.id, toDateKey(date))

  const mutation = useMutation<void, AppError, AddFoodsInput>({
    mutationKey: OFFLINE_MUTATIONS.addFoods,
    mutationFn: (input) => nutritionService.addFoodsToMeal(input),

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: dayKey })
      const previous = queryClient.getQueryData<DayNutrition | null>(dayKey)

      if (previous) {
        const known = knownFoods(
          queryClient.getQueryData<Food[]>(nutritionKeys.foods()),
          queryClient.getQueryData<RepeatableMeals>(
            nutritionKeys.repeatable(user?.id, toDateKey(date)),
          ),
          previous,
        )

        queryClient.setQueryData<DayNutrition | null>(dayKey, addFoodsToDay(previous, input, known))
      }

      return { previous }
    },

    // Si falla de verdad (sin red se pausa, no falla) se deshace: unos macros
    // que no se comieron descuadran lo que queda del día.
    onError: (_error, _input, context) => {
      const previous = (context as { previous?: DayNutrition | null } | undefined)?.previous
      if (previous !== undefined) queryClient.setQueryData(dayKey, previous)
    },

    onSettled: refresh,
  })

  const { mutate } = mutation

  return {
    isPending: mutation.isPending && !mutation.isPaused,
    error: mutation.error,

    mutate: useCallback(
      ({ mealType, items }, options) => {
        mutate({
          userId: requireUserId(user?.id),
          dateKey: toDateKey(date),
          mealType,
          items: items.map((item) => ({ ...item, id: crypto.randomUUID() })),
          loggedAt: toLoggedAt(date, now),
        })
        options?.onApuntado?.()
      },
      [mutate, user?.id, date, now],
    ),
  }
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

/**
 * Los objetivos anteriores. **Sólo se piden al abrirlos.**
 *
 * Es algo que se mira de vez en cuando, así que traerlos al cargar la pantalla
 * sería pagar una consulta por una lista que casi nunca se despliega.
 */
export function useRetiredGoals(enabled: boolean) {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery<NutritionGoal[], AppError>({
    queryKey: nutritionKeys.retiredGoals(userId),
    queryFn: () => (userId ? nutritionService.getRetiredGoals(userId) : []),
    enabled,
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

/**
 * Registra agua en el día indicado, que no tiene por qué ser hoy.
 *
 * **Es la primera mutación que sobrevive a quedarse sin red** (ADR-0011), y por
 * eso está escrita distinto de las de configuración:
 *
 * - lleva `mutationKey`, que es lo que permite reanudarla tras cerrar la
 *   aplicación;
 * - **no captura nada del closure**: el usuario, el momento y el id viajan en
 *   las variables, porque al reanudarse no queda nada de esta pantalla;
 * - se aplica **antes de salir** (`onMutate`), así que el vaso se ve en el acto
 *   con red o sin ella. Antes el botón se quedaba deshabilitado y el total en
 *   `0 ml`, que parecía que la aplicación se había colgado.
 */
export function useAddWater(date: Date): AddWaterMutation {
  const { user } = useAuth()
  const now = useNow()
  const queryClient = useQueryClient()
  const refresh = useRefreshDays()
  const waterKey = nutritionKeys.water(user?.id, toDateKey(date))

  const mutation = useMutation<void, AppError, AddWaterInput>({
    mutationKey: OFFLINE_MUTATIONS.addWater,
    mutationFn: (input) => nutritionService.addWater(input),

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: waterKey })
      const previous = queryClient.getQueryData<DayWater | null>(waterKey)

      queryClient.setQueryData<DayWater | null>(waterKey, (current) =>
        addWaterOptimistically(current ?? null, input),
      )

      return { previous }
    },

    // Si falla de verdad (no por falta de red: eso pausa, no falla) se deshace,
    // porque dejar en pantalla un vaso que no existe es peor que no pintarlo.
    onError: (_error, _input, context) => {
      const previous = (context as { previous?: DayWater | null } | undefined)?.previous
      if (previous !== undefined) queryClient.setQueryData(waterKey, previous)
    },

    onSettled: refresh,
  })

  const { mutate } = mutation

  return {
    // Pausada no es «en marcha»: sin red el registro ya está guardado y a la
    // espera, así que bloquear el botón sólo impediría apuntar el segundo vaso.
    isPending: mutation.isPending && !mutation.isPaused,
    error: mutation.error,

    // El componente sigue pidiendo mililitros: que el registro lleve id propio
    // y fecha resuelta es asunto de aquí, no suyo. El id y el reloj se fijan en
    // este momento —al tocar el botón— y no cuando la mutación llegue a salir.
    mutate: useCallback(
      (amountMl, options) => {
        const input = buildAddWaterInput({
          id: crypto.randomUUID(),
          userId: requireUserId(user?.id),
          amountMl,
          date,
          now,
        })

        mutate(input, options)
      },
      [mutate, user?.id, date, now],
    ),
  }
}

/**
 * Lo que el componente necesita del registro de agua, y nada más.
 *
 * Se declara en vez de devolver la mutación entera porque sus variables ya no
 * son los mililitros que se piden desde fuera, y dejar las dos formas a la vista
 * invita a mandar la que no toca.
 */
interface AddWaterMutation {
  readonly isPending: boolean
  /** El fallo, o `null`. Un solo dato: `isError` y `error` podían contradecirse. */
  readonly error: AppError | null
  readonly mutate: (amountMl: number, options?: { readonly onSuccess?: () => void }) => void
}

/** Lo que la pantalla enseña mientras el registro todavía no ha salido. */
function addWaterOptimistically(current: DayWater | null, input: AddWaterInput): DayWater {
  const log: WaterLog = {
    id: input.id,
    user_id: input.userId,
    amount_ml: input.amountMl,
    logged_at: input.loggedAt,
    created_at: input.loggedAt,
    updated_at: input.loggedAt,
    deleted_at: null,
  }

  return {
    logs: [log, ...(current?.logs ?? [])],
    totalMl: (current?.totalMl ?? 0) + input.amountMl,
  }
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
