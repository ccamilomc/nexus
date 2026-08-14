/**
 * Calorías que aporta un gramo de cada macro.
 *
 * Son los factores de Atwater, los mismos que usa cualquier etiqueta de
 * alimentos.
 */
const KCAL_PER_GRAM = { protein: 4, carbs: 4, fat: 9 } as const

/**
 * Cuánto puede desviarse el reparto antes de avisar.
 *
 * Un diez por ciento absorbe los redondeos y la fibra, que aporta algo y no se
 * cuenta aquí. Avisar por menos sería dar la lata con objetivos que están bien.
 */
const TOLERANCE = 0.1

/** Las calorías que suman unos macros. */
export function caloriesFromMacros(proteinG: number, carbsG: number, fatG: number): number {
  return Math.round(
    proteinG * KCAL_PER_GRAM.protein + carbsG * KCAL_PER_GRAM.carbs + fatG * KCAL_PER_GRAM.fat,
  )
}

/**
 * Si los macros que se piden cuadran con las calorías que se piden.
 *
 * Sin esto se podían fijar 2.000 kcal y unos macros que suman 2.800: dos metas
 * que **no se pueden cumplir a la vez**, y la pantalla del día enseñándolas
 * como si nada. Es un aviso, no un impedimento —quien lo pone manda, y puede
 * tener sus razones—, pero callarlo sería dejar montar un objetivo imposible
 * sin decir nada.
 *
 * Devuelve `null` cuando cuadra o cuando falta algún número por escribir.
 */
export function checkGoalBalance(
  caloriesTarget: number,
  proteinG: number,
  carbsG: number,
  fatG: number,
): { readonly fromMacros: number; readonly difference: number } | null {
  const values = [caloriesTarget, proteinG, carbsG, fatG]
  if (values.some((value) => !Number.isFinite(value) || value <= 0)) return null

  const fromMacros = caloriesFromMacros(proteinG, carbsG, fatG)
  const difference = fromMacros - caloriesTarget

  if (Math.abs(difference) <= caloriesTarget * TOLERANCE) return null

  return { fromMacros, difference }
}
