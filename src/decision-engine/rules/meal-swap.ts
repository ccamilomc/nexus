import type {
  DailyContext,
  FoodSnapshot,
  LoggedFoodSnapshot,
  MealType,
} from '../contracts/context.types'
import type { Recommendation } from '../contracts/recommendation.types'
import type { Rule } from '../contracts/rule.types'
import { formatAmount, formatCop } from './format'

/**
 * Ahorro mínimo para abrir la boca.
 *
 * Por debajo de esto la sugerencia es ruido: nadie cambia lo que come por
 * seiscientos pesos, y una recomendación que no mueve a nadie sólo entrena al
 * usuario a ignorar las siguientes.
 */
const MIN_SAVING_COP = 2000

/** A partir de aquí el ahorro es de los que se notan en el mercado del mes. */
const NOTABLE_SAVING_COP = 10000

/**
 * Tope de porciones de la alternativa.
 *
 * Sin él la regla propondría seis porciones de arroz para igualar una
 * hamburguesa: sale barato en la hoja de cálculo y es incomible.
 */
const MAX_SERVINGS = 4

const MEAL_LABELS: Readonly<Record<MealType, string>> = {
  breakfast: 'El desayuno',
  lunch: 'El almuerzo',
  dinner: 'La cena',
  snack: 'Ese snack',
}

/** Una alternativa concreta encontrada para un alimento registrado. */
interface Swap {
  readonly logged: LoggedFoodSnapshot
  readonly loggedCost: number
  readonly alternative: FoodSnapshot
  readonly servings: number
  readonly cost: number
  readonly savingCop: number
  readonly calories: number
  readonly proteinG: number
}

/**
 * Propone una alternativa más barata a algo que ya se comió.
 *
 * Es la regla insignia de la **nutrición económica**, que es lo que distingue a
 * Nexus de cualquier contador de calorías: no basta con saber qué comes, hay
 * que saber lo que te cuesta y si existe algo igual de bueno por menos.
 *
 * Mira hacia **adelante, no hacia atrás**. El alimento ya se comió y eso no
 * tiene vuelta; lo que se sugiere es para la próxima vez, y la app tiene un
 * «repetir comida» que lo hace accionable de un toque.
 *
 * Sólo propone alternativas que **no empeoran la comida**: han de aportar al
 * menos las mismas calorías y la misma proteína. Abaratar a costa de comer peor
 * no es un consejo, es un recorte, y el usuario no lo pidió.
 */
export const mealSwapRule: Rule = {
  id: 'meal-swap@1',

  appliesTo(context: DailyContext): boolean {
    const { todayFoods, pantry } = context.nutrition

    return (
      todayFoods.some((food) => food.costCop !== undefined) &&
      pantry.some((food) => food.costPerServing !== undefined)
    )
  },

  evaluate(context: DailyContext): readonly Recommendation[] {
    const best = bestSwap(context)
    if (best === null || best.savingCop < MIN_SAVING_COP) return []

    const { logged, alternative, servings, cost, savingCop, loggedCost } = best
    const meal = MEAL_LABELS[logged.mealType]
    const portions = `${formatAmount(servings)} ${servings === 1 ? 'porción' : 'porciones'}`

    return [
      {
        type: 'meal_swap',
        domain: 'nutrition',
        priority: savingCop >= NOTABLE_SAVING_COP ? 'high' : 'medium',
        title: `${meal} puede salir más barato`,
        message: `La próxima vez, ${portions} de ${alternative.name} en lugar de ${logged.name}: ${formatCop(savingCop)} menos.`,
        reason: `${logged.name} aportó ${Math.round(logged.calories)} kcal y ${Math.round(logged.proteinG)} g de proteína por ${formatCop(loggedCost)}; la alternativa da ${Math.round(best.calories)} kcal y ${Math.round(best.proteinG)} g por ${formatCop(cost)}.`,
        data: {
          replacedFoodId: logged.foodId,
          alternativeFoodId: alternative.id,
          servings,
          savingCop,
          mealType: logged.mealType,
        },
      },
    ]
  },
}

/**
 * La sustitución que más ahorra de todas las posibles.
 *
 * Se devuelve **una sola**: un plan que abre con seis sugerencias de comida no
 * se lee. La de mayor ahorro es además la más fácil de justificar.
 */
function bestSwap(context: DailyContext): Swap | null {
  const { todayFoods, pantry } = context.nutrition
  let best: Swap | null = null

  for (const logged of todayFoods) {
    if (logged.costCop === undefined || logged.costCop <= 0) continue

    for (const alternative of pantry) {
      const swap = trySwap(logged, logged.costCop, alternative)
      if (swap !== null && (best === null || swap.savingCop > best.savingCop)) best = swap
    }
  }

  return best
}

/** Comprueba si un alimento de la despensa puede sustituir a lo registrado. */
function trySwap(
  logged: LoggedFoodSnapshot,
  loggedCost: number,
  alternative: FoodSnapshot,
): Swap | null {
  if (alternative.id === logged.foodId) return null
  if (alternative.costPerServing === undefined || alternative.costPerServing <= 0) return null
  if (alternative.calories <= 0) return null

  // Porciones necesarias para no bajar de calorías, en cuartos: nadie sirve
  // 2,37 porciones de nada.
  const servings = Math.ceil((logged.calories / alternative.calories) * 4) / 4
  if (servings <= 0 || servings > MAX_SERVINGS) return null

  const proteinG = alternative.proteinG * servings
  if (proteinG < logged.proteinG) return null

  const cost = alternative.costPerServing * servings
  const savingCop = Math.round(loggedCost - cost)
  if (savingCop <= 0) return null

  return {
    logged,
    loggedCost,
    alternative,
    servings,
    cost,
    savingCop,
    calories: alternative.calories * servings,
    proteinG,
  }
}
