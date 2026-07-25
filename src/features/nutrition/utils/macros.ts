import type { FoodRef, Macros, MealLogItemWithFood } from '../types/nutrition.types'

/** Macros en cero: punto de partida de cualquier suma. */
export const EMPTY_MACROS: Macros = { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }

/** Dos decimales, para que la coma flotante no ensucie los totales. */
function round(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Macros de un alimento por la cantidad consumida.
 *
 * `servings` multiplica la **porción del alimento** (`serving_size` +
 * `serving_unit`), no gramos: 2 porciones de «Huevo (50 g)» son dos huevos.
 */
export function macrosForServings(food: FoodRef, servings: number): Macros {
  return {
    calories: round(food.calories * servings),
    proteinG: round(food.protein_g * servings),
    carbsG: round(food.carbs_g * servings),
    fatG: round(food.fat_g * servings),
  }
}

/** Suma de macros; base de los totales por comida y del día. */
export function sumMacros(entries: readonly Macros[]): Macros {
  const total = entries.reduce<Macros>(
    (acc, macros) => ({
      calories: acc.calories + macros.calories,
      proteinG: acc.proteinG + macros.proteinG,
      carbsG: acc.carbsG + macros.carbsG,
      fatG: acc.fatG + macros.fatG,
    }),
    EMPTY_MACROS,
  )

  return {
    calories: round(total.calories),
    proteinG: round(total.proteinG),
    carbsG: round(total.carbsG),
    fatG: round(total.fatG),
  }
}

/** Macros de los alimentos registrados en una comida. */
export function macrosForItems(items: readonly MealLogItemWithFood[]): Macros {
  return sumMacros(items.map((item) => macrosForServings(item.food, item.servings)))
}
