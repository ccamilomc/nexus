import { useToday } from '@/core/time'
import type {
  DailyContext,
  FoodSnapshot,
  LoggedFoodSnapshot,
  NutritionGoalSnapshot,
} from '@/decision-engine'

import type { DayNutrition, Food } from '../types/nutrition.types'
import { macrosForServings } from '../utils/macros'
import { useActiveGoal, useDayNutrition, useDayWater, useFoods } from './use-nutrition'

/** Parte del contexto diario que aporta nutrición. */
export interface NutritionContext {
  readonly isPending: boolean
  readonly nutrition: DailyContext['nutrition']
  /** Objetivos vigentes; `undefined` si el usuario no ha fijado ninguno. */
  readonly goal: NutritionGoalSnapshot | undefined
}

/**
 * Lo que el Decision Engine necesita saber de nutrición.
 *
 * Devuelve **datos**, no frases: el motor razona con ellos. Es el contrato
 * hermano de `useNutritionSummary`, que devuelve texto para el dashboard.
 */
export function useNutritionContext(): NutritionContext {
  const today = useToday()
  const day = useDayNutrition(today)
  const water = useDayWater(today)
  const goal = useActiveGoal()
  const foods = useFoods()

  const totals = day.data?.totals

  return {
    isPending: day.isPending || water.isPending || goal.isPending || foods.isPending,
    nutrition: {
      todayIntake: {
        calories: totals?.calories ?? 0,
        proteinG: totals?.proteinG ?? 0,
        carbsG: totals?.carbsG ?? 0,
        fatG: totals?.fatG ?? 0,
      },
      todayWaterMl: water.data?.totalMl ?? 0,
      todayFoods: loggedFoods(day.data),
      pantry: (foods.data ?? []).map(toFoodSnapshot),
    },
    goal: goal.data
      ? {
          calories: goal.data.calories_target,
          proteinG: goal.data.protein_g_target,
          carbsG: goal.data.carbs_g_target,
          fatG: goal.data.fat_g_target,
          waterMl: goal.data.water_ml_target,
        }
      : undefined,
  }
}

/**
 * Lo comido hoy, alimento a alimento.
 *
 * Se aplana desde las comidas del día porque el motor razona sobre alimentos
 * concretos —para proponer una alternativa hay que saber a qué—, no sobre los
 * totales que le bastan al dashboard.
 */
function loggedFoods(day: DayNutrition | null | undefined): readonly LoggedFoodSnapshot[] {
  if (!day) return []

  return day.meals.flatMap(({ mealType, items }) =>
    items.map((item) => {
      const macros = macrosForServings(item.food, item.servings)
      const cost = item.food.cost_per_serving

      return {
        foodId: item.food.id,
        name: item.food.name,
        mealType,
        servings: item.servings,
        calories: macros.calories,
        proteinG: macros.proteinG,
        // Sin precio se omite en vez de mandar un cero: el motor tiene que poder
        // distinguir «gratis» de «no sé cuánto cuesta».
        ...(cost === null ? {} : { costCop: cost * item.servings }),
      }
    }),
  )
}

function toFoodSnapshot(food: Food): FoodSnapshot {
  return {
    id: food.id,
    name: food.name,
    calories: food.calories,
    proteinG: food.protein_g,
    ...(food.cost_per_serving === null ? {} : { costPerServing: food.cost_per_serving }),
  }
}
