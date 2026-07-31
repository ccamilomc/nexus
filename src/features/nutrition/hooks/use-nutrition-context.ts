import { useToday } from '@/core/time'
import type { DailyContext, NutritionGoalSnapshot } from '@/decision-engine'

import { useActiveGoal, useDayNutrition, useDayWater } from './use-nutrition'

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

  const totals = day.data?.totals

  return {
    isPending: day.isPending || water.isPending || goal.isPending,
    nutrition: {
      todayIntake: {
        calories: totals?.calories ?? 0,
        proteinG: totals?.proteinG ?? 0,
        carbsG: totals?.carbsG ?? 0,
        fatG: totals?.fatG ?? 0,
      },
      // El gasto del día aún no se calcula por separado: el presupuesto de
      // nutrición es semanal. Se rellenará cuando alguna regla lo necesite.
      todaySpend: 0,
      todayWaterMl: water.data?.totalMl ?? 0,
    },
    goal: goal.data
      ? {
          calories: goal.data.calories_target,
          proteinG: goal.data.protein_g_target,
          carbsG: goal.data.carbs_g_target,
          fatG: goal.data.fat_g_target,
          waterMl: goal.data.water_ml_target,
          ...(goal.data.weekly_food_budget === null
            ? {}
            : { weeklyFoodBudget: goal.data.weekly_food_budget }),
        }
      : undefined,
  }
}
