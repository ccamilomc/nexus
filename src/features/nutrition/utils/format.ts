import type { FoodRef } from '../types/nutrition.types'

/** Formato de las cifras de nutrición. Funciones puras. */

const integerFormatter = new Intl.NumberFormat('es', { maximumFractionDigits: 0 })
const decimalFormatter = new Intl.NumberFormat('es', { maximumFractionDigits: 1 })

/**
 * Precios en pesos colombianos.
 *
 * Sin decimales a propósito: el peso no tiene centavos en circulación, así que
 * mostrar «$ 12.500,00» sería ruido.
 */
const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

export function formatCop(amount: number): string {
  return copFormatter.format(amount)
}

/** Calorías, siempre enteras: `1.850 kcal`. */
export function formatCalories(calories: number): string {
  return `${integerFormatter.format(Math.round(calories))} kcal`
}

/** Gramos de un macro, con un decimal como mucho: `31 g`, `6,3 g`. */
export function formatGrams(grams: number): string {
  return `${decimalFormatter.format(grams)} g`
}

/** La porción del alimento: `100 g`, `50 g`. */
export function formatServing(food: FoodRef): string {
  return `${decimalFormatter.format(food.serving_size)} ${food.serving_unit}`
}

/**
 * Cuánto se consumió de un alimento: `2 × 50 g` (100 g).
 *
 * Se muestran las porciones y su equivalencia, porque «2 porciones» no dice
 * nada si no recuerdas de cuánto es la porción.
 */
export function formatQuantity(food: FoodRef, servings: number): string {
  const total = decimalFormatter.format(food.serving_size * servings)
  return `${decimalFormatter.format(servings)} × ${formatServing(food)} · ${total} ${food.serving_unit}`
}
