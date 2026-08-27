/** Objetivos diarios completos, que es lo que pide nutrición. */
export interface DailyTargets {
  readonly caloriesTarget: number
  readonly proteinGTarget: number
  readonly carbsGTarget: number
  readonly fatGTarget: number
  readonly waterMlTarget: number
}

/** Calorías por gramo de cada macro. */
const KCAL_PER_GRAM = { protein: 4, carbs: 4, fat: 9 } as const

/**
 * Cómo se reparten las calorías entre los tres macros.
 *
 * 30/40/30 es el reparto de manual: suficiente proteína para quien entrena, sin
 * dejar los carbohidratos por el suelo. **No es el mejor reparto para nadie en
 * concreto**, y por eso la pantalla dice que se puede cambiar: el objetivo aquí
 * es que nadie empiece con los cuatro campos en blanco, no acertar a la primera.
 */
const SHARE = { protein: 0.3, carbs: 0.4, fat: 0.3 } as const

/** Agua que se propone por kilo de peso, en mililitros. */
const ML_PER_KG = 35

/** Lo que se propone cuando no se sabe el peso. */
const DEFAULT_WATER_ML = 2000

/** Redondeo del agua, para no proponer «2.415 ml». */
const WATER_STEP_ML = 250

/**
 * Convierte una cifra de calorías en los cuatro objetivos que pide nutrición.
 *
 * Existe porque **el objetivo de nutrición es todo o nada**: la tabla guarda
 * calorías, los tres macros y el agua juntos, así que proponer sólo las calorías
 * dejaría la fila a medias. Se reparte con la proporción de manual y se avisa en
 * pantalla de que es un punto de partida.
 */
export function splitIntoTargets(calories: number, weightKg: number | null): DailyTargets {
  const grams = (share: number, kcalPerGram: number) => Math.round((calories * share) / kcalPerGram)

  const water = weightKg
    ? Math.round((weightKg * ML_PER_KG) / WATER_STEP_ML) * WATER_STEP_ML
    : DEFAULT_WATER_ML

  return {
    caloriesTarget: calories,
    proteinGTarget: grams(SHARE.protein, KCAL_PER_GRAM.protein),
    carbsGTarget: grams(SHARE.carbs, KCAL_PER_GRAM.carbs),
    fatGTarget: grams(SHARE.fat, KCAL_PER_GRAM.fat),
    waterMlTarget: water,
  }
}
