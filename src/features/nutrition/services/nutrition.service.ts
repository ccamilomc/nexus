import { toAppError } from '@/core/error'

import { MEAL_TYPES_IN_ORDER } from '../constants/nutrition.constants'
import { nutritionRepository } from '../repositories/nutrition.repository'
import type { DayNutrition, Food, MealType } from '../types/nutrition.types'
import { buildDayNutrition } from '../utils/day-nutrition'
import { dayRange } from '../utils/day-range'

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
