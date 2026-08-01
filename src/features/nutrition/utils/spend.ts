import type { FoodRef, WeeklySpend } from '../types/nutrition.types'

/**
 * Lo que hace falta de un alimento registrado para saber lo que costó.
 *
 * Igual que en los macros, admite la fila completa y la reducida de Analytics:
 * el precio se cuenta con la misma regla en las dos pantallas.
 */
type SpendItem = {
  readonly servings: number
  readonly food: Pick<FoodRef, 'cost_per_serving'>
}

/**
 * Cuánto se gastó en lo registrado.
 *
 * El precio de un alimento es **opcional**, así que el total puede ser parcial.
 * En vez de disimularlo, se cuenta cuántos alimentos no tienen precio para que
 * la interfaz pueda decirlo: un gasto que parece completo sin serlo miente.
 */
export function calculateSpend(items: readonly SpendItem[]): WeeklySpend {
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
