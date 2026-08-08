import type { Enums, Tables } from '@/core/supabase'
import type { SeriesPoint } from '@/shared/utils'

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
export type WaterLog = Tables<'water_logs'>
export type NutritionGoal = Tables<'nutrition_goals'>

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
  | 'cost_per_serving'
>

/** Alimento registrado dentro de una comida, con el alimento al que referencia. */
export type MealLogItemWithFood = MealLogItem & { readonly food: FoodRef }

/**
 * Una compra: cuánto trajiste de un alimento y lo que pagaste por ello.
 *
 * **Es el contrato público con finanzas.** Apuntar el mercado deja los precios
 * al día sin que finanzas tenga que saber qué es una porción ni tocar `foods`:
 * manda lo que dice el recibo y nutrición hace el resto.
 */
export interface FoodPurchase {
  readonly foodId: string
  /** Cuánto compraste, en la unidad del alimento (g, ml, unidades). */
  readonly quantity: number
  /** Lo que pagaste por esa cantidad, en COP. */
  readonly paidCop: number
}

/** Lo que cambió al repreciar, para poder contarlo sin volver a consultar. */
export interface RepricedFood {
  readonly foodId: string
  readonly name: string
  /** Lo que costaba antes; `null` si es la primera vez que se le pone precio. */
  readonly previousCop: number | null
  readonly nextCop: number
}

/**
 * Lo mínimo de una comida y de sus alimentos para agregar un periodo.
 *
 * Analytics recorre meses, no un día: aquí sólo bajan las columnas que se
 * suman. Los cálculos (`macrosForServings`, `calculateSpend`) aceptan esta
 * forma reducida además de la completa, así que la regla sigue siendo una.
 */
export type MealLogSample = Pick<MealLog, 'id' | 'logged_at'>

export type MealItemSample = Pick<MealLogItem, 'meal_log_id' | 'servings'> & {
  readonly food: Pick<Food, 'calories' | 'protein_g' | 'carbs_g' | 'fat_g' | 'cost_per_serving'>
}

export type WaterSample = Pick<WaterLog, 'amount_ml' | 'logged_at'>

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

/**
 * Una comida anterior que puede repetirse tal cual.
 *
 * Se guarda cuándo fue para poder decirlo («el almuerzo del martes»): repetir a
 * ciegas lo que uno no recuerda haber comido daría menos confianza que teclearlo.
 */
export interface RepeatableMeal {
  readonly loggedAt: string
  readonly items: readonly MealLogItemWithFood[]
}

/**
 * Lo repetible de cada comida del día.
 *
 * **Un objeto plano y no un `Map`, y no es una preferencia de estilo.** Esto
 * viaja por TanStack Query, y su caché se persiste en `localStorage` con
 * `JSON.stringify` ([ADR-0007](../../../../docs/adr/0007-cache-persistente-en-localstorage.md)).
 * Un `Map` no sobrevive a ese viaje: se serializa como `{}` y vuelve como un
 * objeto pelado, así que al rehidratar la pantalla reventaba llamando a `.get`.
 *
 * La regla que deja esto: **todo lo que devuelva una consulta tiene que
 * sobrevivir a un ida y vuelta por JSON.** Nada de `Map`, `Set`, `Date` ni
 * instancias de clase.
 */
export type RepeatableMeals = Partial<Record<MealType, RepeatableMeal>>

/** La hidratación de un día: cada registro y el total. */
export interface DayWater {
  readonly logs: readonly WaterLog[]
  readonly totalMl: number
}

/**
 * Gasto en comida de un periodo.
 *
 * El precio de un alimento es opcional, así que el total puede ser parcial:
 * por eso se lleva la cuenta de cuántos alimentos no lo tienen.
 */
export interface WeeklySpend {
  readonly totalCop: number
  readonly itemsWithPrice: number
  readonly itemsWithoutPrice: number
}

/**
 * La nutrición de un periodo, tal y como la consume Analytics.
 *
 * Los días sin registro son **huecos**, no ceros: nadie come cero calorías
 * (ver `buildNutritionSeries`).
 */
export interface NutritionPeriodSeries {
  /** Calorías de cada día; hueco donde no se registró nada. */
  readonly caloriePoints: readonly SeriesPoint[]
  /** Media de los días registrados; `null` si no hay ninguno. */
  readonly averageCalories: number | null
  readonly previousAverageCalories: number | null
  /** Días con al menos una comida con alimentos. */
  readonly daysLogged: number
  /** Media de agua de los días con registro; `null` si no hay ninguno. */
  readonly averageWaterMl: number | null
  readonly previousAverageWaterMl: number | null
  /** Gasto del periodo, con cuántos alimentos van sin precio. */
  readonly spend: WeeklySpend
  readonly previousSpendCop: number
}
