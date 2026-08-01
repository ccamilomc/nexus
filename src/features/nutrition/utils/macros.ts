import type { FoodRef, Macros } from '../types/nutrition.types'

/**
 * Lo que hace falta de un alimento para calcular sus macros.
 *
 * Se pide esto y no un `FoodRef` entero para que valgan tanto la fila completa
 * de la pantalla del día como la reducida que trae Analytics: la regla de cómo
 * se multiplican las porciones tiene que ser **una sola**.
 */
type MacroFood = Pick<FoodRef, 'calories' | 'protein_g' | 'carbs_g' | 'fat_g'>

/** Un alimento registrado, en cualquiera de sus dos formas. */
type MacroItem = { readonly servings: number; readonly food: MacroFood }

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
export function macrosForServings(food: MacroFood, servings: number): Macros {
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
export function macrosForItems(items: readonly MacroItem[]): Macros {
  return sumMacros(items.map((item) => macrosForServings(item.food, item.servings)))
}
