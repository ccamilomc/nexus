import type {
  MealLog,
  MealLogItemWithFood,
  MealType,
  RepeatableMeal,
  RepeatableMeals,
} from '../types/nutrition.types'

/**
 * Cuántas combinaciones se ofrecen por comida.
 *
 * Tres cubren lo que uno come de verdad —el desayuno de siempre, el de los días
 * con prisa y poco más— sin convertir la comida vacía en un menú que haya que
 * leer. La cuarta ya se elige más rápido buscándola.
 */
const MAX_SUGGESTIONS = 3

/**
 * Las combinaciones que más se repiten en cada comida, de lo ya registrado.
 *
 * **Dos comidas son la misma si llevan los mismos alimentos**, aunque las
 * cantidades cambien: «arroz, pollo y ensalada» es el mismo almuerzo se coma
 * porción y media o dos. Las cantidades que se ofrecen son las de la última
 * vez, que es la mejor apuesta.
 *
 * Se ordenan por **veces repetidas** y, a igualdad, por la más reciente. Lo que
 * uno come a menudo es lo que más probablemente vuelva a comer; la fecha sólo
 * desempata.
 *
 * Una comida que quedó vacía —se borró lo que tenía— no cuenta: repetir la nada
 * no sirve.
 */
export function buildRepeatableMeals(
  logs: readonly MealLog[],
  items: readonly MealLogItemWithFood[],
  mealTypes: readonly MealType[],
): RepeatableMeals {
  const itemsByLog = new Map<string, MealLogItemWithFood[]>()
  for (const item of items) {
    const current = itemsByLog.get(item.meal_log_id)
    if (current) current.push(item)
    else itemsByLog.set(item.meal_log_id, [item])
  }

  const result: Record<string, RepeatableMeal[]> = {}

  for (const mealType of mealTypes) {
    const byCombination = new Map<string, RepeatableMeal>()

    for (const log of logs) {
      if (log.meal_type !== mealType) continue

      const logItems = itemsByLog.get(log.id) ?? []
      if (logItems.length === 0) continue

      const key = combinationKey(logItems)
      const seen = byCombination.get(key)

      if (seen) {
        // Los registros llegan del más reciente al más antiguo, así que la
        // primera vez que se ve una combinación es la última que se comió: se
        // conservan esos alimentos y esas cantidades, y sólo sube la cuenta.
        byCombination.set(key, { ...seen, times: seen.times + 1 })
      } else {
        byCombination.set(key, { key, loggedAt: log.logged_at, times: 1, items: logItems })
      }
    }

    const suggestions = [...byCombination.values()]
      .sort((a, b) => b.times - a.times || b.loggedAt.localeCompare(a.loggedAt))
      .slice(0, MAX_SUGGESTIONS)

    if (suggestions.length > 0) result[mealType] = suggestions
  }

  return result
}

/**
 * Identifica una combinación por sus alimentos, sin importar el orden.
 *
 * Ordenar es lo que hace que «arroz y pollo» y «pollo y arroz» sean la misma
 * comida, que es como uno las piensa.
 */
function combinationKey(items: readonly MealLogItemWithFood[]): string {
  return [...new Set(items.map((item) => item.food_id))].sort().join('|')
}
