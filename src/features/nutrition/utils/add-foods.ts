import type { AddFoodsInput } from '../services/nutrition.service'
import type {
  DayNutrition,
  Food,
  FoodRef,
  MealEntry,
  MealLogItemWithFood,
  RepeatableMeals,
} from '../types/nutrition.types'
import { macrosForItems, sumMacros } from './macros'

/**
 * El día con los alimentos recién apuntados, para verlos antes de que salgan.
 *
 * Los macros se **recalculan** con la misma función que los calcula al leerlos
 * del servidor, y no se suman a mano: aquí sí se tienen todos los items de la
 * comida delante, así que rehacerlos es exacto y evita dos criterios distintos
 * para la misma cifra.
 *
 * `log` se deja como estaba —`null` si la comida aún no existía— porque el
 * registro de la comida lo crea el servidor y la pantalla no lo necesita para
 * pintar lo que se acaba de añadir.
 */
export function addFoodsToDay(
  day: DayNutrition,
  input: AddFoodsInput,
  known: readonly FoodRef[],
): DayNutrition {
  const added = toItems(input, known)
  if (added.length === 0) return day

  const meals = day.meals.map((meal) =>
    meal.mealType === input.mealType ? withItems(meal, added) : meal,
  )

  return { meals, totals: sumMacros(meals.map(({ macros }) => macros)) }
}

/** La comida con los alimentos dentro y sus macros al día. */
function withItems(meal: MealEntry, added: readonly MealLogItemWithFood[]): MealEntry {
  const items = [...meal.items, ...added]

  return { ...meal, items, macros: macrosForItems(items) }
}

/**
 * Los alimentos elegidos, con sus datos puestos.
 *
 * El que no aparezca entre los conocidos se deja fuera en lugar de pintarse sin
 * macros: una comida con un alimento en blanco descuadraría el total del día.
 */
function toItems(input: AddFoodsInput, known: readonly FoodRef[]): MealLogItemWithFood[] {
  const items: MealLogItemWithFood[] = []

  for (const item of input.items) {
    const food = known.find(({ id }) => id === item.foodId)
    if (!food) continue

    items.push({
      id: item.id,
      // Vacío mientras la comida no exista en la base; la pantalla no lo usa.
      meal_log_id: '',
      food_id: item.foodId,
      servings: item.servings,
      created_at: input.loggedAt,
      updated_at: input.loggedAt,
      food,
    })
  }

  return items
}

/**
 * De dónde salen los datos de los alimentos para pintarlos sin servidor.
 *
 * Se mira en tres sitios porque **cada pantalla carga los suyos**, y esto se
 * descubrió probando: repitiendo una comida no había catálogo en la caché
 * —sólo se trae al abrir el buscador—, así que el desayuno seguía diciendo
 * «Sin registros» después de apuntarlo.
 *
 * 1. **El catálogo**, si se llegó por el buscador de alimentos.
 * 2. **Las combinaciones repetibles**, que es de donde se repite una comida.
 * 3. **Lo ya comido hoy**, para lo que se añade dos veces al mismo día.
 */
export function knownFoods(
  catalogue: readonly Food[] | undefined,
  repeatable: RepeatableMeals | undefined,
  day: DayNutrition | null,
): readonly FoodRef[] {
  const byId = new Map<string, FoodRef>()

  for (const food of catalogue ?? []) byId.set(food.id, toRef(food))
  for (const meals of Object.values(repeatable ?? {})) {
    for (const meal of meals ?? []) {
      for (const item of meal.items) byId.set(item.food.id, item.food)
    }
  }
  for (const meal of day?.meals ?? []) {
    for (const item of meal.items) byId.set(item.food.id, item.food)
  }

  return [...byId.values()]
}

function toRef(food: Food): FoodRef {
  return {
    id: food.id,
    name: food.name,
    brand: food.brand,
    serving_size: food.serving_size,
    serving_unit: food.serving_unit,
    calories: food.calories,
    protein_g: food.protein_g,
    carbs_g: food.carbs_g,
    fat_g: food.fat_g,
    cost_per_serving: food.cost_per_serving,
  }
}
