import { createAppError, isForeignKeyViolation, toAppError } from '@/core/error'
import { type DayRange, dayRange, weekRange } from '@/shared/utils'

import { MEAL_TYPES_IN_ORDER } from '../constants/nutrition.constants'
import { nutritionRepository } from '../repositories/nutrition.repository'
import type { CreateFoodValues, NutritionGoalValues } from '../schemas/nutrition.schema'
import type {
  DayNutrition,
  DayWater,
  Food,
  MealType,
  NutritionGoal,
  NutritionPeriodSeries,
  RepeatableMeal,
  WeeklySpend,
} from '../types/nutrition.types'
import { buildDayNutrition } from '../utils/day-nutrition'
import { buildNutritionSeries } from '../utils/nutrition-series'
import { calculateSpend } from '../utils/spend'
import { sumWaterMl } from '../utils/water'

/** Moneda de los precios de Nexus (ver docs/11 y la memoria del proyecto). */
const CURRENCY_COP = 'COP'

const MS_PER_DAY = 86_400_000

/**
 * Hasta dónde se busca una comida para repetir.
 *
 * Dos semanas cubren lo que uno come habitualmente; más atrás ya no es «lo de
 * siempre», es arqueología.
 */
const REPEAT_WINDOW_DAYS = 14

/**
 * Comidas recientes que se traen para buscar plantillas.
 *
 * Con cuatro comidas al día, veinte cubren los últimos cinco días, de sobra
 * para encontrar la última de cada tipo.
 */
const REPEAT_CANDIDATES = 20

/**
 * La comida del día, creándola si es la primera vez.
 *
 * El usuario piensa «añado pollo al almuerzo», no «creo un almuerzo y luego le
 * añado pollo». Se reutiliza la del día para no partirla en varios registros.
 */
async function ensureMealLog(userId: string, date: Date, mealType: MealType) {
  const { fromIso, toIso } = dayRange(date)
  const logs = await nutritionRepository.listMealLogsBetween(userId, fromIso, toIso)
  const existing = logs.find((log) => log.meal_type === mealType)

  return (
    existing ??
    (await nutritionRepository.insertMealLog(userId, mealType, new Date().toISOString()))
  )
}

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
      const mealLog = await ensureMealLog(userId, date, mealType)

      await nutritionRepository.insertMealLogItem({
        meal_log_id: mealLog.id,
        food_id: foodId,
        servings,
      })
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * Lo que se puede repetir en cada comida del día.
   *
   * Una sola consulta para las cuatro: la pantalla las muestra juntas, así que
   * preguntarlo comida por comida serían cuatro viajes para lo mismo. Sólo mira
   * las dos últimas semanas: lo que se comió hace tres meses no es «lo de
   * siempre», y ofrecerlo sería ruido.
   */
  async getRepeatableMeals(
    userId: string,
    date: Date,
  ): Promise<ReadonlyMap<MealType, RepeatableMeal>> {
    try {
      const { fromIso } = dayRange(date)
      const since = new Date(new Date(fromIso).getTime() - REPEAT_WINDOW_DAYS * MS_PER_DAY)

      const logs = await nutritionRepository.listRecentMealLogs(
        userId,
        since.toISOString(),
        fromIso,
        REPEAT_CANDIDATES,
      )
      if (logs.length === 0) return new Map()

      const items = await nutritionRepository.listItemsByMealLogs(logs.map(({ id }) => id))

      const byType = new Map<MealType, RepeatableMeal>()
      // Los registros llegan del más reciente al más antiguo, así que la primera
      // vez que aparece un tipo es la última que se comió. Una comida que quedó
      // vacía —se borró lo que tenía— se salta: repetir la nada no sirve.
      for (const log of logs) {
        if (byType.has(log.meal_type)) continue

        const logItems = items.filter((item) => item.meal_log_id === log.id)
        if (logItems.length > 0)
          byType.set(log.meal_type, { loggedAt: log.logged_at, items: logItems })
      }

      return byType
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * Repite en el día una comida ya registrada antes.
   *
   * Copia los alimentos y sus porciones **por valor**: si luego se cambia uno,
   * el de hoy no se toca. Registrar lo que se come a diario era el paso más
   * caro de la aplicación; esto lo deja en un toque.
   */
  async repeatMeal(userId: string, date: Date, mealType: MealType): Promise<void> {
    try {
      const template = (await this.getRepeatableMeals(userId, date)).get(mealType)
      if (!template)
        throw createAppError('not_found', 'No hay ninguna comida anterior que repetir.')

      const mealLog = await ensureMealLog(userId, date, mealType)

      for (const item of template.items) {
        await nutritionRepository.insertMealLogItem({
          meal_log_id: mealLog.id,
          food_id: item.food_id,
          servings: item.servings,
        })
      }
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Objetivos vigentes del usuario, o `null` si aún no los ha fijado. */
  async getActiveGoal(userId: string): Promise<NutritionGoal | null> {
    try {
      return await nutritionRepository.findActiveGoal(userId)
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * Guarda los objetivos.
   *
   * No se edita el vigente: se jubila y se crea otro. Así queda el historial
   * de qué se perseguía en cada momento, que es lo que el esquema previó con
   * `is_active` + `effective_from` (ver docs/04-modelo-de-datos.md).
   */
  async saveGoal(userId: string, values: NutritionGoalValues): Promise<NutritionGoal> {
    try {
      await nutritionRepository.deactivateGoals(userId)

      return await nutritionRepository.insertGoal({
        user_id: userId,
        calories_target: values.caloriesTarget,
        protein_g_target: values.proteinGTarget,
        carbs_g_target: values.carbsGTarget,
        fat_g_target: values.fatGTarget,
        water_ml_target: values.waterMlTarget,
        // Sin presupuesto se guarda `null`: no es lo mismo que un presupuesto
        // de cero pesos.
        weekly_food_budget: values.weeklyFoodBudget ?? null,
      })
    } catch (error) {
      throw toAppError(error)
    }
  },

  /** Lo gastado en comida durante la semana (de lunes a domingo) de `date`. */
  async getWeekSpend(userId: string, date: Date): Promise<WeeklySpend> {
    try {
      const { fromIso, toIso } = weekRange(date)
      const logs = await nutritionRepository.listMealLogsBetween(userId, fromIso, toIso)
      const items = await nutritionRepository.listItemsByMealLogs(logs.map(({ id }) => id))

      return calculateSpend(items)
    } catch (error) {
      throw toAppError(error)
    }
  },

  /**
   * La nutrición de un periodo y la del tramo anterior, para Analytics.
   *
   * Tres consultas: las comidas de los dos tramos (contiguos, así que van
   * juntas), sus alimentos, y el agua del mismo rango.
   */
  async getSeries(
    userId: string,
    range: DayRange,
    previousRange: DayRange,
    days: readonly Date[],
    previousDays: readonly Date[],
  ): Promise<NutritionPeriodSeries> {
    try {
      const [mealLogs, waterLogs] = await Promise.all([
        nutritionRepository.listMealLogsBetween(userId, previousRange.fromIso, range.toIso),
        nutritionRepository.listWaterLogsBetween(userId, previousRange.fromIso, range.toIso),
      ])

      const items = await nutritionRepository.listItemsByMealLogs(mealLogs.map(({ id }) => id))

      return buildNutritionSeries(mealLogs, items, waterLogs, days, previousDays)
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
