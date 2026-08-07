import { useToday } from '@/core/time'
import type { DomainSummaryData, SummaryProgress } from '@/shared/types'

import { formatCalories, formatVolumeMl } from '../utils/format'
import { useActiveGoal, useDayNutrition, useDayWater } from './use-nutrition'

/**
 * Resumen de nutrición para otras pantallas (hoy, el dashboard).
 *
 * Sigue decidiendo **cómo se cuenta lo suyo**: quien lo muestra no sabe de
 * macros, metas ni unidades. Lo que se lleva y la meta viajan también como
 * cifras para poder dibujar el avance, pero la palabra y el formato los pone
 * este módulo.
 */
export type NutritionSummary = DomainSummaryData

/** Con objetivo se dice el avance; sin él, sólo la cifra. */
function describe(consumed: string, target: string | null): string {
  return target === null ? consumed : `${consumed} de ${target}`
}

export function useNutritionSummary(): NutritionSummary {
  const today = useToday()
  const day = useDayNutrition(today)
  const water = useDayWater(today)
  const goal = useActiveGoal()

  const isPending = day.isPending || water.isPending
  const calories = day.data?.totals.calories ?? 0
  const waterMl = water.data?.totalMl ?? 0

  const caloriesText = describe(
    formatCalories(calories),
    goal.data ? formatCalories(goal.data.calories_target) : null,
  )
  const waterText = describe(
    formatVolumeMl(waterMl),
    goal.data ? formatVolumeMl(goal.data.water_ml_target) : null,
  )

  // Sin objetivo no hay barra que pintar, y las cifras se quedan como frases:
  // una barra sin meta tendría que inventarse el 100 %.
  const progress: readonly SummaryProgress[] = goal.data
    ? [
        {
          label: 'Calorías',
          value: calories,
          target: goal.data.calories_target,
          display: caloriesText,
        },
        {
          label: 'Agua',
          value: waterMl,
          target: goal.data.water_ml_target,
          display: waterText,
        },
      ]
    : []

  return {
    isPending,
    isEmpty: !isPending && calories === 0 && waterMl === 0,
    lines: progress.length > 0 ? [] : [caloriesText, waterText],
    progress,
  }
}
