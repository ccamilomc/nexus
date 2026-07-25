import type { Enums, Tables } from '@/core/supabase'

/**
 * Tipos del dominio de nutrición.
 *
 * Como en workout, las filas de la base se usan tal cual las genera Supabase
 * (`snake_case`): son la fuente única de verdad y evitan una capa de mapeo
 * paralela al esquema. Encima se definen los agregados que necesita la interfaz.
 */

export type Food = Tables<'foods'>
export type MealLog = Tables<'meal_logs'>
export type MealLogItem = Tables<'meal_log_items'>
export type MealType = Enums<'meal_type'>

/** Datos del alimento que acompañan a un ítem registrado (llegan por join). */
export type FoodRef = Pick<
  Food,
  | 'id'
  | 'name'
  | 'brand'
  | 'serving_size'
  | 'serving_unit'
  | 'calories'
  | 'protein_g'
  | 'carbs_g'
  | 'fat_g'
>

/** Alimento registrado dentro de una comida, con el alimento al que referencia. */
export type MealLogItemWithFood = MealLogItem & { readonly food: FoodRef }

/**
 * Macros de un conjunto de alimentos.
 *
 * Siempre se **calculan** a partir de (alimento × porciones); nunca se
 * almacenan, para que no puedan quedar desincronizados con el catálogo
 * (ver docs/04-modelo-de-datos.md).
 */
export interface Macros {
  readonly calories: number
  readonly proteinG: number
  readonly carbsG: number
  readonly fatG: number
}

/** Una comida del día (desayuno, almuerzo…) con lo que se registró en ella. */
export interface MealEntry {
  readonly mealType: MealType
  /** `null` mientras no se haya registrado nada en esa comida. */
  readonly log: MealLog | null
  readonly items: readonly MealLogItemWithFood[]
  readonly macros: Macros
}

/** El día completo: sus cuatro comidas y el total consumido. */
export interface DayNutrition {
  readonly meals: readonly MealEntry[]
  readonly totals: Macros
}
