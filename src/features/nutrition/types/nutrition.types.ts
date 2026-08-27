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
 * Cómo va la semana de comida, en medias por día.
 *
 * `averages` reparte entre los **días registrados**, no entre siete: un día sin
 * apuntar es un día sin registrar, no un día de ayuno. Por eso viaja también
 * `daysLogged` —una media de dos días no vale lo que una de siete— junto a los
 * días que ya han pasado, para poder decir «5 de 6».
 */
export interface WeekNutrition {
  readonly daysLogged: number
  /** Días de la semana que ya llegaron, contando hoy; los que faltan no cuentan. */
  readonly daysElapsed: number
  readonly averages: Macros
}

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
 * Una combinación que ya se ha comido y puede volver a apuntarse.
 *
 * **Sale de lo registrado, no de una lista que haya que mantener.** Uno come
 * casi siempre las mismas tres o cuatro cosas en cada comida, y esas
 * combinaciones ya están en el histórico: pedirle además que las nombre y las
 * actualice sería trabajo para saber algo que la aplicación ya sabe.
 *
 * Se guarda cuándo fue la última vez para poder decirlo —repetir a ciegas lo
 * que uno no recuerda haber comido daría menos confianza que teclearlo— y
 * cuántas veces se ha comido, que es lo que la ordena.
 */
export interface RepeatableMeal {
  /** Identifica la combinación por sus alimentos, para listas de React. */
  readonly key: string
  readonly loggedAt: string
  /** Veces que se ha comido esta misma combinación en el tramo mirado. */
  readonly times: number
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
export type RepeatableMeals = Partial<Record<MealType, readonly RepeatableMeal[]>>

/** La hidratación de un día: cada registro y el total. */
export interface DayWater {
  readonly logs: readonly WaterLog[]
  readonly totalMl: number
}

/**
 * La nutrición de un periodo, tal y como la consume Analytics.
 *
 * Los días sin registro son **huecos**, no ceros: nadie come cero calorías
 * (ver `buildNutritionSeries`).
 *
 * **Sin cifras de dinero, a propósito.** Aquí se sumaba «lo que costó lo
 * comido» y se enseñaba como «Gasto en comida», pero el dinero no sale al
 * comer: sale al comprar. Ese total no correspondía a ningún desembolso y
 * competía con el de finanzas, que sí. El gasto lo cuenta finanzas; nutrición
 * usa el precio para decidir qué comer, no para llevar cuentas (docs/04).
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
  /** Objetivo de calorias vigente, para dibujarlo; `null` si no hay. */
  readonly calorieTarget: number | null
}
