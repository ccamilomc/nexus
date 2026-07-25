import { createAppError, isForeignKeyViolation, toAppError } from '@/core/error'

import { MEAL_TYPES_IN_ORDER } from '../constants/nutrition.constants'
import { nutritionRepository } from '../repositories/nutrition.repository'
import type { CreateFoodValues } from '../schemas/nutrition.schema'
import type { DayNutrition, DayWater, Food, MealType } from '../types/nutrition.types'
import { buildDayNutrition } from '../utils/day-nutrition'
import { dayRange } from '../utils/day-range'
import { sumWaterMl } from '../utils/water'

/** Moneda de los precios de Nexus (ver docs/11 y la memoria del proyecto). */
const CURRENCY_COP = 'COP'

/**
 * Traduce el formulario a la fila de la base.
 *
 * Los opcionales vacíos se guardan como `null`, no como `''` o `0`: «sin
 * marca» y «sin precio» son ausencia de dato, no un dato vacío.
 */
function toFoodRow(values: CreateFoodValues) {
  return {
    name: values.name,
    brand: values.brand ?? null,
    serving_size: values.servingSize,
    serving_unit: values.servingUnit,
    calories: values.calories,
    protein_g: values.proteinG,
    carbs_g: values.carbsG,
    fat_g: values.fatG,
    cost_per_serving: values.costPerServing ?? null,
    currency: values.costPerServing === undefined ? null : CURRENCY_COP,
  }
}

/** Datos necesarios para registrar un alimento en una comida. */
export interface AddFoodInput {
  readonly userId: string
  readonly date: Date
  readonly mealType: MealType
  readonly foodId: string
  readonly servings: number
}

/** Reglas de negocio de nutrición. Traduce errores técnicos a `AppError`. */
export const nutritionService = {
  async getFoods(): Promise<Food[]> {
    try {
      return await nutritionRepository.listFoods()
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Crea un alimento propio del usuario (queda como `is_custom`). */
  async createFood(userId: string, values: CreateFoodValues): Promise<Food> {
    try {
      return await nutritionRepository.insertFood({ user_id: userId, ...toFoodRow(values) })
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Edita un alimento propio. La RLS impide tocar los del catálogo global. */
  async updateFood(foodId: string, values: CreateFoodValues): Promise<Food> {
    try {
      return await nutritionRepository.updateFood(foodId, toFoodRow(values))
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * Borra un alimento propio.
   *
   * Si ya se registró en alguna comida, la base lo impide
   * (`on delete restrict`): se traduce a un mensaje claro en vez de un error
   * técnico.
   */
  async deleteFood(foodId: string): Promise<void> {
    try {
      await nutritionRepository.deleteFood(foodId)
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw createAppError(
          'conflict',
          'No puedes borrar un alimento que ya registraste en una comida. Quítalo de ahí primero.',
        )
      }
      throw toAppError(error)
    }
  },

  /** Lo consumido en un día, con sus macros por comida y el total. */
  async getDayNutrition(userId: string, date: Date): Promise<DayNutrition> {
    try {
      const { fromIso, toIso } = dayRange(date)
      const logs = await nutritionRepository.listMealLogsBetween(userId, fromIso, toIso)
      const items = await nutritionRepository.listItemsByMealLogs(logs.map(({ id }) => id))

      return buildDayNutrition(MEAL_TYPES_IN_ORDER, logs, items)
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * Registra un alimento en una comida del día.
   *
   * La comida se crea sola la primera vez: el usuario piensa «añado pollo al
   * almuerzo», no «creo un almuerzo y luego le añado pollo». Se reutiliza la
   * del día para no partir el almuerzo en varios registros.
   */
  async addFoodToMeal({ userId, date, mealType, foodId, servings }: AddFoodInput): Promise<void> {
    try {
      const { fromIso, toIso } = dayRange(date)
      const logs = await nutritionRepository.listMealLogsBetween(userId, fromIso, toIso)
      const existing = logs.find((log) => log.meal_type === mealType)

      const mealLog =
        existing ??
        (await nutritionRepository.insertMealLog(userId, mealType, new Date().toISOString()))

      await nutritionRepository.insertMealLogItem({
        meal_log_id: mealLog.id,
        food_id: foodId,
        servings,
      })
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** El agua bebida en un día, con cada registro y el total. */
  async getDayWater(userId: string, date: Date): Promise<DayWater> {
    try {
      const { fromIso, toIso } = dayRange(date)
      const logs = await nutritionRepository.listWaterLogsBetween(userId, fromIso, toIso)

      return { logs, totalMl: sumWaterMl(logs) }
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Registra agua. La hora es la de ahora: se bebe en el momento. */
  async addWater(userId: string, amountMl: number): Promise<void> {
    try {
      await nutritionRepository.insertWaterLog(userId, amountMl, new Date().toISOString())
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Quita un registro de agua hecho por error. */
  async removeWater(waterLogId: string): Promise<void> {
    try {
      await nutritionRepository.softDeleteWaterLog(waterLogId, new Date().toISOString())
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Quita un alimento registrado por error. */
  async removeMealItem(itemId: string): Promise<void> {
    try {
      await nutritionRepository.deleteMealLogItem(itemId)
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Borra una comida entera con todo lo que contiene. */
  async removeMeal(mealLogId: string): Promise<void> {
    try {
      await nutritionRepository.softDeleteMealLog(mealLogId, new Date().toISOString())
    } catch (error) {
      throw toAppError(error)
    }
  },
}
