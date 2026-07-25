import type { MealLogItemWithFood, WeeklySpend } from '../types/nutrition.types'

/**
 * Cuánto se gastó en lo registrado.
 *
 * El precio de un alimento es **opcional**, así que el total puede ser parcial.
 * En vez de disimularlo, se cuenta cuántos alimentos no tienen precio para que
 * la interfaz pueda decirlo: un gasto que parece completo sin serlo miente.
 */
export function calculateSpend(items: readonly MealLogItemWithFood[]): WeeklySpend {
  let total = 0
  let itemsWithoutPrice = 0

  for (const item of items) {
    const price = item.food.cost_per_serving
    if (price === null) {
      itemsWithoutPrice += 1
      continue
    }
    total += price * item.servings
  }

  return {
    // Los pesos colombianos no llevan centavos: se redondea al peso.
    totalCop: Math.round(total),
    itemsWithoutPrice,
    itemsWithPrice: items.length - itemsWithoutPrice,
  }
}
