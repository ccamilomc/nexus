import type {
  DayNutrition,
  MealEntry,
  MealLog,
  MealLogItemWithFood,
  MealType,
} from '../types/nutrition.types'
import { macrosForItems, sumMacros } from './macros'

/**
 * Compone el día a partir de lo registrado.
 *
 * Siempre devuelve **las cuatro comidas**, aunque estén vacías: la pantalla
 * necesita ofrecer «añadir al desayuno» aunque todavía no exista ningún
 * desayuno. Una comida sin registro tiene `log: null`.
 *
 * Si hubiera varias comidas del mismo tipo en un día (posible en el esquema,
 * p. ej. tras sincronizar dos dispositivos), sus alimentos se juntan bajo esa
 * comida en lugar de perderse.
 */
export function buildDayNutrition(
  mealTypes: readonly MealType[],
  logs: readonly MealLog[],
  items: readonly MealLogItemWithFood[],
): DayNutrition {
  const itemsByLog = new Map<string, MealLogItemWithFood[]>()
  for (const item of items) {
    const current = itemsByLog.get(item.meal_log_id)
    if (current) current.push(item)
    else itemsByLog.set(item.meal_log_id, [item])
  }

  const meals: MealEntry[] = mealTypes.map((mealType) => {
    const logsOfType = logs.filter((log) => log.meal_type === mealType)
    const itemsOfType = logsOfType.flatMap((log) => itemsByLog.get(log.id) ?? [])

    return {
      mealType,
      log: logsOfType[0] ?? null,
      items: itemsOfType,
      macros: macrosForItems(itemsOfType),
    }
  })

  return { meals, totals: sumMacros(meals.map((meal) => meal.macros)) }
}
