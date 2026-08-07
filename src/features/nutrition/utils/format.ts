import type { FoodRef } from '../types/nutrition.types'

/** Formato de las cifras de nutrición. Funciones puras. */

const integerFormatter = new Intl.NumberFormat('es', { maximumFractionDigits: 0 })
const decimalFormatter = new Intl.NumberFormat('es', { maximumFractionDigits: 1 })

// `formatCop` se mudó a `shared/utils`: el dinero dejó de ser cosa sólo de
// nutrición cuando llegó finanzas. Se reexporta para no tocar a sus llamadores.
export { formatCop } from '@/shared/utils'

/** A partir de un litro se habla en litros: nadie dice «tomé 1750 mililitros». */
const ML_PER_LITER = 1000

/** Volumen de agua: `250 ml` en pequeño, `1,75 L` a partir de un litro. */
export function formatVolumeMl(ml: number): string {
  if (ml < ML_PER_LITER) return `${integerFormatter.format(ml)} ml`
  return `${decimalFormatter.format(ml / ML_PER_LITER)} L`
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
