import { z } from 'zod'

const MAX_SERVINGS = 100

/**
 * Cantidad consumida de un alimento, en porciones.
 *
 * Admite decimales (media porción es normal) pero no cero: registrar «nada»
 * no es un registro.
 */
export const addFoodSchema = z.object({
  servings: z
    .number('Escribe la cantidad.')
    .positive('Debe ser mayor que cero.')
    .max(MAX_SERVINGS, `Máximo ${MAX_SERVINGS}.`),
})

export type AddFoodValues = z.infer<typeof addFoodSchema>

const MAX_NAME_LENGTH = 80
const MAX_UNIT_LENGTH = 12
const MAX_MACRO = 10_000
const MAX_COST_COP = 10_000_000

/** Un macro en gramos: nunca negativo, con un tope que descarta erratas. */
const macroGrams = z.number('Escribe un número.').min(0, 'No puede ser negativo.').max(MAX_MACRO)

/**
 * Alimento propio del usuario.
 *
 * Los macros son **por porción**, no por 100 g: así se puede registrar tanto
 * «100 g de arroz» como «1 hamburguesa» sin forzar al usuario a calcular nada.
 * El coste va en pesos colombianos y es opcional (ver docs/11 y el modelo).
 */
export const createFoodSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Escribe un nombre.')
    .max(MAX_NAME_LENGTH, `Máximo ${MAX_NAME_LENGTH} caracteres.`),
  brand: z.string().trim().max(MAX_NAME_LENGTH, `Máximo ${MAX_NAME_LENGTH} caracteres.`).optional(),
  servingSize: z
    .number('Escribe el tamaño de la porción.')
    .positive('Debe ser mayor que cero.')
    .max(MAX_MACRO),
  servingUnit: z
    .string()
    .trim()
    .min(1, 'Escribe la unidad.')
    .max(MAX_UNIT_LENGTH, `Máximo ${MAX_UNIT_LENGTH} caracteres.`),
  calories: macroGrams,
  proteinG: macroGrams,
  carbsG: macroGrams,
  fatG: macroGrams,
  /** Precio de una porción, en pesos colombianos. */
  costPerServing: z
    .number()
    .min(0, 'No puede ser negativo.')
    .max(MAX_COST_COP, 'Revisa el precio.')
    .optional(),
})

export type CreateFoodValues = z.infer<typeof createFoodSchema>

const MAX_CALORIES_TARGET = 20_000
const MAX_MACRO_TARGET = 2000
const MAX_WATER_TARGET_ML = 20_000
const MAX_WEEKLY_BUDGET_COP = 50_000_000

/** Un objetivo diario: entero y mayor que cero (una meta de cero no es meta). */
const dailyTarget = (max: number) =>
  z
    .number('Escribe un número.')
    .int('Sin decimales.')
    .positive('Debe ser mayor que cero.')
    .max(max, 'Revisa el valor.')

/** Metas diarias de nutrición. El presupuesto llega en su propio incremento. */
export const nutritionGoalSchema = z.object({
  caloriesTarget: dailyTarget(MAX_CALORIES_TARGET),
  proteinGTarget: dailyTarget(MAX_MACRO_TARGET),
  carbsGTarget: dailyTarget(MAX_MACRO_TARGET),
  fatGTarget: dailyTarget(MAX_MACRO_TARGET),
  waterMlTarget: dailyTarget(MAX_WATER_TARGET_ML),
  /** Presupuesto semanal de comida, en pesos colombianos. Opcional. */
  weeklyFoodBudget: z
    .number()
    .min(0, 'No puede ser negativo.')
    .max(MAX_WEEKLY_BUDGET_COP, 'Revisa el presupuesto.')
    .optional(),
})

export type NutritionGoalValues = z.infer<typeof nutritionGoalSchema>
